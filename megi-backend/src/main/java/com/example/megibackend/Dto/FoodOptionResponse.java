package com.example.megibackend.Dto;

import java.math.BigDecimal;

/** portionId je null ako opcija vrijedi za sve porcije jela. */
public record FoodOptionResponse(Long id,
                                 String name,
                                 BigDecimal extraPrice,
                                 Long portionId,
                                 String portionSize) {
}
