package com.example.megibackend.Dto;

import jakarta.validation.constraints.PositiveOrZero;

public record StockRequest(
        @PositiveOrZero(message = "Količina ne može biti negativna.")
        int amount
) {
}
