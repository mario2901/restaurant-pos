package com.example.megibackend.Dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Gumb "Naruči" u jednom pozivu: otvori (ili preuzmi) narudžbu za stol,
 * upiši sve stavke iz košarice i pošalji ih na print.
 *
 * orderId je opcionalan: ako je poslan, stavke idu na tu (otvorenu) narudžbu.
 * Bitno za dostavu — na bloku DOSTAVA može biti više otvorenih dostava,
 * pa bez orderId svaki "Naruči" otvara novu. Dodavanje na postojeću dostavu
 * radi dok se ne izda račun (POST /api/orders/{id}/bill), koji je zatvara.
 */
public record SubmitOrderRequest(
        Long orderId,

        @NotBlank(message = "Oznaka stola je obavezna.")
        String table,

        @NotNull(message = "Konobar je obavezan.")
        Long userId,

        // Samo za DOSTAVA / PONIJETI: adresa, telefon... Za stolove se ignorira.
        @Size(max = 120, message = "Napomena može imati najviše 120 znakova.")
        String note,

        @NotEmpty(message = "Narudžba mora imati barem jednu stavku.")
        @Valid
        List<OrderItemRequest> items
) {
}
