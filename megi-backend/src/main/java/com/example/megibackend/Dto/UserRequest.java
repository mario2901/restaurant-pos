package com.example.megibackend.Dto;

import com.example.megibackend.Entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UserRequest(
        @NotBlank(message = "Ime je obavezno.")
        String name,

        @Pattern(regexp = "\\d{4,6}", message = "PIN mora imati 4 do 6 znamenki.")
        String pin,

        Role role
) {
}
