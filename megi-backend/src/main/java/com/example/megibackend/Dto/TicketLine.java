package com.example.megibackend.Dto;

import java.math.BigDecimal;

/**
 * Jedan red na tiketu.
 *
 * @param detail    porcija i/ili napomena ("Velika", "bez luka") — može biti null
 * @param lineTotal null na kuhinjskom tiketu (kuhar ne treba cijene)
 */
public record TicketLine(int quantity, String name, String detail, BigDecimal lineTotal) {
}
