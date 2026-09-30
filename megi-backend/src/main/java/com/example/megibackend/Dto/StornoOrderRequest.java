package com.example.megibackend.Dto;

import com.example.megibackend.Entity.StornoScope;
import jakarta.validation.constraints.NotNull;

/** Storno cijele narudžbe ili samo hrane / pića. */
public record StornoOrderRequest(@NotNull(message = "Odaberi što se stornira: FOOD, DRINK ili ALL.") StornoScope scope) {
}
