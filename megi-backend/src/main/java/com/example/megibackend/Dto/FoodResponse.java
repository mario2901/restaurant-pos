package com.example.megibackend.Dto;

import java.util.List;

public record FoodResponse(Long id,
                           String name,
                           String description,
                           String category,
                           boolean available,
                           List<PortionResponse> portions,
                           List<FoodOptionResponse> options) {
}
