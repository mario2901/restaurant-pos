package com.example.megibackend.Service;

import com.example.megibackend.Config.PrinterProperties;
import com.example.megibackend.Config.PrinterProperties.Target;
import com.example.megibackend.Dto.SettingsRequest;
import com.example.megibackend.Dto.SettingsResponse;
import com.example.megibackend.Entity.AppSettings;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Repository.AppSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Admin postavke (jedan red u app_settings).
 * Vrijednost iz baze ima prednost; ako je null, vrijedi application.properties.
 */
@Service
@Transactional
public class SettingsService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final AppSettingsRepository repository;
    private final PrinterProperties printerProps;
    private final LocalTime defaultDeliveryClose;
    private final LocalTime defaultAllClose;

    public SettingsService(AppSettingsRepository repository,
                           PrinterProperties printerProps,
                           @Value("${app.auto-close.delivery-time:15:30}") LocalTime defaultDeliveryClose,
                           @Value("${app.auto-close.all-time:22:40}") LocalTime defaultAllClose) {
        this.repository = repository;
        this.printerProps = printerProps;
        this.defaultDeliveryClose = defaultDeliveryClose;
        this.defaultAllClose = defaultAllClose;
    }

    // ==================== ČITANJE ====================

    @Transactional(readOnly = true)
    public AppSettings current() {
        return repository.findById(AppSettings.ID).orElseGet(AppSettings::new);
    }

    /** Ulazi li piće u izvještaje i skida li se zaliha. Default: ne. */
    @Transactional(readOnly = true)
    public boolean drinksTracked() {
        return current().isDrinksTracked();
    }

    @Transactional(readOnly = true)
    public LocalTime deliveryCloseTime() {
        LocalTime t = current().getDeliveryCloseTime();
        return t != null ? t : defaultDeliveryClose;
    }

    @Transactional(readOnly = true)
    public LocalTime allCloseTime() {
        LocalTime t = current().getAllCloseTime();
        return t != null ? t : defaultAllClose;
    }

    /** Kuhinjski printer: IP/port iz Admina, inače iz application.properties. */
    @Transactional(readOnly = true)
    public Target kitchenTarget() {
        AppSettings s = current();
        Target base = printerProps.kitchen();
        return new Target(
                notBlank(s.getKitchenHost()) ? s.getKitchenHost().trim() : (base != null ? base.host() : null),
                s.getKitchenPort() != null ? s.getKitchenPort() : (base != null ? base.port() : 9100),
                base != null ? base.windowsName() : null);
    }

    /** Šank: Windows ime (USB) ili IP/port iz Admina, inače iz application.properties. */
    @Transactional(readOnly = true)
    public Target barTarget() {
        AppSettings s = current();
        Target base = printerProps.bar();
        boolean adminSet = notBlank(s.getBarWindowsName()) || notBlank(s.getBarHost());
        if (!adminSet) {
            return base != null ? base : new Target(null, 9100, null);
        }
        return new Target(
                notBlank(s.getBarHost()) ? s.getBarHost().trim() : null,
                s.getBarPort() != null ? s.getBarPort() : 9100,
                notBlank(s.getBarWindowsName()) ? s.getBarWindowsName().trim() : null);
    }

    /** Dopuštene veličine stavki na kuhinji (visina x širina). */
    public static final String KITCHEN_FONT_DEFAULT = "2x2";
    private static final java.util.Set<String> KITCHEN_FONTS = java.util.Set.of("2x2", "3x2", "4x3");

    /** "2x2" | "3x2" | "4x3"; bilo što drugo (null, stara/nepoznata vrijednost) -> "2x2". */
    @Transactional(readOnly = true)
    public String kitchenFontSize() {
        String v = current().getKitchenFontSize();
        return v != null && KITCHEN_FONTS.contains(v) ? v : KITCHEN_FONT_DEFAULT;
    }

    /** Visina stavki na kuhinji kao množitelj: 2, 3 ili 4. */
    @Transactional(readOnly = true)
    public int kitchenFontHeight() {
        return Character.getNumericValue(kitchenFontSize().charAt(0));
    }

    /** Širina stavki na kuhinji kao množitelj: 2 ili 3. */
    @Transactional(readOnly = true)
    public int kitchenFontWidth() {
        return Character.getNumericValue(kitchenFontSize().charAt(2));
    }

    /** Zadano skraćivanje riječi na kuhinji (prvih 6 slova). */
    public static final int KITCHEN_WORD_LENGTH_DEFAULT = 6;

    /** Broj slova po riječi na kuhinjskom tiketu; 0 = bez skraćivanja. */
    @Transactional(readOnly = true)
    public int kitchenWordLength() {
        Integer v = current().getKitchenWordLength();
        if (v == null || v < 0) return KITCHEN_WORD_LENGTH_DEFAULT;
        return v;
    }

    @Transactional(readOnly = true)
    public String backupSecondaryDir() {
        String dir = current().getBackupSecondaryDir();
        return notBlank(dir) ? dir.trim() : null;
    }

    @Transactional(readOnly = true)
    public SettingsResponse toResponse() {
        AppSettings s = current();
        Target kitchen = kitchenTarget();
        Target bar = barTarget();
        return new SettingsResponse(
                s.isDrinksTracked(),
                deliveryCloseTime().format(HH_MM),
                allCloseTime().format(HH_MM),
                nullToEmpty(kitchen.host()),
                kitchen.port(),
                nullToEmpty(bar.windowsName()),
                nullToEmpty(bar.host()),
                bar.port(),
                nullToEmpty(backupSecondaryDir()),
                kitchenFontSize(),
                kitchenWordLength());
    }

    // ==================== IZMJENA ====================

    public SettingsResponse update(SettingsRequest r) {
        AppSettings s = repository.findById(AppSettings.ID).orElseGet(AppSettings::new);

        if (r.drinksTracked() != null) s.setDrinksTracked(r.drinksTracked());

        if (r.deliveryCloseTime() != null) s.setDeliveryCloseTime(LocalTime.parse(r.deliveryCloseTime()));
        if (r.allCloseTime() != null) s.setAllCloseTime(LocalTime.parse(r.allCloseTime()));
        LocalTime delivery = s.getDeliveryCloseTime() != null ? s.getDeliveryCloseTime() : defaultDeliveryClose;
        LocalTime all = s.getAllCloseTime() != null ? s.getAllCloseTime() : defaultAllClose;
        if (!delivery.isBefore(all)) {
            throw new BusinessRuleException("Zatvaranje dostave mora biti prije zatvaranja svih narudžbi.");
        }

        if (r.kitchenHost() != null) s.setKitchenHost(blankToNull(r.kitchenHost()));
        if (r.kitchenPort() != null) s.setKitchenPort(r.kitchenPort());
        if (r.barWindowsName() != null) s.setBarWindowsName(blankToNull(r.barWindowsName()));
        if (r.barHost() != null) s.setBarHost(blankToNull(r.barHost()));
        if (r.barPort() != null) s.setBarPort(r.barPort());

        if (r.backupSecondaryDir() != null) s.setBackupSecondaryDir(blankToNull(r.backupSecondaryDir()));
        if (r.kitchenFontSize() != null) s.setKitchenFontSize(r.kitchenFontSize());
        if (r.kitchenWordLength() != null) {
            int n = r.kitchenWordLength();
            // 1-2 slova kuhar ne bi razumio ("Pi Ca")
            if (n == 1 || n == 2) {
                throw new BusinessRuleException("Skraćivanje: 0 (bez skraćivanja) ili od 3 do 30 slova.");
            }
            s.setKitchenWordLength(n);
        }

        repository.save(s);
        return toResponse();
    }

    private static boolean notBlank(String v) {
        return v != null && !v.isBlank();
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private static String nullToEmpty(String v) {
        return v == null ? "" : v;
    }
}
