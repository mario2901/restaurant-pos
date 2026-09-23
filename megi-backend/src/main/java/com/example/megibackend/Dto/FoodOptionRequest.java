package com.example.megibackend.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/**
 * @param portionId null = opcija vrijedi za sve porcije jela;
 *                  inače vrijedi samo uz tu porciju
 */
public record FoodOptionRequest(
        Long portionId,

        @NotBlank(message = "Naziv opcije je obavezan.")
        String name,

        @DecimalMin(value = "0.00", message = "Doplata ne može biti negativna.")
        BigDecimal extraPrice
) {
}
