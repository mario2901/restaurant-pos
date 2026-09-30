package com.example.megibackend.Dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Izvještaj samo za dostavu.
 *
 * Promet (total, foodTotal...) broji samo zatvorene (DONE) dostave.
 * openOrderCount / openTotal pokazuju dostave koje su još otvorene u tom
 * razdoblju — da se odmah vidi ako je nešto ostalo nezatvoreno prije
 * izvlačenja izvještaja.
 */
public record DeliveryReport(LocalDateTime from,
                             LocalDateTime to,
                             long orderCount,
                             BigDecimal total,
                             BigDecimal foodTotal,
                             BigDecimal drinkTotal,
                             BigDecimal addonTotal,
                             BigDecimal averageOrder,
                             long openOrderCount,
                             BigDecimal openTotal,
                             List<SalesRow> topItems,
                             List<DeliveryOrderRow> orders,
                             long stornoQuantity,
                             BigDecimal stornoTotal,
                             List<SalesRow> stornoItems) {
}
