package com.example.megibackend.Dto;

import com.example.megibackend.Entity.ItemStatus;

import java.math.BigDecimal;
import java.util.List;

/**
 * @param type        FOOD, DRINK ili ADDON
 * @param referenceId id jela/pića/dodatka, za slučaj da frontend treba original
 * @param detail      porcija (samo za hranu)
 * @param quantity    naručena količina
 * @param stornoQuantity stornirani komadi; lineTotal je samo za nestornirane
 */
public record OrderItemResponse(Long id,
                                String type,
                                Long referenceId,
                                String name,
                                String detail,
                                int quantity,
                                int stornoQuantity,
                                BigDecimal priceAtOrder,
                                BigDecimal lineTotal,
                                ItemStatus status,
                                String note,
                                List<String> options) {
}
