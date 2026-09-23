package com.example.megibackend.Dto;

import jakarta.validation.constraints.Positive;

public record QuantityRequest(
        @Positive(message = "Količina mora biti veća od 0.")
        int quantity
) {
}
