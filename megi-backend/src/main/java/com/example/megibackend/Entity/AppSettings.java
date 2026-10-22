package com.example.megibackend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

/**
 * Postavke aplikacije koje mijenja admin — jedan red (id = 1) u tablici app_settings.
 * Ne treba restart: čitaju se pri svakoj narudžbi / ispisu / provjeri.
 *
 * Polja koja su null znače "nije postavljeno u Adminu" -> vrijedi vrijednost iz
 * application.properties (SettingsService to spaja).
 */
@Entity
@Table(name = "app_settings")
@Getter
@Setter
@NoArgsConstructor
public class AppSettings {

    public static final long ID = 1L;

    @Id
    private Long id = ID;

    /**
     * Obračun pića kroz program:
     *  true  -> piće ulazi u izvještaje i skida se sa zalihe
     *  false -> piće se kuca i ispisuje na računu, ali NE ulazi u izvještaje
     *           i NE dira zalihu (dok restoran ne krene s obračunom pića)
     */
    @Column(name = "drinks_tracked", nullable = false)
    private boolean drinksTracked = false;

    // ---- automatsko zatvaranje narudžbi ----

    /** Zatvaranje dostava napravljenih prije ovog vremena. */
    @Column(name = "delivery_close_time")
    private LocalTime deliveryCloseTime;

    /** Zatvaranje svih ostalih narudžbi napravljenih prije ovog vremena. */
    @Column(name = "all_close_time")
    private LocalTime allCloseTime;

    // ---- printeri ----

    @Column(name = "kitchen_host", length = 100)
    private String kitchenHost;

    @Column(name = "kitchen_port")
    private Integer kitchenPort;

    /** Šank preko USB-a: ime printera u Windowsima (ima prednost pred IP-om). */
    @Column(name = "bar_windows_name", length = 100)
    private String barWindowsName;

    @Column(name = "bar_host", length = 100)
    private String barHost;

    @Column(name = "bar_port")
    private Integer barPort;

    /**
     * Veličina stavki na kuhinjskom tiketu: "2x2" (default, tekst printera),
     * "3x2" ili "4x3" (visina x širina, ispis kao slika). null = "2x2".
     */
    @Column(name = "kitchen_font_size", length = 10)
    private String kitchenFontSize;

    /**
     * Na kuhinji se svaka riječ naziva jela/porcije skraćuje na ovoliko slova
     * ("Capricosa" -> "Capric" za 6). 0 = bez skraćivanja. null = 6.
     */
    @Column(name = "kitchen_word_length")
    private Integer kitchenWordLength;

    // ---- backup ----

    /** Druga lokacija za backup (USB, Google Drive / OneDrive folder). Prazno = samo glavna. */
    @Column(name = "backup_secondary_dir", length = 300)
    private String backupSecondaryDir;
}
