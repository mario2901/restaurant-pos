package com.example.megibackend.Dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddAddonRequest(
        @NotNull(message = "Dodatak je obavezan.")
        Long addonId,

        @Positive(message = "Količina mora biti veća od 0.")
        int quantity
) {
}
