package com.example.megibackend.Service;

import com.example.megibackend.Exceptions.BusinessRuleException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/**
 * Backup H2 baze.
 *
 * Kopija se radi H2 naredbom BACKUP TO '...zip' — konzistentna kopija DOK
 * APLIKACIJA RADI (obično kopiranje megi.mv.db u radu može dati oštećenu kopiju).
 *
 * Kada:
 *  - svaki dan u app.backup.cron (default 22:45, nakon auto-closea u 22:40)
 *  - pri pokretanju backenda ako je zadnji backup stariji od 24 h
 *    (PC se navečer često ugasi prije 22:45)
 *  - ručno: POST /api/backup (Admin -> Postavke)
 *
 * Gdje: app.backup.dir (default C:/megi/backup) + opcionalno druga lokacija iz
 * Admina (USB / Google Drive / OneDrive folder). U svakoj se čuva zadnjih
 * app.backup.keep (default 30) kopija; starije se brišu.
 *
 * Vraćanje: skripta scripts/vrati-backup.bat (backend mora biti ugašen).
 */
@Slf4j
@Service
public class BackupService {

    private static final String PREFIX = "megi-";
    private static final DateTimeFormatter NAME_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss");

    public record BackupFile(String name, long sizeBytes, LocalDateTime createdAt) {}

    public record BackupStatus(String dir, String secondaryDir, int keep,
                               BackupFile last, boolean stale,
                               String lastError, LocalDateTime lastErrorAt,
                               List<BackupFile> backups) {}

    private final JdbcTemplate jdbc;
    private final SettingsService settingsService;
    private final Path dir;
    private final int keep;

    private volatile String lastError;
    private volatile LocalDateTime lastErrorAt;

    public BackupService(JdbcTemplate jdbc,
                         SettingsService settingsService,
                         @Value("${app.backup.dir:C:/megi/backup}") String dir,
                         @Value("${app.backup.keep:30}") int keep) {
        this.jdbc = jdbc;
        this.settingsService = settingsService;
        this.dir = Path.of(dir);
        this.keep = Math.max(1, keep);
    }

    // ==================== RASPORED ====================

    @Scheduled(cron = "${app.backup.cron:0 45 22 * * *}")
    public void scheduled() {
        tryBackup("dnevni");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        BackupFile last = latest(dir);
        if (last == null || isOlderThan(last, Duration.ofHours(24))) {
            tryBackup("pri pokretanju");
        }
    }

    // ==================== BACKUP ====================

    /** Ručni backup — baca grešku s porukom za admina ako ne uspije. */
    public synchronized BackupFile backupNow() {
        try {
            return create();
        } catch (Exception e) {
            remember(e);
            throw new BusinessRuleException("Backup nije uspio: " + message(e));
        }
    }

    private synchronized void tryBackup(String reason) {
        try {
            BackupFile file = create();
            log.info("Backup ({}) napravljen: {} ({} KB)", reason, file.name(), file.sizeBytes() / 1024);
        } catch (Exception e) {
            remember(e);
            log.error("Backup ({}) nije uspio: {}", reason, message(e));
        }
    }

    private BackupFile create() throws IOException {
        Files.createDirectories(dir);
        String name = PREFIX + LocalDateTime.now().format(NAME_TIME) + ".zip";
        Path target = dir.resolve(name).toAbsolutePath();

        // H2: konzistentna kopija dok baza radi
        String sqlPath = target.toString().replace('\\', '/').replace("'", "''");
        jdbc.execute("BACKUP TO '" + sqlPath + "'");

        cleanup(dir);

        // druga lokacija — greška ovdje ne poništava glavni backup, ali se javlja adminu
        String secondary = settingsService.backupSecondaryDir();
        if (secondary != null) {
            try {
                Path second = Path.of(secondary);
                Files.createDirectories(second);
                Files.copy(target, second.resolve(name), StandardCopyOption.REPLACE_EXISTING);
                cleanup(second);
            } catch (Exception e) {
                remember(new IOException("glavni backup je napravljen, ali kopija u '" + secondary
                        + "' nije uspjela: " + message(e), e));
                return toFile(target);
            }
        }

        lastError = null;
        lastErrorAt = null;
        return toFile(target);
    }

    // ==================== STATUS ====================

    public BackupStatus status() {
        List<BackupFile> backups = list(dir);
        BackupFile last = backups.isEmpty() ? null : backups.get(0);
        boolean stale = last == null || isOlderThan(last, Duration.ofHours(48));
        return new BackupStatus(dir.toAbsolutePath().toString(), settingsService.backupSecondaryDir(),
                keep, last, stale, lastError, lastErrorAt, backups);
    }

    /** Najnoviji prvi. */
    private List<BackupFile> list(Path folder) {
        if (!Files.isDirectory(folder)) return List.of();
        try (Stream<Path> files = Files.list(folder)) {
            return files.filter(this::isBackup)
                    .map(this::toFileQuiet)
                    .filter(java.util.Objects::nonNull)
                    .sorted(Comparator.comparing(BackupFile::createdAt).reversed())
                    .toList();
        } catch (IOException e) {
            log.warn("Ne mogu pročitati folder backupa {}: {}", folder, e.getMessage());
            return List.of();
        }
    }

    private BackupFile latest(Path folder) {
        List<BackupFile> all = list(folder);
        return all.isEmpty() ? null : all.get(0);
    }

    /** Zadrži zadnjih `keep` kopija u folderu. */
    private void cleanup(Path folder) {
        List<BackupFile> all = list(folder);
        for (int i = keep; i < all.size(); i++) {
            try {
                Files.deleteIfExists(folder.resolve(all.get(i).name()));
            } catch (IOException e) {
                log.warn("Ne mogu obrisati stari backup {}: {}", all.get(i).name(), e.getMessage());
            }
        }
    }

    // ==================== POMOĆNO ====================

    private boolean isBackup(Path p) {
        String n = p.getFileName().toString();
        return n.startsWith(PREFIX) && n.endsWith(".zip") && Files.isRegularFile(p);
    }

    private BackupFile toFile(Path p) throws IOException {
        Instant modified = Files.getLastModifiedTime(p).toInstant();
        return new BackupFile(p.getFileName().toString(), Files.size(p),
                LocalDateTime.ofInstant(modified, ZoneId.systemDefault()));
    }

    private BackupFile toFileQuiet(Path p) {
        try {
            return toFile(p);
        } catch (IOException e) {
            return null;
        }
    }

    private static boolean isOlderThan(BackupFile f, Duration d) {
        return f.createdAt().isBefore(LocalDateTime.now().minus(d));
    }

    private void remember(Exception e) {
        lastError = message(e);
        lastErrorAt = LocalDateTime.now();
    }

    private static String message(Throwable e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) root = root.getCause();
        String m = root.getMessage() != null ? root.getMessage() : e.getMessage();
        return m != null ? m : e.getClass().getSimpleName();
    }
}
