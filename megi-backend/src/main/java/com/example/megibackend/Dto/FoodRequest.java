package com.example.megibackend.Dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * @param portions obavezno kod kreiranja (cijena živi na porciji),
 *                 ignorira se kod izmjene jela
 * @param category npr. "Pizza", "Roštilj" — neobavezno
 */
public record FoodRequest(
        @NotBlank(message = "Naziv jela je obavezan.")
        String name,

        String description,

        String category,

        @Valid
        List<PortionInput> portions
) {
}
