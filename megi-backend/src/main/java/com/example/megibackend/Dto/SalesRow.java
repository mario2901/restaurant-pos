package com.example.megibackend.Dto;

import java.math.BigDecimal;

/**
 * Jedan artikl u izvještaju: koliko komada i koliko novca.
 *
 * @param group "HRANA" (jela i prilozi) ili "PICE" — ispis dnevnog izvještaja
 *              slaže artikle po grupama s međuzbrojem
 */
public record SalesRow(String name, long quantity, BigDecimal total, String group) {

    public static final String FOOD = "HRANA";
    public static final String DRINK = "PICE";
}
