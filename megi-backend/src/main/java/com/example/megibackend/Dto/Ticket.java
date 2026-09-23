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
 */
public record Ticket(TicketType type,
                     Long orderId,
                     String table,
                     String waiter,
                     LocalDateTime printedAt,
                     List<TicketLine> lines,
                     BigDecimal total,
                     boolean takeaway,
                     String notice) {

    public boolean isEmpty() {
        return lines == null || lines.isEmpty();
    }
}
