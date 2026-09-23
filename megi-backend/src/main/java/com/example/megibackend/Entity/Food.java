package com.example.megibackend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "food")
@Getter
@Setter
@NoArgsConstructor
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    /** Kategorija za kartice na frontendu, npr. "Pizza", "Roštilj". Null = bez kategorije. */
    private String category;

    /** Skinuto s menija (npr. nema namirnica) — ostaje u bazi zbog starih narudžbi. */
    private boolean available = true;

    @OneToMany(mappedBy = "food", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Portion> portions = new ArrayList<>();

    @OneToMany(mappedBy = "food", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FoodOption> options = new ArrayList<>();

    public void addPortion(Portion portion) {
        portions.add(portion);
        portion.setFood(this);
    }

    public void removePortion(Portion portion) {
        portions.remove(portion);
        portion.setFood(null);
    }

    public void addOption(FoodOption option) {
        options.add(option);
        option.setFood(this);
    }

    public void removeOption(FoodOption option) {
        options.remove(option);
        option.setFood(null);
    }
}
