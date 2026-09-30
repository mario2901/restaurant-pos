package com.example.megibackend.Dto;

import jakarta.validation.constraints.Positive;

/**
 * Storno jedne stavke.
 * @param quantity koliko komada stornirati; null = sve preostale
 */
public record StornoItemRequest(@Positive(message = "Količina za storno mora biti veća od 0.") Integer quantity) {
}
