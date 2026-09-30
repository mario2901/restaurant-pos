package com.example.megibackend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name="item_type")
@Setter
@Getter
public abstract class OrderItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Naručena količina (ne mijenja se stornom). */
    private int quantity;
    private BigDecimal priceAtOrder;

    /**
     * Koliko je komada stornirano (0..quantity). Stavka ostaje zapisana radi traga;
     * u promet ulazi samo activeQuantity = quantity - stornoQuantity.
     */
    @ColumnDefault("0")
    @Column(name = "storno_quantity", nullable = false)
    private int stornoQuantity = 0;

    /** Vrijeme zadnjeg storna na ovoj stavci. */
    private LocalDateTime stornoAt;

    @Enumerated(EnumType.STRING)
    private ItemStatus status = ItemStatus.NEW;

    @ManyToOne @JoinColumn(name ="order_id")
    private Order order;

    /** Količina koja se naplaćuje (bez storniranih komada). */
    public int getActiveQuantity() {
        return Math.max(0, quantity - stornoQuantity);
    }

    /** Iznos za naplatu — samo nestornirani komadi. */
    public BigDecimal getLineTotal() {
        return priceAtOrder.multiply(BigDecimal.valueOf(getActiveQuantity()));
    }

    /** Iznos storniranih komada (za izvještaj storna). */
    public BigDecimal getStornoTotal() {
        return priceAtOrder == null
                ? BigDecimal.ZERO
                : priceAtOrder.multiply(BigDecimal.valueOf(stornoQuantity));
    }

}
