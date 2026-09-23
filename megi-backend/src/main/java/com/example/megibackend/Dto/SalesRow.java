package com.example.megibackend.Dto;

import java.math.BigDecimal;

/** Jedan artikl u izvještaju: koliko komada i koliko novca. */
public record SalesRow(String name, long quantity, BigDecimal total) {
}
