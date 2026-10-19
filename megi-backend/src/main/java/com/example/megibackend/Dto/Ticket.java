package com.example.megibackend.Dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Ono što ide na printer. Servis vraća podatke, a print driver
 * (ili frontend) ih formatira — logika ostaje neovisna o hardveru.
 *
 * @param total    null na kuhinjskom tiketu
 * @param takeaway true za dostavu i za ponijeti — hrana se pakira
 * @param notice   istaknuta napomena za vrh tiketa, npr. "ZA PONIJETI"; null ako je nema
 * @param orderNote napomena narudžbe za dostavu / za ponijeti (adresa, telefon); null ako je nema
 * @param addition  true = "Dodaj još" na narudžbu koja je već ranije poslana (kuhinja vidi da je dodatak)
 */
public record Ticket(TicketType type,
                     Long orderId,
                     String table,
                     String waiter,
                     LocalDateTime printedAt,
                     List<TicketLine> lines,
                     BigDecimal total,
                     Boolean takeaway,
                     String notice,
                     String orderNote,
                     Boolean addition) {

    /*
     * Boolean (ne boolean): tikete šalje i frontend (izvještaji, ponovni ispis),
     * a Jackson 3 (Spring Boot 4) odbija JSON kojem nedostaje primitivno polje
     * -> 400. Nedostajuće / null vrijednosti ovdje postaju false, pa su
     * takeaway() i addition() uvijek sigurni za if/&&.
     */
    public Ticket {
        takeaway = takeaway != null && takeaway;
        addition = addition != null && addition;
    }

    public boolean isEmpty() {
        return lines == null || lines.isEmpty();
    }
}
