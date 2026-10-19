package com.example.megibackend.Dto;

import java.util.List;

/**
 * Odgovor na akcije koje proizvode tikete (Naruči, storno, račun...).
 *
 * @param printed    true = backend je tikete već poslao na printere
 * @param printError poruka ako print nije uspio (narudžba JE spremljena!); null ako je sve ok
 */
public record SendResult(OrderResponse order, List<Ticket> tickets, boolean printed, String printError) {
}
