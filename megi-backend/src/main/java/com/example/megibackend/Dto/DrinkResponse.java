package com.example.megibackend.Dto;

import com.example.megibackend.Entity.DrinkCategory;

import java.math.BigDecimal;

/**
 * @param category      enum vrijednost za filtriranje (npr. "PIVA")
 * @param categoryLabel naziv za prikaz na tabu (npr. "Piva")
 */
public record DrinkResponse(
        Long id,
        String name,
        BigDecimal price,
        int stock,
        boolean available,
        DrinkCategory category,
        String categoryLabel
) {
}
