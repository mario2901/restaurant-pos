package com.example.megibackend.Dto;

import java.math.BigDecimal;

/**
 * Jedan red na tiketu.
 *
 * @param detail    porcija i/ili napomena ("Velika", "bez luka") — može biti null
 * @param lineTotal null na kuhinjskom tiketu (kuhar ne treba cijene)
 * @param style     null = obična stavka; "SECTION" = naslov grupe (npr. "HRANA"),
 *                  "SUBTOTAL" = međuzbroj grupe (npr. "HRANA UKUPNO") — koristi izvještaj
 */
public record TicketLine(Integer quantity, String name, String detail, BigDecimal lineTotal, String style) {

    public static final String SECTION = "SECTION";
    public static final String SUBTOTAL = "SUBTOTAL";

    /** Integer iz istog razloga kao u Ticket: nedostajuća količina ne smije srušiti ispis. */
    public TicketLine {
        quantity = quantity == null ? 0 : quantity;
    }

    /** Obična stavka (kuhinja, šank, račun, storno). */
    public TicketLine(Integer quantity, String name, String detail, BigDecimal lineTotal) {
        this(quantity, name, detail, lineTotal, null);
    }

    public boolean isSection() {
        return SECTION.equals(style);
    }

    public boolean isSubtotal() {
        return SUBTOTAL.equals(style);
    }
}
