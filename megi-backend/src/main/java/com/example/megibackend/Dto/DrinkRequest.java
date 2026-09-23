package com.example.megibackend.Dto;

import com.example.megibackend.Entity.DrinkCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/** @param stock koristi se samo kod kreiranja; zaliha se poslije mijenja preko /stock */
public record DrinkRequest(
        @NotBlank(message = "Naziv pića je obavezan.")
        String name,

        @NotNull(message = "Cijena je obavezna.")
        @DecimalMin(value = "0.01", message = "Cijena mora biti veća od 0.")
        BigDecimal price,

        @PositiveOrZero(message = "Zaliha ne može biti negativna.")
        int stock,

        @NotNull(message = "Kategorija je obavezna.")
        DrinkCategory category
) {
}
