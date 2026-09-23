package com.example.megibackend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name="item_type")
@Setter
@Getter
public abstract class OrderItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;
    private BigDecimal priceAtOrder;

    @Enumerated(EnumType.STRING)
    private ItemStatus status = ItemStatus.NEW;

    @ManyToOne @JoinColumn(name ="order_id")
    private Order order;

    public BigDecimal getLineTotal(){
        return priceAtOrder.multiply(BigDecimal.valueOf(quantity));
    }

}
