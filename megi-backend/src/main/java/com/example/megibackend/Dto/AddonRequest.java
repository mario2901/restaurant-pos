package com.example.megibackend.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AddonRequest(
        @NotBlank(message = "Naziv dodatka je obavezan.")
        String name,

        @NotNull(message = "Cijena je obavezna.")
        @DecimalMin(value = "0.01", message = "Cijena mora biti veća od 0.")
        BigDecimal price
) {
}
