package com.example.megibackend.Service;

import com.example.megibackend.Config.PrinterProperties;
import com.example.megibackend.Config.PrinterProperties.Target;
import com.example.megibackend.Dto.Ticket;
import com.example.megibackend.Dto.TicketType;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.print.Doc;
import javax.print.DocFlavor;
import javax.print.DocPrintJob;
import javax.print.PrintException;
import javax.print.PrintServiceLookup;
import javax.print.SimpleDoc;
import javax.print.attribute.standard.QueuedJobCount;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Šalje tikete na printere kao sirove ESC/POS bajtove i PROVJERAVA jesu li isprintani:
 *  - LAN (kuhinja): prije i poslije ispisa pita printer za stanje (DLE EOT) —
 *    nema papira, otvoren poklopac, greška. Ako printer ne odgovara na status
 *    (stariji LAN modul), ispis se smatra uspješnim kao i prije.
 *  - USB (šank, Windows spooler): nakon slanja čeka da se posao isprazni iz
 *    Windows reda. Ako ostane u redu, printer ne ispisuje (papir, struja, kabel)
 *    -> red se čisti da se tiket ne bi kasnije isprintao DVA puta.
 *
 * Neuspjeli automatski ispisi čuvaju se po printeru u listi "neisprintano"
 * (GET /api/print/failed) i mogu se ponovno poslati kad se problem riješi.
 * Lista je u memoriji — restart backenda je briše.
 *
 * Rutiranje:
 *  - KITCHEN, STORNO_KITCHEN          -> kuhinja
 *  - BAR, BILL, STORNO_BAR, REPORT    -> šank
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrintService {

    public enum Printer { KITCHEN, BAR }

    /** Neuspjeli ispis koji čeka ponovni pokušaj. */
    public record FailedJob(long id, Printer printer, String printerLabel, List<Ticket> tickets,
                            String error, LocalDateTime failedAt, int attempts) {
        FailedJob retried(String newError) {
            return new FailedJob(id, printer, printerLabel, tickets, newError, LocalDateTime.now(), attempts + 1);
        }
    }

    /** Rezultat automatskog printa. */
    public record Outcome(boolean printed, String error) {}

    private static final byte DLE = 0x10, EOT = 0x04;

    private final PrinterProperties props;
    private final EscPosFormatter formatter;
    // adrese printera: Admin -> Postavke (baza), inače application.properties
    private final SettingsService settingsService;

    private final Map<Long, FailedJob> failed = new ConcurrentHashMap<>();
    private final AtomicLong failedSeq = new AtomicLong();

    /**
     * Pozadinski red za automatski ispis. Jedna nit = tiketi idu na printer
     * točno redom kojim su narudžbe stigle; zahtjev "Naruči" ne čeka printer.
     */
    private final ExecutorService printQueue = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "print-queue");
        t.setDaemon(true);
        return t;
    });

    /** Printer koji ne odgovara na DLE EOT — status se više ne pita (štedi ~2 s po tiketu). */
    private final java.util.Set<String> noStatusSupport = ConcurrentHashMap.newKeySet();

    @PreDestroy
    void shutdown() {
        printQueue.shutdown();
        try {
            // pričekaj da tiketi u redu odu na printer prije gašenja
            if (!printQueue.awaitTermination(15, TimeUnit.SECONDS)) printQueue.shutdownNow();
        } catch (InterruptedException e) {
            printQueue.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    public boolean isEnabled() {
        return props.enabled();
    }

    // ==================== ISPIS ====================

    /**
     * Ručni ispis (POST /api/print — npr. izvještaj, ispis iz pregleda).
     * Baca BusinessRuleException s porukom za konobara ako neki printer nije ispisao.
     * @return false ako je print isključen (app.printer.enabled=false)
     */
    public boolean print(List<Ticket> tickets) {
        if (tickets == null || tickets.isEmpty()) return props.enabled();
        if (!props.enabled()) {
            log.info("Print isključen (app.printer.enabled=false) — preskačem {} tiketa", tickets.size());
            return false;
        }

        Map<Printer, String> errors = sendAll(group(tickets));
        if (!errors.isEmpty()) {
            throw new BusinessRuleException(message(errors));
        }
        return true;
    }

    /**
     * Automatski print nakon akcije na narudžbi — U POZADINI.
     * Vraća odmah (printed=true znači "poslano u red za ispis"), pa konobar ne
     * čeka printer (LAN drži vezu ~3 s). Ako printer ne ispiše, tiketi idu na
     * listu neisprintanih -> frontend PrintAlerts (provjera svakih 5 s).
     */
    public Outcome tryPrint(List<Ticket> tickets) {
        if (tickets == null || tickets.isEmpty() || !props.enabled()) {
            return new Outcome(false, null);
        }
        List<Ticket> copy = List.copyOf(tickets);
        try {
            printQueue.submit(() -> printNow(copy));
        } catch (java.util.concurrent.RejectedExecutionException e) {
            // backend se gasi — ispiši odmah da tiket ne nestane
            return printNow(copy);
        }
        return new Outcome(true, null);
    }

    /** Stvarni ispis s provjerom; neuspjeh ide na listu neisprintanih. NIKAD ne baca iznimku. */
    private Outcome printNow(List<Ticket> tickets) {
        Map<Printer, List<Ticket>> jobs = group(tickets);
        try {
            Map<Printer, String> errors = sendAll(jobs);
            if (errors.isEmpty()) return new Outcome(true, null);

            errors.forEach((printer, error) -> remember(printer, jobs.get(printer), error));
            return new Outcome(false, message(errors));
        } catch (RuntimeException e) {
            // neočekivano (npr. formatiranje) — i dalje ništa ne smije nestati
            log.error("Automatski print nije uspio", e);
            String error = "Ispis nije uspio: " + e.getMessage();
            jobs.forEach((printer, list) -> remember(printer, list, error));
            return new Outcome(false, error);
        }
    }

    private void remember(Printer printer, List<Ticket> tickets, String error) {
        long id = failedSeq.incrementAndGet();
        failed.put(id, new FailedJob(id, printer, label(printer), tickets, error, LocalDateTime.now(), 1));
    }

    // ==================== NEISPRINTANO ====================

    /** Neisprintani tiketi, najstariji prvi. */
    public List<FailedJob> failedJobs() {
        return failed.values().stream()
                .sorted(Comparator.comparingLong(FailedJob::id))
                .toList();
    }

    /** Ponovno pošalji neuspjeli ispis; uspjeh ga briše s liste. */
    public void retry(long id) {
        FailedJob job = failed.get(id);
        if (job == null) throw new NotFoundException("Ispis " + id + " nije na listi neisprintanih.");
        try {
            send(job.printer(), format(job.tickets()));
            failed.remove(id);
            log.info("Ponovni ispis #{} na {} uspio", id, job.printerLabel());
        } catch (IOException e) {
            String error = problem(job.printer(), e);
            failed.put(id, job.retried(error));
            throw new BusinessRuleException(error);
        }
    }

    /** Ukloni s liste bez ispisa (npr. tiket je napisan rukom). */
    public void dismiss(long id) {
        if (failed.remove(id) == null) {
            throw new NotFoundException("Ispis " + id + " nije na listi neisprintanih.");
        }
    }

    // ==================== TEST / STATUS ====================

    /** Probna stranica — za podešavanje IP-a i kodne stranice. */
    public void printTest(Printer printer) {
        try {
            send(printer, formatter.testPage(label(printer), address(printer)));
        } catch (IOException e) {
            throw new BusinessRuleException(problem(printer, e));
        }
    }

    /** Stanje printera za Admin -> Postavke (bez ispisa). */
    public record PrinterCheck(String printer, String address, boolean ok, String message) {}

    /**
     * Provjera bez ispisa:
     *  - LAN: spajanje + upit stanja (papir, poklopac)
     *  - USB: postoji li printer u Windowsima i čeka li nešto u redu
     */
    public PrinterCheck check(Printer printer) {
        Target t = target(printer);
        String address = address(printer);
        if (t == null || !t.isConfigured()) {
            return new PrinterCheck(label(printer), address, false, "Printer nije podešen.");
        }
        if (t.isUsb()) {
            javax.print.PrintService service = java.util.Arrays
                    .stream(PrintServiceLookup.lookupPrintServices(null, null))
                    .filter(ps -> ps.getName().equalsIgnoreCase(t.windowsName()))
                    .findFirst().orElse(null);
            if (service == null) {
                return new PrinterCheck(label(printer), address, false,
                        "Printer '" + t.windowsName() + "' nije instaliran u Windowsima.");
            }
            QueuedJobCount queued = service.getAttribute(QueuedJobCount.class);
            if (queued != null && queued.getValue() > 0) {
                return new PrinterCheck(label(printer), address, false,
                        queued.getValue() + " posao/poslova čeka u Windows redu — printer možda ne ispisuje.");
            }
            return new PrinterCheck(label(printer), address, true, "Instaliran, red čekanja je prazan.");
        }
        synchronized (this) {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(t.host(), t.port()), props.timeoutMs());
                String key = t.host() + ":" + t.port();
                noStatusSupport.remove(key); // ručna provjera uvijek pita printer
                String problem = readStatus(socket.getOutputStream(), socket.getInputStream(), key);
                if (problem != null) return new PrinterCheck(label(printer), address, false, problem);
                return new PrinterCheck(label(printer), address, true,
                        noStatusSupport.contains(key)
                                ? "Dostupan (printer ne javlja stanje papira)."
                                : "Dostupan, papir u redu.");
            } catch (IOException e) {
                return new PrinterCheck(label(printer), address, false, problem(printer, e));
            }
        }
    }

    /** Imena printera instaliranih u Windowsima — za odabir šank printera u Adminu. */
    public List<String> windowsPrinters() {
        return java.util.Arrays.stream(PrintServiceLookup.lookupPrintServices(null, null))
                .map(javax.print.PrintService::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    public static Printer route(TicketType type) {
        return switch (type) {
            case KITCHEN, STORNO_KITCHEN -> Printer.KITCHEN;
            case BAR, BILL, STORNO_BAR, REPORT -> Printer.BAR;
        };
    }

    // ==================== SLANJE ====================

    private Map<Printer, List<Ticket>> group(List<Ticket> tickets) {
        Map<Printer, List<Ticket>> jobs = new EnumMap<>(Printer.class);
        for (Ticket t : tickets) {
            jobs.computeIfAbsent(route(t.type()), p -> new ArrayList<>()).add(t);
        }
        return jobs;
    }

    private byte[] format(List<Ticket> tickets) {
        ByteArrayOutputStream data = new ByteArrayOutputStream();
        for (Ticket t : tickets) data.writeBytes(formatter.format(t));
        return data.toByteArray();
    }

    /** Šalje svaki printer posebno; vraća greške po printeru (prazno = sve isprintano). */
    private Map<Printer, String> sendAll(Map<Printer, List<Ticket>> jobs) {
        Map<Printer, String> errors = new EnumMap<>(Printer.class);
        jobs.forEach((printer, list) -> {
            try {
                send(printer, format(list));
            } catch (IOException e) {
                log.error("Print na {} nije uspio: {}", label(printer), e.getMessage());
                errors.put(printer, problem(printer, e));
            }
        });
        return errors;
    }

    // synchronized: printer na 9100 prima jednu konekciju; dva konobara u istoj sekundi čekaju red
    private synchronized void send(Printer printer, byte[] data) throws IOException {
        Target t = target(printer);
        if (t == null || !t.isConfigured()) {
            throw new IOException("nije upisana IP adresa ni windows-name (app.printer."
                    + printer.name().toLowerCase() + ".*)");
        }
        if (t.isUsb()) {
            sendToWindowsPrinter(t.windowsName(), data);
        } else {
            sendToLan(t, data);
        }
    }

    private void sendToLan(Target t, byte[] data) throws IOException {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(t.host(), t.port()), props.timeoutMs());
            OutputStream out = socket.getOutputStream();
            InputStream in = socket.getInputStream();

            // 1) prije ispisa: ima li papira, je li poklopac zatvoren
            String key = t.host() + ":" + t.port();
            String before = readStatus(out, in, key);
            if (before != null) throw new IOException(before);

            socket.setSoTimeout(props.timeoutMs());
            out.write(data);
            out.flush();

            // Datecs LAN modul baca sve što još nije isprintao čim se veza zatvori
            // (i FIN preko shutdownOutput) — zato vezu držimo otvorenom dok ne
            // isprinta: bazno čekanje + 1 ms po bajtu, najviše 6 s.
            long wait = Math.min(props.lanCloseDelayMs() + data.length, 6000);
            sleep(wait);

            // 2) poslije ispisa: je li papir nestao usred tiketa
            String after = readStatus(out, in, key);
            if (after != null) throw new IOException(after + " tijekom ispisa — tiket nije cijeli");
        }
    }

    /**
     * ESC/POS real-time status (DLE EOT n). Vraća opis problema ili null ako je sve u redu
     * ili printer ne odgovara na status (tada se ponašamo kao prije — bez provjere).
     *  n=2 (offline uzrok): bit2 poklopac otvoren, bit5 ispis stao zbog papira, bit6 greška
     *  n=4 (senzor papira): bit2/3 papir pri kraju (samo upozorenje), bit5/6 nema papira
     */
    private String readStatus(OutputStream out, InputStream in, String key) throws IOException {
        if (!props.statusCheck()) return null;
        if (key != null && noStatusSupport.contains(key)) return null;
        while (in.available() > 0) in.read(); // počisti eventualne stare bajtove

        Integer offline = query(out, in, 2);
        Integer paper = query(out, in, 4);
        if (offline == null && paper == null && key != null) {
            // printer ne zna DLE EOT — ne pitaj ga više do restarta (inače +2 s po tiketu)
            noStatusSupport.add(key);
            log.warn("Printer {} ne odgovara na upit stanja — provjera papira isključena za njega", key);
            return null;
        }

        if (paper != null && (paper & 0x60) != 0) return "nema papira";
        if (offline != null && (offline & 0x20) != 0) return "nema papira";
        if (offline != null && (offline & 0x04) != 0) return "otvoren poklopac";
        if (offline != null && (offline & 0x40) != 0) return "greška printera (rezač / pregrijavanje)";
        if (paper != null && (paper & 0x0C) != 0) log.warn("Papir pri kraju na kuhinjskom printeru");
        return null;
    }

    private Integer query(OutputStream out, InputStream in, int n) throws IOException {
        out.write(new byte[]{DLE, EOT, (byte) n});
        out.flush();
        try {
            int b = readWithTimeout(in);
            // ispravan status bajt: bit0=0, bit1=1, bit4=1, bit7=0
            if (b < 0 || (b & 0x93) != 0x12) {
                log.debug("Printer vratio neočekivan status bajt {} za DLE EOT {}", b, n);
                return null;
            }
            return b;
        } catch (SocketTimeoutException e) {
            log.debug("Printer ne odgovara na DLE EOT {} — preskačem provjeru", n);
            return null;
        }
    }

    private int readWithTimeout(InputStream in) throws IOException {
        long deadline = System.currentTimeMillis() + props.statusTimeoutMs();
        while (System.currentTimeMillis() < deadline) {
            if (in.available() > 0) return in.read();
            sleep(20);
        }
        throw new SocketTimeoutException("status timeout");
    }

    /**
     * USB printer preko Windows spoolera. Spooler prihvati posao i kad je printer
     * ugašen ili bez papira, pa nakon slanja čekamo da se posao isprazni iz reda.
     * Ako ostane u redu -> printer ne ispisuje: red se čisti (da se tiket ne bi
     * isprintao sam kasnije, nakon što ga konobar ponovno pošalje) i javlja greška.
     */
    private void sendToWindowsPrinter(String name, byte[] data) throws IOException {
        javax.print.PrintService service = java.util.Arrays
                .stream(PrintServiceLookup.lookupPrintServices(null, null))
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseThrow(() -> new IOException("Windows printer '" + name + "' nije instaliran"));

        DocPrintJob job = service.createPrintJob();
        Doc doc = new SimpleDoc(data, DocFlavor.BYTE_ARRAY.AUTOSENSE, null);
        try {
            job.print(doc, null);
        } catch (PrintException e) {
            throw new IOException(e.getMessage(), e);
        }

        if (!props.statusCheck()) return;

        long deadline = System.currentTimeMillis() + props.usbConfirmMs();
        while (System.currentTimeMillis() < deadline) {
            QueuedJobCount queued = service.getAttribute(QueuedJobCount.class);
            if (queued == null) return;           // Windows ne javlja red — ne možemo provjeriti
            if (queued.getValue() == 0) return;   // posao je otišao u printer
            sleep(200);
        }

        clearWindowsQueue(name);
        throw new IOException("ne ispisuje — posao je zapeo u Windows redu (papir, napajanje ili kabel)");
    }

    /** Briše zapele poslove iz Windows reda (PowerShell Get-PrintJob | Remove-PrintJob). */
    private void clearWindowsQueue(String name) {
        String safe = name.replace("'", "''");
        try {
            Process p = new ProcessBuilder("powershell", "-NoProfile", "-NonInteractive", "-Command",
                    "Get-PrintJob -PrinterName '" + safe + "' | Remove-PrintJob")
                    .redirectErrorStream(true)
                    .start();
            if (!p.waitFor(10, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                log.warn("Čišćenje Windows reda za '{}' nije završilo na vrijeme", name);
            } else if (p.exitValue() != 0) {
                log.warn("Čišćenje Windows reda za '{}' vratilo kod {}: {}", name, p.exitValue(),
                        new String(p.getInputStream().readAllBytes()).trim());
            } else {
                log.info("Očišćen Windows red čekanja za '{}'", name);
            }
        } catch (IOException e) {
            log.warn("Ne mogu očistiti Windows red za '{}': {}", name, e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // ==================== POMOĆNO ====================

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String problem(Printer printer, IOException e) {
        String reason = e.getMessage() == null ? "nije dostupan" : e.getMessage();
        if (e instanceof java.net.ConnectException || e instanceof SocketTimeoutException
                || e instanceof java.net.NoRouteToHostException) {
            reason = "nije dostupan (ugašen ili nije na mreži)";
        }
        return label(printer) + " printer (" + address(printer) + "): " + reason;
    }

    private String message(Map<Printer, String> errors) {
        return String.join("; ", errors.values())
                + ". Provjeri papir, poklopac, napajanje i kabel pa ponovi ispis.";
    }

    private Target target(Printer printer) {
        return printer == Printer.KITCHEN ? settingsService.kitchenTarget() : settingsService.barTarget();
    }

    private String address(Printer printer) {
        Target t = target(printer);
        if (t == null || !t.isConfigured()) return "nije podešen";
        return t.isUsb() ? "USB: " + t.windowsName() : t.host() + ":" + t.port();
    }

    private static String label(Printer printer) {
        return printer == Printer.KITCHEN ? "Kuhinjski" : "Šank";
    }
}
