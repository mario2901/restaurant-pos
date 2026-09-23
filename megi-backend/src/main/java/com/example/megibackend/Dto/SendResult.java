package com.example.megibackend.Dto;

import java.util.List;

/** Odgovor na "Naruči": stanje narudžbe + tiketi koji idu na printer. */
public record SendResult(OrderResponse order, List<Ticket> tickets) {
}
