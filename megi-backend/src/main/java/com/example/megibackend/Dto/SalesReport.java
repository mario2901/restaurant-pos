package com.example.megibackend.Dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Izvještaj za razdoblje. Broji samo zatvorene (DONE) narudžbe
 * i ne-stornirane stavke, po zamrznutim cijenama (priceAtOrder).
 *
 * total = dineInTotal + deliveryTotal
 *
 * storno* = stornirani komadi u razdoblju (i sa zatvorenih i s otkazanih narudžbi),
 * NE ulaze u total — prikazuju se odvojeno.
 */
public record SalesReport(LocalDateTime from,
                          LocalDateTime to,
                          long orderCount,
                          BigDecimal total,
                          BigDecimal foodTotal,
                          BigDecimal drinkTotal,
                          BigDecimal addonTotal,
                          BigDecimal averageOrder,
                          long dineInCount,
                          BigDecimal dineInTotal,
                          long deliveryCount,
                          BigDecimal deliveryTotal,
                          List<SalesRow> topItems,
                          List<WaiterRow> byWaiter,
                          long stornoQuantity,
                          BigDecimal stornoTotal,
                          List<SalesRow> stornoItems) {
}
