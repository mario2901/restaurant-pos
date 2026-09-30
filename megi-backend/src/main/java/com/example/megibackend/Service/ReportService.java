package com.example.megibackend.Service;

import com.example.megibackend.Dto.DeliveryOrderRow;
import com.example.megibackend.Dto.DeliveryReport;
import com.example.megibackend.Dto.SalesReport;
import com.example.megibackend.Dto.SalesRow;
import com.example.megibackend.Dto.WaiterRow;
import com.example.megibackend.Entity.*;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * Statistika prometa.
 *
 * U promet se uzimaju samo zatvorene (DONE) narudžbe i nestornirani komadi,
 * po cijeni zamrznutoj u priceAtOrder — promjena cijene na meniju ne mijenja
 * prošle izvještaje.
 *
 * Storno se prikazuje odvojeno (stornoQuantity / stornoTotal / stornoItems):
 * stornirani komadi sa zatvorenih (DONE) i otkazanih (CANCELED) narudžbi u razdoblju.
 *
 * Agregacija se radi u Javi nad fetch-join upitom umjesto GROUP BY u SQL-u:
 * za promet jednog restorana to je nekoliko stotina redova dnevno, a kod je
 * čitljiv i lako proširiv. Ako baza jednom naraste, ovo je mjesto za optimizaciju.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final OrderRepository orderRepository;

    // ==================== UKUPNI IZVJEŠTAJ ====================

    public SalesReport today() {
        return forDay(LocalDate.now());
    }

    public SalesReport forDay(LocalDate day) {
        return forRange(startOf(day), endOf(day));
    }

    public SalesReport forMonth(int year, int month) {
        LocalDate first = LocalDate.of(year, month, 1);
        return forRange(startOf(first), endOf(first.withDayOfMonth(first.lengthOfMonth())));
    }

    public SalesReport forRange(LocalDateTime from, LocalDateTime to) {
        validateRange(from, to);

        List<Order> closed = orderRepository.findClosedWithItemsIn(CLOSED_STATUSES, from, to);
        List<Order> orders = done(closed);
        Totals totals = aggregate(orders);
        StornoTotals storno = aggregateStorno(closed);

        long deliveryCount = 0;
        BigDecimal deliveryTotal = BigDecimal.ZERO;
        Map<Long, WaiterAccumulator> byWaiter = new HashMap<>();

        for (Order order : orders) {
            BigDecimal orderTotal = orderTotal(order);

            if (order.isDelivery()) {
                deliveryCount++;
                deliveryTotal = deliveryTotal.add(orderTotal);
            }

            User waiter = order.getUser();
            Long waiterId = waiter != null ? waiter.getId() : null;
            String waiterName = waiter != null ? waiter.getName() : "Nepoznat";
            byWaiter.computeIfAbsent(waiterId, id -> new WaiterAccumulator(id, waiterName))
                    .add(orderTotal);
        }

        List<WaiterRow> waiterRows = byWaiter.values().stream()
                .map(WaiterAccumulator::toRow)
                .sorted(Comparator.comparing(WaiterRow::total).reversed())
                .toList();

        return new SalesReport(
                from, to,
                orders.size(),
                money(totals.total),
                money(totals.food),
                money(totals.drink),
                money(totals.addon),
                average(totals.total, orders.size()),
                orders.size() - deliveryCount,
                money(totals.total.subtract(deliveryTotal)),
                deliveryCount,
                money(deliveryTotal),
                totals.topItems(),
                waiterRows,
                storno.quantity,
                money(storno.total),
                storno.items()
        );
    }

    /** Samo ukupan promet — za brzi prikaz na admin ekranu. */
    public BigDecimal revenue(LocalDateTime from, LocalDateTime to) {
        return forRange(from, to).total();
    }

    // ==================== IZVJEŠTAJ DOSTAVE ====================

    /** Dostava danas do ovog trenutka — može se izvući bilo kad u toku dana. */
    public DeliveryReport deliveryToday() {
        return deliveryForDay(LocalDate.now());
    }

    public DeliveryReport deliveryForDay(LocalDate day) {
        return deliveryForRange(startOf(day), endOf(day));
    }

    public DeliveryReport deliveryForRange(LocalDateTime from, LocalDateTime to) {
        validateRange(from, to);

        List<Order> closedAll = orderRepository.findClosedWithItemsInByType(
                CLOSED_STATUSES, OrderType.DELIVERY, from, to);
        List<Order> closed = done(closedAll);
        List<Order> open = orderRepository.findByStatusAndTypeCreatedBetweenWithItems(
                OrderStatus.NEW, OrderType.DELIVERY, from, to);

        Totals totals = aggregate(closed);
        StornoTotals storno = aggregateStorno(closedAll);

        BigDecimal openTotal = open.stream()
                .map(this::orderTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<DeliveryOrderRow> rows = new ArrayList<>();
        for (Order order : closedAll) rows.add(toRow(order)); // i otkazane (storno) — vidi se status
        for (Order order : open) rows.add(toRow(order));
        rows.sort(Comparator.comparing(DeliveryOrderRow::createdAt,
                Comparator.nullsLast(Comparator.naturalOrder())));

        return new DeliveryReport(
                from, to,
                closed.size(),
                money(totals.total),
                money(totals.food),
                money(totals.drink),
                money(totals.addon),
                average(totals.total, closed.size()),
                open.size(),
                money(openTotal),
                totals.topItems(),
                rows,
                storno.quantity,
                money(storno.total),
                storno.items()
        );
    }

    /** Samo ukupan promet dostave za dan (zatvorene narudžbe). */
    public BigDecimal deliveryTotal(LocalDate day) {
        return deliveryForDay(day).total();
    }

    // ==================== AGREGACIJA ====================

    private Totals aggregate(List<Order> orders) {
        Totals totals = new Totals();

        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                if (item.getStatus() == ItemStatus.CANCELLED) continue;
                if (item.getPriceAtOrder() == null) continue;
                if (item.getActiveQuantity() == 0) continue;

                BigDecimal lineTotal = item.getLineTotal();
                totals.total = totals.total.add(lineTotal);

                if (item instanceof FoodOrderItem) {
                    totals.food = totals.food.add(lineTotal);
                } else if (item instanceof DrinkOrderItem) {
                    totals.drink = totals.drink.add(lineTotal);
                } else if (item instanceof AddonOrderItem) {
                    totals.addon = totals.addon.add(lineTotal);
                }

                totals.byItem.computeIfAbsent(itemName(item), SalesAccumulator::new)
                        .add(item.getActiveQuantity(), lineTotal);
            }
        }
        return totals;
    }

    /** Stornirani komadi (i djelomični storno) — ne ulaze u promet, prikazuju se odvojeno. */
    private StornoTotals aggregateStorno(List<Order> orders) {
        StornoTotals storno = new StornoTotals();
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                if (item.getStornoQuantity() <= 0 || item.getPriceAtOrder() == null) continue;
                BigDecimal value = item.getStornoTotal();
                storno.quantity += item.getStornoQuantity();
                storno.total = storno.total.add(value);
                storno.byItem.computeIfAbsent(itemName(item), SalesAccumulator::new)
                        .add(item.getStornoQuantity(), value);
            }
        }
        return storno;
    }

    private static final Set<OrderStatus> CLOSED_STATUSES = EnumSet.of(OrderStatus.DONE, OrderStatus.CANCELED);

    private List<Order> done(List<Order> orders) {
        return orders.stream().filter(o -> o.getStatus() == OrderStatus.DONE).toList();
    }

    /** Isto pravilo kao aggregate: bez storniranih i stavki bez cijene. */
    private BigDecimal orderTotal(Order order) {
        return order.getItems().stream()
                .filter(i -> i.getStatus() != ItemStatus.CANCELLED)
                .filter(i -> i.getPriceAtOrder() != null)
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private DeliveryOrderRow toRow(Order order) {
        User waiter = order.getUser();
        return new DeliveryOrderRow(
                order.getId(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getClosedAt(),
                waiter != null ? waiter.getName() : null,
                money(orderTotal(order))
        );
    }

    // ==================== POMOĆNE METODE ====================

    private void validateRange(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            throw new BusinessRuleException("Razdoblje izvještaja je obavezno.");
        }
        if (to.isBefore(from)) {
            throw new BusinessRuleException("Kraj razdoblja ne može biti prije početka.");
        }
    }

    private LocalDateTime startOf(LocalDate day) {
        return day.atStartOfDay();
    }

    private LocalDateTime endOf(LocalDate day) {
        return day.atTime(LocalTime.MAX);
    }

    private BigDecimal average(BigDecimal total, int count) {
        return count == 0
                ? money(BigDecimal.ZERO)
                : total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private String itemName(OrderItem item) {
        if (item instanceof FoodOrderItem food && food.getFood() != null) {
            String portion = food.getPortion() != null ? food.getPortion().getSize() : null;
            return portion != null && !portion.isBlank()
                    ? food.getFood().getName() + " (" + portion + ")"
                    : food.getFood().getName();
        }
        if (item instanceof DrinkOrderItem drink && drink.getDrink() != null) {
            return drink.getDrink().getName();
        }
        if (item instanceof AddonOrderItem addon && addon.getAddon() != null) {
            return addon.getAddon().getName();
        }
        return "Nepoznata stavka";
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    // ==================== INTERNI AKUMULATORI ====================

    private static final class Totals {
        private BigDecimal total = BigDecimal.ZERO;
        private BigDecimal food = BigDecimal.ZERO;
        private BigDecimal drink = BigDecimal.ZERO;
        private BigDecimal addon = BigDecimal.ZERO;
        private final Map<String, SalesAccumulator> byItem = new HashMap<>();

        private List<SalesRow> topItems() {
            return byItem.values().stream()
                    .map(SalesAccumulator::toRow)
                    .sorted(Comparator.comparing(SalesRow::total).reversed())
                    .toList();
        }
    }

    private static final class StornoTotals {
        private long quantity;
        private BigDecimal total = BigDecimal.ZERO;
        private final Map<String, SalesAccumulator> byItem = new HashMap<>();

        private List<SalesRow> items() {
            return byItem.values().stream()
                    .map(SalesAccumulator::toRow)
                    .sorted(Comparator.comparing(SalesRow::total).reversed())
                    .toList();
        }
    }

    private static final class SalesAccumulator {
        private final String name;
        private long quantity;
        private BigDecimal total = BigDecimal.ZERO;

        private SalesAccumulator(String name) {
            this.name = name;
        }

        private void add(int quantity, BigDecimal lineTotal) {
            this.quantity += quantity;
            this.total = this.total.add(lineTotal);
        }

        private SalesRow toRow() {
            return new SalesRow(name, quantity, money(total));
        }
    }

    private static final class WaiterAccumulator {
        private final Long userId;
        private final String name;
        private long orderCount;
        private BigDecimal total = BigDecimal.ZERO;

        private WaiterAccumulator(Long userId, String name) {
            this.userId = userId;
            this.name = name;
        }

        private void add(BigDecimal orderTotal) {
            this.orderCount++;
            this.total = this.total.add(orderTotal);
        }

        private WaiterRow toRow() {
            return new WaiterRow(userId, name, orderCount, money(total));
        }
    }
}
