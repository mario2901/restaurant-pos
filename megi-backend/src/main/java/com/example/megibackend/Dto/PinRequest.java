package com.example.megibackend.Dto;

import jakarta.validation.constraints.Pattern;

public record PinRequest(
        @Pattern(regexp = "\\d{4,6}", message = "PIN mora imati 4 do 6 znamenki.")
        String pin
) {
}
