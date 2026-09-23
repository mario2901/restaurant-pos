package com.example.megibackend.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
        @NotBlank(message = "Oznaka stola je obavezna.")
        String table,

        @NotNull(message = "Konobar je obavezan.")
        Long userId
) {
}
