package com.example.megibackend.Dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "PIN je obavezan.")
        String pin
) {
}
