package com.example.megibackend.Dto;

import jakarta.validation.constraints.NotBlank;

public record ChangeTableRequest(
        @NotBlank(message = "Oznaka stola je obavezna")
        String table)
{


}
