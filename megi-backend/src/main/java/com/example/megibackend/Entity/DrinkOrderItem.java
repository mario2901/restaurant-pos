package com.example.megibackend.Entity;

import jakarta.persistence.Column;

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

    /**
     * Je li kod narudžbe skinuta zaliha. Kad je obračun pića isključen, zaliha se
     * ne dira -> false; storno / promjena količine tada je ni ne vraćaju.
     * Nullable (SINGLE_TABLE: kolona postoji i za hranu); null = stare stavke
     * od prije ove kolone, kad se zaliha skidala -> tretira se kao skinuto.
     */
    @Column(name = "stock_deducted")
    private Boolean stockDeducted;

    public boolean hasDeductedStock() {
        return !Boolean.FALSE.equals(stockDeducted);
    }
}