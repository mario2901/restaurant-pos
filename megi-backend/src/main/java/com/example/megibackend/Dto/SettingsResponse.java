package com.example.megibackend.Dto;

/**
 * Admin postavke za frontend — UVIJEK stvarno važeće vrijednosti
 * (iz baze, a gdje nije postavljeno iz application.properties).
 *
 * @param deliveryCloseTime "HH:mm"
 * @param allCloseTime      "HH:mm"
 * @param barWindowsName    prazno = šank je na LAN-u (barHost/barPort)
 * @param kitchenFontSize   "2x2" | "3x2" | "4x3" (visina x širina stavki na kuhinji)
 * @param kitchenWordLength na kuhinji svaka riječ skraćena na ovoliko slova; 0 = bez skraćivanja
 */
public record SettingsResponse(boolean drinksTracked,
                               String deliveryCloseTime,
                               String allCloseTime,
                               String kitchenHost,
                               int kitchenPort,
                               String barWindowsName,
                               String barHost,
                               int barPort,
                               String backupSecondaryDir,
                               String kitchenFontSize,
                               int kitchenWordLength) {
}
