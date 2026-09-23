package com.example.megibackend.Dto;

import com.example.megibackend.Entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Jedna dostava u izvještaju. */
public record DeliveryOrderRow(Long id,
                               OrderStatus status,
                               LocalDateTime createdAt,
                               LocalDateTime closedAt,
                               String userName,
                               BigDecimal total) {
}
