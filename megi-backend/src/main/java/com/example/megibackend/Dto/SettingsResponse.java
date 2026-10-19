package com.example.megibackend.Dto;

/**
 * Admin postavke za frontend — UVIJEK stvarno važeće vrijednosti
 * (iz baze, a gdje nije postavljeno iz application.properties).
 *
 * @param deliveryCloseTime "HH:mm"
 * @param allCloseTime      "HH:mm"
 * @param barWindowsName    prazno = šank je na LAN-u (barHost/barPort)
 */
public record SettingsResponse(boolean drinksTracked,
                               String deliveryCloseTime,
                               String allCloseTime,
                               String kitchenHost,
                               int kitchenPort,
                               String barWindowsName,
                               String barHost,
                               int barPort,
                               String backupSecondaryDir) {
}
