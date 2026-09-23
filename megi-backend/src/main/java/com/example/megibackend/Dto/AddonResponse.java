package com.example.megibackend.Dto;

import java.math.BigDecimal;

public record AddonResponse(Long id, String name, BigDecimal price, boolean available) {
}
