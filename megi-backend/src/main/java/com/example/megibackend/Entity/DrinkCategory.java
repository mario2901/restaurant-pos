package com.example.megibackend.Entity;

/**
 * Kategorije s karte pića — koriste se za filtriranje na frontendu.
 * Redoslijed enuma je redoslijed tabova u aplikaciji.
 */
public enum DrinkCategory {

    ALKOHOLNA_PICA("Alkoholna pića"),
    VINA("Vina"),
    PIVA("Piva"),
    SOKOVI("Sokovi"),
    TOPLI_NAPITCI("Topli napitci");

    private final String label;

    DrinkCategory(String label) {
        this.label = label;
    }

    /** Naziv za prikaz na tabu — da frontend ne mora prevoditi enum. */
    public String getLabel() {
        return label;
    }
}
