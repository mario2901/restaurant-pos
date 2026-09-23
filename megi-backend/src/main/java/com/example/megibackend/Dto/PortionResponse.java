package com.example.megibackend.Dto;

import java.math.BigDecimal;

public record PortionResponse(Long id, String size, BigDecimal price) {
}
