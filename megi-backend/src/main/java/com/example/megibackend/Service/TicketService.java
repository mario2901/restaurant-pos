package com.example.megibackend.Service;

import com.example.megibackend.Dto.Ticket;
import com.example.megibackend.Dto.TicketLine;
import com.example.megibackend.Dto.TicketType;
import com.example.megibackend.Entity.*;
import com.example.megibackend.Exceptions.NotFoundException;
import com.example.megibackend.Repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Slaganje tiketa za print.
 *
 * Pravila (dogovorena kod dizajna modela):
 *  - kuhinjski tiket: hrana i prilozi, s porcijom i napomenom, BEZ cijena
 *  - šank tiket: sve stavke s cijenama
 *  - račun: sve ne-stornirane stavke narudžbe s ukupnim iznosom
 *  - dostava i za ponijeti: svi tiketi imaju takeaway=true i notice za vrh tiketa
 *
 * Servis vraća strukturu podataka, ne formatirani tekst — tako print driver
 * (ESC/POS, PDF, ili samo prikaz na ekranu) može biti zamijenjen bez diranja logike.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TicketService {

    private final OrderRepository orderRepository;

    /**
     * Tiketi za stavke koje je upravo vratio OrderService.sendNewItems().
     * Vraća samo one tikete koji imaju redova — ako je konobar naručio
     * samo piće, kuhinjski tiket se ne generira.
     */
    public List<Ticket> forSentItems(Long orderId, List<OrderItem> items) {
        Order order = getOrder(orderId);
        List<Ticket> tickets = new ArrayList<>();

        Ticket kitchen = kitchenTicket(order, items);
        if (!kitchen.isEmpty()) tickets.add(kitchen);

        Ticket bar = barTicket(order, items);
        if (!bar.isEmpty()) tickets.add(bar);

        return tickets;
    }

    /** Ponovni print kuhinjskog tiketa za cijelu narudžbu. */
    public Ticket kitchenTicket(Long orderId) {
        Order order = getOrder(orderId);
        return kitchenTicket(order, order.getItems());
    }

    /** Ponovni print šank tiketa za cijelu narudžbu. */
    public Ticket barTicket(Long orderId) {
        Order order = getOrder(orderId);
        return barTicket(order, order.getItems());
    }

    /** Račun za stol ili dostavu — sve što se naplaćuje. */
    public Ticket bill(Long orderId) {
        return bill(getOrder(orderId));
    }

    private Ticket bill(Order order) {
        List<TicketLine> lines = active(order.getItems()).stream()
                .map(this::pricedLine)
                .toList();

        return new Ticket(TicketType.BILL, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), lines, sum(lines), order.isPacked(), notice(order), orderNote(order));
    }

    // ==================== STORNO TIKETI ====================

    /**
     * Tiketi za upravo odrađeni storno:
     *  - STORNO_KITCHEN: hrana i prilozi (kao kuhinjski tiket), bez cijena — kuhinja zna da stane
     *  - STORNO_BAR: sve stornirano s iznosima — šank / blagajna
     * Vraća samo tikete koji imaju redova.
     */
    public List<Ticket> forStorno(Order order, List<OrderService.StornoLine> stornoLines) {
        List<Ticket> tickets = new ArrayList<>();
        if (stornoLines == null || stornoLines.isEmpty()) return tickets;

        String notice = stornoNotice(order);
        LocalDateTime now = LocalDateTime.now();

        List<TicketLine> kitchenLines = stornoLines.stream()
                .filter(l -> isKitchenItem(l.item()))
                .map(l -> kitchenLine(l.item(), l.quantity()))
                .toList();
        if (!kitchenLines.isEmpty()) {
            tickets.add(new Ticket(TicketType.STORNO_KITCHEN, order.getId(), order.getTable(), waiterName(order),
                    now, kitchenLines, null, order.isPacked(), notice, orderNote(order)));
        }

        List<TicketLine> barLines = stornoLines.stream()
                .map(l -> {
                    OrderItem item = l.item();
                    String detail = (item instanceof FoodOrderItem food)
                            ? joinDetail(portionSize(food), optionNames(food))
                            : null;
                    BigDecimal value = item.getPriceAtOrder() != null
                            ? item.getPriceAtOrder().multiply(BigDecimal.valueOf(l.quantity()))
                            : null;
                    return new TicketLine(l.quantity(), nameOf(item), detail, value);
                })
                .toList();
        tickets.add(new Ticket(TicketType.STORNO_BAR, order.getId(), order.getTable(), waiterName(order),
                now, barLines, sum(barLines), order.isPacked(), notice, orderNote(order)));

        return tickets;
    }

    private String stornoNotice(Order order) {
        String packed = notice(order);
        return packed != null ? "STORNO · " + packed : "STORNO";
    }

    // ==================== SLAGANJE TIKETA ====================

    private Ticket kitchenTicket(Order order, List<OrderItem> items) {
        List<TicketLine> lines = active(items).stream()
                .filter(this::isKitchenItem)
                .map(item -> kitchenLine(item, item.getActiveQuantity()))
                .toList();

        return new Ticket(TicketType.KITCHEN, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), lines, null, order.isPacked(), notice(order), orderNote(order));
    }

    private Ticket barTicket(Order order, List<OrderItem> items) {
        List<TicketLine> lines = active(items).stream()
                .map(this::pricedLine)
                .toList();

        return new Ticket(TicketType.BAR, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), lines, sum(lines), order.isPacked(), notice(order), orderNote(order));
    }

    /** Kuhinja: porcija, opcije i napomena da kuhar zna što radi — cijena ga ne zanima. */
    /** U kuhinju ide hrana i prilozi (pomfrit, kečap...), piće samo na šank. */
    private boolean isKitchenItem(OrderItem item) {
        return item instanceof FoodOrderItem || item instanceof AddonOrderItem;
    }

    /** Kuhinjski red: jelo s porcijom, opcijama i napomenom; prilog samo naziv. */
    private TicketLine kitchenLine(OrderItem item, int quantity) {
        String detail = (item instanceof FoodOrderItem food)
                ? joinDetail(portionSize(food), optionNames(food), food.getNote())
                : null;
        return new TicketLine(quantity, nameOf(item), detail, null);
    }

    private TicketLine pricedLine(OrderItem item) {
        String detail = (item instanceof FoodOrderItem food)
                ? joinDetail(portionSize(food), optionNames(food))
                : null;
        return new TicketLine(item.getActiveQuantity(), nameOf(item), detail, item.getLineTotal());
    }

    // ==================== POMOĆNE METODE ====================

    private Order getOrder(Long orderId) {
        return orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new NotFoundException("Narudžba " + orderId + " ne postoji."));
    }

    private List<OrderItem> active(List<OrderItem> items) {
        if (items == null) return List.of();
        return items.stream()
                .filter(i -> i.getStatus() != ItemStatus.CANCELLED)
                .filter(i -> i.getActiveQuantity() > 0)
                .toList();
    }

    private String nameOf(OrderItem item) {
        if (item instanceof FoodOrderItem food && food.getFood() != null) {
            return food.getFood().getName();
        }
        if (item instanceof DrinkOrderItem drink && drink.getDrink() != null) {
            return drink.getDrink().getName();
        }
        if (item instanceof AddonOrderItem addon && addon.getAddon() != null) {
            return addon.getAddon().getName();
        }
        return "Stavka";
    }

    private String portionSize(FoodOrderItem item) {
        return item.getPortion() != null ? item.getPortion().getSize() : null;
    }

    /** Odabrane opcije, npr. "Cijela lepina, Ljuto". */
    private String optionNames(FoodOrderItem item) {
        if (item.getOptions() == null || item.getOptions().isEmpty()) return null;
        return item.getOptions().stream()
                .map(FoodOption::getName)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    /** Spaja porciju, opcije i napomenu u jedan redak, preskačući prazne dijelove. */
    private String joinDetail(String... parts) {
        String detail = java.util.Arrays.stream(parts)
                .filter(p -> p != null && !p.isBlank())
                .collect(java.util.stream.Collectors.joining(" — "));
        return detail.isBlank() ? null : detail;
    }

    /** Napomena na vrhu tiketa da kuhinja/šank zna da se pakira. */
    private String notice(Order order) {
        if (order.isDelivery()) return "DOSTAVA — ZA PONIJETI";
        if (order.isTakeaway()) return "ZA PONIJETI";
        return null;
    }

    /** Adresa / telefon za dostavu i za ponijeti; za stolove null. */
    private String orderNote(Order order) {
        if (!order.isPacked()) return null;
        String note = order.getNote();
        return note == null || note.isBlank() ? null : note;
    }

    private String waiterName(Order order) {
        return order.getUser() != null ? order.getUser().getName() : null;
    }

    private BigDecimal sum(List<TicketLine> lines) {
        return lines.stream()
                .map(TicketLine::lineTotal)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
