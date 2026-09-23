package com.example.megibackend.Entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@DiscriminatorValue("DRINK")
@Getter
@Setter
@NoArgsConstructor
public class DrinkOrderItem extends OrderItem {
    @ManyToOne
    @JoinColumn(name = "drink_id")
    private Drink drink;
}