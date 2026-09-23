package com.example.megibackend.Entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name="drink")
@Getter
@Setter
@NoArgsConstructor
public class Drink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private BigDecimal price;
    private int stock;
    private boolean available = true;

    /**
     * Kategorija s karte pića (tab na frontendu).
     * STRING namjerno — s ORDINAL bi se sve pomaklo čim se doda kategorija u sredinu.
     * Kolona je nullable radi postojećih redova pri ddl-auto=update; obaveznost se
     * provjerava u DrinkRequest/DrinkService.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30)
    private DrinkCategory category;

}
