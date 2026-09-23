package com.example.megibackend.Dto;

import com.example.megibackend.Entity.Role;
import jakarta.validation.constraints.NotBlank;

public record UserUpdateRequest(
        @NotBlank(message = "Ime je obavezno.")
        String name,

        Role role
) {
}
