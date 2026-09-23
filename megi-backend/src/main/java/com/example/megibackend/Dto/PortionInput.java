package com.example.megibackend.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Ulaz za kreiranje/izmjenu porcije jela (npr. "Mala", 8.50). */
public record PortionInput(
        @NotBlank(message = "Naziv porcije je obavezan.")
        String size,

        @NotNull(message = "Cijena je obavezna.")
        @DecimalMin(value = "0.01", message = "Cijena mora biti veća od 0.")
        BigDecimal price
) {
}
