package com.example.megibackend.Dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** Cijela košarica odjednom na postojeću narudžbu. */
public record AddItemsRequest(
        @NotEmpty(message = "Narudžba mora imati barem jednu stavku.")
        @Valid
        List<OrderItemRequest> items
) {
}
