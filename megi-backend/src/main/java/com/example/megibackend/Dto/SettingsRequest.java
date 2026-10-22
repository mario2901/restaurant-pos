package com.example.megibackend.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * PUT /api/settings — šalju se samo polja koja se mijenjaju (null = ne diraj).
 * Za tekstualna polja prazan string znači "obriši" (vrati na application.properties
 * za printere; bez druge lokacije za backup).
 */
public record SettingsRequest(
        Boolean drinksTracked,

        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Vrijeme mora biti HH:mm")
        String deliveryCloseTime,

        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Vrijeme mora biti HH:mm")
        String allCloseTime,

        @Size(max = 100) String kitchenHost,
        @Min(1) @Max(65535) Integer kitchenPort,
        @Size(max = 100) String barWindowsName,
        @Size(max = 100) String barHost,
        @Min(1) @Max(65535) Integer barPort,
        @Size(max = 300) String backupSecondaryDir,
        @Pattern(regexp = "^(2x2|3x2|4x3)$", message = "Veličina slova mora biti 2x2, 3x2 ili 4x3")
        String kitchenFontSize,
        @Min(value = 0, message = "Broj slova ne može biti negativan")
        @Max(value = 30, message = "Najviše 30 slova")
        Integer kitchenWordLength) {
}
