package com.example.megibackend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("FOOD")
@Getter
@Setter
@NoArgsConstructor
public class FoodOrderItem extends OrderItem {

    @ManyToOne
    @JoinColumn(name = "food_id")
    private Food food;

    @ManyToOne
    @JoinColumn(name = "portion_id")
    private Portion portion;

    /**
     * Odabrane opcije (npr. "Cijela lepina" uz malu porciju ćevapa).
     * Njihov extraPrice je već uračunat u priceAtOrder, pa ova veza služi
     * samo za ispis na tiketu i računu.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "order_item_option",
            joinColumns = @JoinColumn(name = "order_item_id"),
            inverseJoinColumns = @JoinColumn(name = "food_option_id")
    )
    private List<FoodOption> options = new ArrayList<>();

    private String note;
}
