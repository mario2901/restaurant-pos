package com.example.megibackend.Service;

import com.example.megibackend.Dto.OrderItemRequest;
import com.example.megibackend.Entity.*;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Exceptions.NotFoundException;
import com.example.megibackend.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Jezgra sustava: životni ciklus narudžbe.
 *
 * Tok: otvori narudžbu za stol -> dodaj stavke (NEW) -> "Naruči" (NEW -> SENT, ide na print)
 *      -> po potrebi dodaj još stavki -> zatvori narudžbu (DONE).
 *
 * Pravila:
 *  - narudžba se mijenja samo dok je status NEW
 *  - cijena se zamrzava u priceAtOrder u trenutku dodavanja stavke
 *  - stavka koja još nije poslana može se obrisati; poslana se samo stornira
 *  - zaliha pića se skida pri dodavanju, a vraća pri storniranju/brisanju
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    /**
     * TODO PRIVREMENO: dok traje testiranje zaliha se ne provjerava ni ne skida
     * (app.stock.check-enabled=false). Kad se vrati prava logika zalihe — makni
     * ovo polje i sve if-ove koji ga koriste u addDrink/changeQuantity/restoreStock.
     */
    @Value("${app.stock.check-enabled:true}")
    private boolean stockCheckEnabled;

    private final OrderRepository orderRepository;
    private final FoodRepository foodRepository;
    private final PortionRepository portionRepository;
    private final FoodOptionRepository foodOptionRepository;
    private final DrinkRepository drinkRepository;
    private final AddonRepository addonRepository;
    private final UserRepository userRepository;

    // ==================== ČITANJE ====================

    @Transactional(readOnly = true)
    public Order get(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Narudžba " + orderId + " ne postoji."));
    }

    /** Sve otvorene narudžbe — za sidebar s aktivnim narudžbama. */
    @Transactional(readOnly = true)
    public List<Order> getActive() {
        return orderRepository.findByStatusOrderByCreatedAtAsc(OrderStatus.NEW);
    }

    /** Otvorene narudžbe jedne vrste, npr. sve aktivne dostave. */
    @Transactional(readOnly = true)
    public List<Order> getActive(OrderType type) {
        if (type == null) return getActive();
        return orderRepository.findByTypeAndStatusOrderByCreatedAtAsc(type, OrderStatus.NEW);
    }

    /**
     * Pretraga narudžbi s opcionalnim filterima: vrsta i/ili raspon kreiranja.
     * Bez raspona vraća sve narudžbe te vrste (najnovije prve).
     */
    @Transactional(readOnly = true)
    public List<Order> find(OrderType type, LocalDateTime from, LocalDateTime to) {
        if ((from == null) != (to == null)) {
            throw new BusinessRuleException("Za filtriranje po datumu pošalji i 'from' i 'to'.");
        }
        if (from != null && to.isBefore(from)) {
            throw new BusinessRuleException("Kraj razdoblja ne može biti prije početka.");
        }

        if (from != null) {
            return type != null
                    ? orderRepository.findByTypeAndCreatedAtBetweenOrderByCreatedAtAsc(type, from, to)
                    : orderRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(from, to);
        }
        return type != null
                ? orderRepository.findByTypeOrderByCreatedAtDesc(type)
                : orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Order> getActiveForTable(String table) {
        return orderRepository.findByTableAndStatus(normalizeTable(table), OrderStatus.NEW);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotal(Long orderId) {
        return get(orderId).getTotal();
    }

    // ==================== OTVARANJE NARUDŽBE ====================

    public Order create(String table, Long userId) {
        String label = normalizeTable(table);
        User waiter = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Korisnik " + userId + " ne postoji."));

        Order order = new Order();
        order.setTable(label);
        order.setType(OrderType.fromTable(label));
        order.setUser(waiter);
        order.setStatus(OrderStatus.NEW);
        order.setCreatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    /**
     * Ono što frontend zove kad konobar klikne stol:
     * vrati postojeću otvorenu narudžbu ili otvori novu.
     */
    public Order openForTable(String table, Long userId) {
        String label = normalizeTable(table);

        // dostava i za ponijeti: više narudžbi može biti otvoreno istovremeno -> uvijek nova
        if (OrderType.isMultiOrderTable(label)) {
            return create(label, userId);
        }

        return orderRepository.findFirstByTableAndStatusOrderByCreatedAtAsc(label, OrderStatus.NEW)
                .orElseGet(() -> create(label, userId));
    }

    // ==================== DODAVANJE STAVKI ====================

    public FoodOrderItem addFood(Long orderId, Long foodId, Long portionId, int quantity, String note) {
        return addFood(orderId, foodId, portionId, quantity, note, List.of());
    }

    /**
     * Cijena stavke = cijena porcije + zbroj extraPrice odabranih opcija,
     * npr. Ćevapi / Mala (6.00) + Cijela lepina (1.50) = 7.50 po komadu.
     * Sve se zamrzava u priceAtOrder.
     */
    public FoodOrderItem addFood(Long orderId, Long foodId, Long portionId, int quantity,
                                 String note, List<Long> optionIds) {
        Order order = getEditable(orderId);
        requirePositive(quantity);

        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new NotFoundException("Jelo " + foodId + " ne postoji."));
        Portion portion = portionRepository.findById(portionId)
                .orElseThrow(() -> new NotFoundException("Porcija " + portionId + " ne postoji."));

        if (!food.isAvailable()) {
            throw new BusinessRuleException("Jelo '" + food.getName() + "' trenutno nije na meniju.");
        }
        if (portion.getFood() == null || !portion.getFood().getId().equals(food.getId())) {
            throw new BusinessRuleException(
                    "Porcija '" + portion.getSize() + "' ne pripada jelu '" + food.getName() + "'.");
        }
        if (portion.getPrice() == null) {
            throw new BusinessRuleException("Porcija '" + portion.getSize() + "' nema definiranu cijenu.");
        }

        List<FoodOption> options = resolveOptions(food, portion, optionIds);

        BigDecimal unitPrice = portion.getPrice();
        for (FoodOption option : options) {
            if (option.getExtraPrice() != null) {
                unitPrice = unitPrice.add(option.getExtraPrice());
            }
        }

        FoodOrderItem item = new FoodOrderItem();
        item.setFood(food);
        item.setPortion(portion);
        item.setOptions(options);
        item.setQuantity(quantity);
        item.setNote(trimToNull(note));
        item.setPriceAtOrder(unitPrice); // zamrznuta cijena, opcije uključene
        item.setStatus(ItemStatus.NEW);

        order.addItem(item);
        orderRepository.save(order);
        return item;
    }

    /** Validira da odabrane opcije pripadaju jelu i vrijede za odabranu porciju. */
    private List<FoodOption> resolveOptions(Food food, Portion portion, List<Long> optionIds) {
        List<FoodOption> options = new ArrayList<>();
        if (optionIds == null || optionIds.isEmpty()) return options;

        for (Long optionId : new LinkedHashSet<>(optionIds)) {
            FoodOption option = foodOptionRepository.findById(optionId)
                    .orElseThrow(() -> new NotFoundException("Opcija " + optionId + " ne postoji."));

            if (option.getFood() == null || !option.getFood().getId().equals(food.getId())) {
                throw new BusinessRuleException(
                        "Opcija '" + option.getName() + "' ne pripada jelu '" + food.getName() + "'.");
            }
            if (option.getPortion() != null && !option.getPortion().getId().equals(portion.getId())) {
                throw new BusinessRuleException("Opcija '" + option.getName()
                        + "' vrijedi samo uz porciju '" + option.getPortion().getSize() + "'.");
            }

            options.add(option);
        }
        return options;
    }

    public DrinkOrderItem addDrink(Long orderId, Long drinkId, int quantity) {
        Order order = getEditable(orderId);
        requirePositive(quantity);

        Drink drink = drinkRepository.findById(drinkId)
                .orElseThrow(() -> new NotFoundException("Piće " + drinkId + " ne postoji."));

        if (!drink.isAvailable()) {
            throw new BusinessRuleException("Piće '" + drink.getName() + "' trenutno nije dostupno.");
        }
        // TODO PRIVREMENO: provjera i skidanje zalihe iskljuceni dok traje testiranje
        if (stockCheckEnabled) {
            if (drink.getStock() < quantity) {
                throw new BusinessRuleException("Nema dovoljno na stanju: '" + drink.getName()
                        + "' (na stanju " + drink.getStock() + ", traženo " + quantity + ").");
            }

            drink.setStock(drink.getStock() - quantity);
            drinkRepository.save(drink);
        }

        DrinkOrderItem item = new DrinkOrderItem();
        item.setDrink(drink);
        item.setQuantity(quantity);
        item.setPriceAtOrder(drink.getPrice());
        item.setStatus(ItemStatus.NEW);

        order.addItem(item);
        orderRepository.save(order);
        return item;
    }

    public AddonOrderItem addAddon(Long orderId, Long addonId, int quantity) {
        Order order = getEditable(orderId);
        requirePositive(quantity);

        Addon addon = addonRepository.findById(addonId)
                .orElseThrow(() -> new NotFoundException("Dodatak " + addonId + " ne postoji."));

        if (!addon.isAvailable()) {
            throw new BusinessRuleException("Dodatak '" + addon.getName() + "' trenutno nije dostupan.");
        }

        AddonOrderItem item = new AddonOrderItem();
        item.setAddon(addon);
        item.setQuantity(quantity);
        item.setPriceAtOrder(addon.getPrice());
        item.setStatus(ItemStatus.NEW);

        order.addItem(item);
        orderRepository.save(order);
        return item;
    }

    // ==================== CIJELA KOŠARICA ODJEDNOM ====================

    /**
     * Upisuje cijelu košaricu iz frontenda u jednom pozivu.
     *
     * Sve se vrti unutar ove jedne transakcije (pozivi addFood/addDrink/addAddon
     * su interni, pa im vlastiti @Transactional ionako ne bi ništa značio), što
     * znači sve-ili-ništa: ako jednog pića nema dovoljno, ne upiše se nijedna
     * stavka i konobar odmah vidi zašto.
     */
    public Order addItems(Long orderId, List<OrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessRuleException("Narudžba mora imati barem jednu stavku.");
        }

        for (OrderItemRequest item : items) {
            if (item.type() == null) {
                throw new BusinessRuleException("Tip stavke je obavezan (FOOD, DRINK ili ADDON).");
            }
            switch (item.type()) {
                case FOOD -> addFood(orderId,
                        requireId(item.foodId(), "Jelo"),
                        requireId(item.portionId(), "Porcija"),
                        item.quantity(), item.note(), item.optionIds());
                case DRINK -> addDrink(orderId, requireId(item.drinkId(), "Piće"), item.quantity());
                case ADDON -> addAddon(orderId, requireId(item.addonId(), "Dodatak"), item.quantity());
            }
        }

        return get(orderId);
    }

    /** Rezultat slanja košarice: narudžba i stavke koje idu na tikete. */
    public record SubmitOutcome(Order order, List<OrderItem> sent) {
    }

    /**
     * Gumb "Naruči" u jednom pozivu: otvori ili preuzmi narudžbu za stol,
     * upiši košaricu i pošalji nove stavke na print.
     */
    public SubmitOutcome submit(String table, Long userId, List<OrderItemRequest> items) {
        return submit(null, table, userId, items);
    }

    /**
     * Ako je orderId poslan, stavke idu na tu (otvorenu) narudžbu —
     * tako se dodaje na postojeću dostavu. Inače openForTable.
     */
    public SubmitOutcome submit(Long orderId, String table, Long userId, List<OrderItemRequest> items) {
        Order order = orderId != null ? getEditable(orderId) : openForTable(table, userId);
        addItems(order.getId(), items);
        List<OrderItem> sent = sendNewItems(order.getId());
        return new SubmitOutcome(get(order.getId()), sent);
    }

    private Long requireId(Long id, String what) {
        if (id == null) {
            throw new BusinessRuleException(what + " je obavezno za tu stavku.");
        }
        return id;
    }

    // ==================== IZMJENA STAVKI ====================

    public OrderItem changeQuantity(Long orderId, Long itemId, int newQuantity) {
        Order order = getEditable(orderId);
        requirePositive(newQuantity);
        OrderItem item = findItem(order, itemId);

        if (item.getStatus() == ItemStatus.CANCELLED) {
            throw new BusinessRuleException("Stornirana stavka se ne može mijenjati.");
        }

        int diff = newQuantity - item.getQuantity();
        // TODO PRIVREMENO: korekcija zalihe preskace se dok je provjera iskljucena
        if (stockCheckEnabled && diff != 0 && item instanceof DrinkOrderItem drinkItem) {
            Drink drink = drinkItem.getDrink();
            if (diff > 0 && drink.getStock() < diff) {
                throw new BusinessRuleException("Nema dovoljno na stanju: '" + drink.getName()
                        + "' (na stanju " + drink.getStock() + ").");
            }
            drink.setStock(drink.getStock() - diff);
            drinkRepository.save(drink);
        }

        item.setQuantity(newQuantity);
        orderRepository.save(order);
        return item;
    }

    /** Brisanje stavke koja još nije poslana (konobar se zabunio pri unosu). */
    public void removeItem(Long orderId, Long itemId) {
        Order order = getEditable(orderId);
        OrderItem item = findItem(order, itemId);

        if (item.getStatus() != ItemStatus.NEW) {
            throw new BusinessRuleException(
                    "Stavka je već poslana na print — može se samo stornirati, ne obrisati.");
        }

        restoreStock(item);
        order.removeItem(item);
        orderRepository.save(order);
    }

    /** Storniranje već poslane stavke — ostaje u bazi radi traga, ne ulazi u total. */
    public OrderItem cancelItem(Long orderId, Long itemId) {
        Order order = getEditable(orderId);
        OrderItem item = findItem(order, itemId);

        if (item.getStatus() == ItemStatus.CANCELLED) {
            throw new BusinessRuleException("Stavka je već stornirana.");
        }

        restoreStock(item);
        item.setStatus(ItemStatus.CANCELLED);
        orderRepository.save(order);
        return item;
    }

    // ==================== SLANJE NA PRINT ====================

    /**
     * Gumb "Naruči": sve nove stavke prelaze u SENT i vraćaju se pozivatelju
     * kako bi TicketService (sljedeći korak) od njih složio kuhinjski i šank tiket.
     */
    public List<OrderItem> sendNewItems(Long orderId) {
        Order order = getEditable(orderId);

        List<OrderItem> toSend = order.getItems().stream()
                .filter(i -> i.getStatus() == ItemStatus.NEW)
                .toList();

        if (toSend.isEmpty()) {
            throw new BusinessRuleException("Nema novih stavki za slanje.");
        }

        toSend.forEach(i -> i.setStatus(ItemStatus.SENT));
        orderRepository.save(order);
        return toSend;
    }

    // ==================== ZATVARANJE ====================

    public Order close(Long orderId) {
        Order order = getEditable(orderId);

        boolean hasUnsent = order.getItems().stream()
                .anyMatch(i -> i.getStatus() == ItemStatus.NEW);
        if (hasUnsent) {
            throw new BusinessRuleException(
                    "Narudžba ima stavke koje nisu poslane — pošalji ih ili obriši prije zatvaranja.");
        }

        boolean hasActive = order.getItems().stream()
                .anyMatch(i -> i.getStatus() != ItemStatus.CANCELLED);
        if (!hasActive) {
            throw new BusinessRuleException("Prazna narudžba se ne zatvara — otkaži je.");
        }

        order.setStatus(OrderStatus.DONE);
        order.setClosedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    /**
     * Gumb "Račun" (stol i dostava): zatvara narudžbu i vraća je za print računa.
     * Dostava ostaje otvorena nakon slanja na print, pa se na nju može dodavati
     * sve dok se u šanku ne zatraži račun. Za već zatvorenu narudžbu samo ponovni print.
     */
    public Order closeForBill(Long orderId) {
        Order order = get(orderId);
        if (order.getStatus() == OrderStatus.DONE) {
            return order;
        }
        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new BusinessRuleException("Narudžba " + orderId + " je otkazana — račun se ne izdaje.");
        }
        return close(orderId);
    }

    public Order cancel(Long orderId) {
        Order order = getEditable(orderId);

        order.getItems().stream()
                .filter(i -> i.getStatus() != ItemStatus.CANCELLED)
                .forEach(i -> {
                    restoreStock(i);
                    i.setStatus(ItemStatus.CANCELLED);
                });

        order.setStatus(OrderStatus.CANCELED);
        order.setClosedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    // ==================== POMOĆNE METODE ====================

    private Order getEditable(Long orderId) {
        Order order = get(orderId);
        if (!order.isEditable()) {
            throw new BusinessRuleException(
                    "Narudžba " + orderId + " je " + order.getStatus() + " i više se ne može mijenjati.");
        }
        return order;
    }

    private OrderItem findItem(Order order, Long itemId) {
        return order.getItems().stream()
                .filter(i -> itemId.equals(i.getId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException(
                        "Stavka " + itemId + " ne postoji na narudžbi " + order.getId() + "."));
    }

    /** Vraća zalihu pića kad se stavka briše ili stornira. */
    private void restoreStock(OrderItem item) {
        // TODO PRIVREMENO: nema sta vracati jer se zaliha ni ne skida
        if (!stockCheckEnabled) return;
        if (item.getStatus() == ItemStatus.CANCELLED) return;
        if (item instanceof DrinkOrderItem drinkItem && drinkItem.getDrink() != null) {
            Drink drink = drinkItem.getDrink();
            drink.setStock(drink.getStock() + item.getQuantity());
            drinkRepository.save(drink);
        }
    }

    private void requirePositive(int quantity) {
        if (quantity <= 0) {
            throw new BusinessRuleException("Količina mora biti veća od 0.");
        }
    }

    private String normalizeTable(String table) {
        if (table == null || table.isBlank()) {
            throw new BusinessRuleException("Oznaka stola je obavezna.");
        }
        String label = table.trim();
        if (OrderType.isDeliveryTable(label)) return OrderType.DELIVERY_TABLE;
        if (OrderType.isTakeawayTable(label)) return OrderType.TAKEAWAY_TABLE;
        return label;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
