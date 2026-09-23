package com.example.megibackend.Dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/**
 * Jedna stavka iz košarice. Koja su polja obavezna ovisi o type:
 *  FOOD  -> foodId + portionId (optionIds i note neobavezni)
 *  DRINK -> drinkId
 *  ADDON -> addonId
 *
 * Cijena se NE šalje — backend je računa iz menija i zamrzava u priceAtOrder.
 */
public record OrderItemRequest(
        @NotNull(message = "Tip stavke je obavezan (FOOD, DRINK ili ADDON).")
        ItemType type,

        Long foodId,
        Long portionId,
        Long drinkId,
        Long addonId,

        @Positive(message = "Količina mora biti veća od 0.")
        int quantity,

        String note,

        List<Long> optionIds
) {
}
