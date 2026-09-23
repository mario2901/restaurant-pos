package com.example.megibackend.Dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddDrinkRequest(
        @NotNull(message = "Piće je obavezno.")
        Long drinkId,

        @Positive(message = "Količina mora biti veća od 0.")
        int quantity
) {
}
