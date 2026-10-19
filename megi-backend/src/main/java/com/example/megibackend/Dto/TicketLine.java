package com.example.megibackend.Dto;

import java.math.BigDecimal;

/**
 * Jedan red na tiketu.
 *
 * @param detail    porcija i/ili napomena ("Velika", "bez luka") — može biti null
 * @param lineTotal null na kuhinjskom tiketu (kuhar ne treba cijene)
 */
public record TicketLine(Integer quantity, String name, String detail, BigDecimal lineTotal) {

    /** Integer iz istog razloga kao u Ticket: nedostajuća količina ne smije srušiti ispis. */
    public TicketLine {
        quantity = quantity == null ? 0 : quantity;
    }
}
