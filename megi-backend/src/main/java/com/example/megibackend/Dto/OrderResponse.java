package com.example.megibackend.Dto;

import com.example.megibackend.Entity.OrderStatus;
import com.example.megibackend.Entity.OrderType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(Long id,
                            String table,
                            OrderType type,
                            OrderStatus status,
                            LocalDateTime createdAt,
                            LocalDateTime closedAt,
                            String note,
                            Long userId,
                            String userName,
                            List<OrderItemResponse> items,
                            BigDecimal total) {
}
