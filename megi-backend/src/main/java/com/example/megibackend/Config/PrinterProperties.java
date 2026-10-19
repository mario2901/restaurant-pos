package com.example.megibackend.Config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Postavke mrežnih printera (app.printer.* u application.properties).
 *
 * Datecs EP-2000: ESC/POS preko TCP-a (raw, najčešće port 9100).
 * Kodna stranica se bira s ESC u n — 4 = Latin 2 (CP852), 14 = CP1250.
 */
@ConfigurationProperties(prefix = "app.printer")
public record PrinterProperties(
        @DefaultValue("false") boolean enabled,
        Target kitchen,
        Target bar,
        @DefaultValue("Cp852") String charset,
        @DefaultValue("4") int codePage,
        @DefaultValue("false") boolean transliterate,
        @DefaultValue("48") int width,
        @DefaultValue("3000") int timeoutMs,
        @DefaultValue("true") boolean kitchenBeep,
        @DefaultValue("KM") String currency,
        @DefaultValue("2000") int lanCloseDelayMs,
        // provjera je li ispisano: LAN status (DLE EOT) + USB Windows red
        @DefaultValue("true") boolean statusCheck,
        // koliko dugo čekati odgovor printera na upit statusa (LAN)
        @DefaultValue("1000") int statusTimeoutMs,
        // koliko dugo smije posao stajati u Windows redu prije nego što se smatra zapelim (USB)
        @DefaultValue("6000") int usbConfirmMs,
        // Zaglavlje restorana na tiketima šanka (račun, storno šank, izvještaj) — red po red
        java.util.List<String> header) {

    /**
     * LAN: host + port.
     * USB: windowsName = ime printera u Windowsima (driver "Generic / Text Only");
     *      ako je upisan, ima prednost pred host-om.
     */
    public record Target(String host, @DefaultValue("9100") int port, String windowsName) {
        public boolean isUsb() {
            return windowsName != null && !windowsName.isBlank();
        }

        public boolean isConfigured() {
            return isUsb() || (host != null && !host.isBlank());
        }
    }
}
