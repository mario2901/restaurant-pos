package com.example.megibackend.Dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/**
 * Storno više označenih stavki odjednom (jedna transakcija, jedan set STORNO tiketa).
 *
 * { "items": [ { "itemId": 12, "quantity": 1 }, { "itemId": 15 } ] }
 * quantity = null -> stornira se sve preostalo na toj stavci.
 */
public record StornoItemsRequest(
        @NotEmpty(message = "Označi barem jednu stavku za storno.")
        @Valid
        List<Line> items
) {
    public record Line(
            @NotNull(message = "itemId je obavezan.") Long itemId,
            @Positive(message = "Količina za storno mora biti veća od 0.") Integer quantity
    ) {
    }
}
