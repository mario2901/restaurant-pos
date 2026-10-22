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
 * Pravila:
 *  - "Naruči" / "Dodaj još": printa se SAMO kuhinjski tiket (hrana i prilozi, bez cijena)
 *  - šank dobiva papir tek kod zatvaranja (račun) i ponovnog printa računa
 *  - "Dodaj još": kuhinjski tiket je označen kao DODATAK s brojem narudžbe i stolom
 *  - storno: kuhinja uvijek (ako ima hrane), šank samo ako je narudžba već zatvorena
 *    (račun je već isprintan, pa šank mora znati da ga korigira)
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
    private final SettingsService settingsService;

    /**
     * Tiketi za stavke koje je upravo vratio OrderService.sendNewItems() ("Naruči" / "Dodaj još").
     * Vraća SAMO kuhinjski tiket — šank dobiva račun tek kod zatvaranja.
     * Ako je naručeno samo piće, lista je prazna (ništa se ne printa).
     */
    public List<Ticket> forSentItems(Long orderId, List<OrderItem> items) {
        Order order = getOrder(orderId);
        boolean addition = isAddition(order, items);

        List<TicketLine> lines = active(items).stream()
                .filter(this::isKitchenItem)
                .map(item -> kitchenLine(item, item.getActiveQuantity()))
                .toList();
        if (lines.isEmpty()) return List.of();

        String notice = addition ? additionNotice(order) : notice(order);
        return List.of(new Ticket(TicketType.KITCHEN, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), lines, null, order.isPacked(), notice, orderNote(order), addition));
    }

    /** Narudžba je već imala poslanih stavki prije ovog slanja -> ovo je "Dodaj još". */
    private boolean isAddition(Order order, List<OrderItem> sent) {
        java.util.Set<Long> sentIds = sent.stream()
                .map(OrderItem::getId)
                .collect(java.util.stream.Collectors.toSet());
        return order.getItems().stream()
                .anyMatch(i -> i.getStatus() != ItemStatus.NEW && !sentIds.contains(i.getId()));
    }

    private String additionNotice(Order order) {
        return "DODATAK NA NARUDŽBU #" + order.getId() + " · " + place(order);
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
                LocalDateTime.now(), lines, sum(lines), order.isPacked(), notice(order), orderNote(order), false);
    }

    public List<Ticket> forTakeawayMove(Long orderId, String fromTable){
        Order order = getOrder(orderId);
        Ticket base = kitchenTicket(order, order.getItems());
        if(base.isEmpty()) return List.of();


        String notice = "Za PONIJETI - bio je stol " + fromTable;
        return List.of(new Ticket(TicketType.KITCHEN, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), base.lines(), null, true, notice, orderNote(order), false));
    }

    /**
     * Reprint kuhinjskog tiketa kad se "za ponijeti" ipak prebaci na stol:
     * kuhinja zna da više ne pakira. Prazna lista ako nema hrane/priloga.
     */
    public List<Ticket> forTakeawayToTable(Long orderId) {
        Order order = getOrder(orderId);
        Ticket base = kitchenTicket(order, order.getItems());
        if (base.isEmpty()) return List.of();

        String notice = "NA STOL " + order.getTable() + " · NE PAKIRATI (bilo za ponijeti)";
        return List.of(new Ticket(TicketType.KITCHEN, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), base.lines(), null, false, notice, null, false));
    }

    // ==================== STORNO TIKETI ====================

    /**
     * Tiketi za upravo odrađeni storno:
     *  - STORNO_KITCHEN: hrana i prilozi, bez cijena — kuhinja zna da stane (uvijek ako ima hrane)
     *  - STORNO_BAR: sve stornirano s iznosima — SAMO ako je narudžba već bila zatvorena
     *    (račun je otišao na šank); dok je stol otvoren šank još nema papir za tu narudžbu
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
                    now, kitchenLines, null, order.isPacked(), notice, orderNote(order), false));
        }

        if (order.getClosedAt() == null) return tickets;

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
                now, barLines, sum(barLines), order.isPacked(), notice, orderNote(order), false));

        return tickets;
    }

    private String stornoNotice(Order order) {
        return "STORNO NARUDŽBE #" + order.getId() + " · " + place(order);
    }

    /** "STOL 5" / "DOSTAVA — ZA PONIJETI" / "ZA PONIJETI" — za napomene na tiketu. */
    private String place(Order order) {
        String packed = notice(order);
        if (packed != null) return packed;
        return "STOL " + order.getTable();
    }

    // ==================== SLAGANJE TIKETA ====================

    private Ticket kitchenTicket(Order order, List<OrderItem> items) {
        List<TicketLine> lines = active(items).stream()
                .filter(this::isKitchenItem)
                .map(item -> kitchenLine(item, item.getActiveQuantity()))
                .toList();

        return new Ticket(TicketType.KITCHEN, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), lines, null, order.isPacked(), notice(order), orderNote(order), false);
    }

    private Ticket barTicket(Order order, List<OrderItem> items) {
        List<TicketLine> lines = active(items).stream()
                .map(this::pricedLine)
                .toList();

        return new Ticket(TicketType.BAR, order.getId(), order.getTable(), waiterName(order),
                LocalDateTime.now(), lines, sum(lines), order.isPacked(), notice(order), orderNote(order), false);
    }

    /** Kuhinja: porcija, opcije i napomena da kuhar zna što radi — cijena ga ne zanima. */
    /** U kuhinju ide hrana i prilozi (pomfrit, kečap...), piće samo na šank. */
    private boolean isKitchenItem(OrderItem item) {
        return item instanceof FoodOrderItem || item instanceof AddonOrderItem;
    }

    /**
     * Kuhinjski red: "Pizza Bio - Velika" u jednom redu (formatter prelama ako ne stane),
     * ispod opcije i napomena; prilog samo naziv.
     */
    private TicketLine kitchenLine(OrderItem item, int quantity) {
        if (item instanceof FoodOrderItem food) {
            String portion = portionSize(food);
            // "Standardna/Standardni/Standardno" kuhar ne treba — samo zauzima mjesto
            if (isStandardPortion(portion)) portion = null;
            int max = settingsService.kitchenWordLength(); // Admin -> Postavke printera
            String name = (portion == null || portion.isBlank())
                    ? shortWords(nameOf(item), max)
                    : shortWords(nameOf(item), max) + " - " + shortWords(portion, max);
            // opcije i napomena ("bez luka") ostaju pune — tu se ne smije ništa izgubiti
            return new TicketLine(quantity, name, joinDetail(optionNames(food), food.getNote()), null);
        }
        return new TicketLine(quantity, shortWords(nameOf(item), settingsService.kitchenWordLength()), null, null);
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

    /**
     * Na kuhinji je dovoljno prvih nekoliko slova svake riječi — više stane u red s velikim slovima.
     * Za max = 6: "Pizza Capricciosa" -> "Pizza Capric", "Gurmanska pljeskavica" -> "Gurman pljesk".
     * Kraće riječi ostaju cijele; razmaci se svode na jedan. max <= 0 -> bez skraćivanja.
     */
    static String shortWords(String text, int max) {
        if (text == null || text.isBlank() || max <= 0) return text;
        StringBuilder out = new StringBuilder();
        for (String word : text.trim().split("\\s+")) {
            if (out.length() > 0) out.append(' ');
            int cut = word.codePointCount(0, word.length()) > max
                    ? word.offsetByCodePoints(0, max)
                    : word.length();
            out.append(word, 0, cut);
        }
        return out.toString();
    }

    private static boolean isStandardPortion(String portion) {
        return portion != null && portion.trim().toLowerCase().startsWith("standard");
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
