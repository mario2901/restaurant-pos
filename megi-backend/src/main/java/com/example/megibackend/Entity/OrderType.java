package com.example.megibackend.Entity;

/**
 * Vrsta narudžbe.
 *
 * Frontend dostavu šalje kao poseban blok stola s oznakom "DOSTAVA",
 * a backend iz te oznake sam postavlja tip. Izvještaji filtriraju po
 * tipu, ne po stringu stola — promjena oznake ne kvari stare podatke.
 *
 * "PONIJETI" (narudžba telefonom, gost dolazi po nju) NIJE poseban tip:
 * ostaje DINE_IN i ulazi u regularni promet restorana. Razlikuje se samo
 * po oznaci stola — na njoj može biti više otvorenih narudžbi odjednom,
 * a kuhinjski tiket je označen "ZA PONIJETI".
 */
public enum OrderType {
    DINE_IN,
    DELIVERY;

    /** Oznaka "stola" koju frontend šalje za dostavu. */
    public static final String DELIVERY_TABLE = "DOSTAVA";

    /** Oznaka "stola" za narudžbe za ponijeti (bez dostave). */
    public static final String TAKEAWAY_TABLE = "PONIJETI";

    public static boolean isDeliveryTable(String table) {
        return table != null && DELIVERY_TABLE.equalsIgnoreCase(table.trim());
    }

    public static boolean isTakeawayTable(String table) {
        return table != null && TAKEAWAY_TABLE.equalsIgnoreCase(table.trim());
    }

    /** Blokovi na kojima svaki klik otvara novu narudžbu (više gostiju istovremeno). */
    public static boolean isMultiOrderTable(String table) {
        return isDeliveryTable(table) || isTakeawayTable(table);
    }

    /** Hrana se pakira — dostava i za ponijeti. */
    public static boolean isPackedTable(String table) {
        return isMultiOrderTable(table);
    }

    public static OrderType fromTable(String table) {
        return isDeliveryTable(table) ? DELIVERY : DINE_IN;
    }
}
