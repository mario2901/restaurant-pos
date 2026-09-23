package com.example.megibackend.Dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/**
 * @param optionIds odabrane opcije (npr. "Cijela lepina") — smije biti prazno
 */
public record AddFoodRequest(
        @NotNull(message = "Jelo je obavezno.")
        Long foodId,

        @NotNull(message = "Porcija je obavezna.")
        Long portionId,

        @Positive(message = "Količina mora biti veća od 0.")
        int quantity,

        String note,

        List<Long> optionIds
) {
}
