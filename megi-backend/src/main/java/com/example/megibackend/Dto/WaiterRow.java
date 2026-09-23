package com.example.megibackend.Dto;

import java.math.BigDecimal;

/** Promet po konobaru. */
public record WaiterRow(Long userId, String name, long orderCount, BigDecimal total) {
}
