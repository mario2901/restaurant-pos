package com.example.megibackend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "table" je rezervirana SQL riječ -> kolona se zove table_label
    @Column(name = "table_label", nullable = false)
    private String table;

    // DINE_IN ili DELIVERY; default u koloni da ddl-auto=update popuni postojeće redove
    @Enumerated(EnumType.STRING)
    @ColumnDefault("'DINE_IN'")
    @Column(name = "order_type", nullable = false, length = 20)
    private OrderType type = OrderType.DINE_IN;

    /** Maksimalna duljina napomene za dostavu / za ponijeti. */
    public static final int NOTE_MAX = 120;

    /**
     * Napomena na razini narudžbe — samo za dostavu i za ponijeti
     * (adresa, telefon, "zvoniti 2x"...). Za stolove je uvijek null.
     */
    @Column(name = "order_note", length = NOTE_MAX)
    private String note;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime closedAt;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.NEW;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }

    /** Zbroj svih ne-storniranih stavki. */
    public BigDecimal getTotal() {
        return items.stream()
                .filter(i -> i.getStatus() != ItemStatus.CANCELLED)
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Narudžba se može mijenjati samo dok je NEW. */
    public boolean isEditable() {
        return status == OrderStatus.NEW;
    }

    public boolean isDelivery() {
        return type == OrderType.DELIVERY;
    }

    /** Za ponijeti (telefonska narudžba, gost dolazi) — u prometu je obična DINE_IN narudžba. */
    public boolean isTakeaway() {
        return OrderType.isTakeawayTable(table);
    }

    /** Hrana se pakira: dostava ili za ponijeti. */
    public boolean isPacked() {
        return isDelivery() || isTakeaway();
    }
}
