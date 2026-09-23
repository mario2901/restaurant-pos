package com.example.megibackend.Controller;

import com.example.megibackend.Dto.*;
import com.example.megibackend.Entity.Order;
import com.example.megibackend.Entity.OrderItem;
import com.example.megibackend.Entity.OrderType;
import com.example.megibackend.Service.OrderService;
import com.example.megibackend.Service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final TicketService ticketService;

    // ==================== ČITANJE ====================

    /**
     * Pretraga narudžbi, svi parametri opcionalni:
     * /api/orders?type=DELIVERY
     * /api/orders?type=DELIVERY&from=2026-09-15T00:00:00&to=2026-09-15T23:59:59
     */
    @GetMapping
    public List<OrderResponse> search(
            @RequestParam(required = false) OrderType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return Mapper.map(orderService.find(type, from, to), Mapper::toDto);
    }

    /** Sidebar s aktivnim narudžbama; /api/orders/active?type=DELIVERY za samo dostave. */
    @GetMapping("/active")
    public List<OrderResponse> active(@RequestParam(required = false) OrderType type) {
        return Mapper.map(orderService.getActive(type), Mapper::toDto);
    }

    @GetMapping("/table/{table}/active")
    public List<OrderResponse> activeForTable(@PathVariable String table) {
        return Mapper.map(orderService.getActiveForTable(table), Mapper::toDto);
    }

    @GetMapping("/{id}")
    public OrderResponse one(@PathVariable Long id) {
        return Mapper.toDto(orderService.get(id));
    }

    @GetMapping("/{id}/total")
    public BigDecimal total(@PathVariable Long id) {
        return orderService.getTotal(id);
    }

    // ==================== OTVARANJE ====================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
        return Mapper.toDto(orderService.create(request.table(), request.userId()));
    }

    /** Klik na stol: vrati otvorenu narudžbu ili otvori novu. */
    @PostMapping("/open")
    public OrderResponse open(@Valid @RequestBody CreateOrderRequest request) {
        return Mapper.toDto(orderService.openForTable(request.table(), request.userId()));
    }

    // ==================== STAVKE ====================

    @PostMapping("/{id}/food")
    public OrderResponse addFood(@PathVariable Long id, @Valid @RequestBody AddFoodRequest request) {
        orderService.addFood(id, request.foodId(), request.portionId(),
                request.quantity(), request.note(), request.optionIds());
        return Mapper.toDto(orderService.get(id));
    }

    @PostMapping("/{id}/drinks")
    public OrderResponse addDrink(@PathVariable Long id, @Valid @RequestBody AddDrinkRequest request) {
        orderService.addDrink(id, request.drinkId(), request.quantity());
        return Mapper.toDto(orderService.get(id));
    }

    @PostMapping("/{id}/addons")
    public OrderResponse addAddon(@PathVariable Long id, @Valid @RequestBody AddAddonRequest request) {
        orderService.addAddon(id, request.addonId(), request.quantity());
        return Mapper.toDto(orderService.get(id));
    }

    /** Cijela košarica odjednom na postojeću narudžbu (bez slanja na print). */
    @PostMapping("/{id}/items")
    public OrderResponse addItems(@PathVariable Long id, @Valid @RequestBody AddItemsRequest request) {
        return Mapper.toDto(orderService.addItems(id, request.items()));
    }

    @PatchMapping("/{id}/items/{itemId}/quantity")
    public OrderResponse changeQuantity(@PathVariable Long id,
                                        @PathVariable Long itemId,
                                        @Valid @RequestBody QuantityRequest request) {
        orderService.changeQuantity(id, itemId, request.quantity());
        return Mapper.toDto(orderService.get(id));
    }

    /** Brisanje stavke koja još nije poslana na print. */
    @DeleteMapping("/{id}/items/{itemId}")
    public OrderResponse removeItem(@PathVariable Long id, @PathVariable Long itemId) {
        orderService.removeItem(id, itemId);
        return Mapper.toDto(orderService.get(id));
    }

    /** Storniranje već poslane stavke. */
    @PostMapping("/{id}/items/{itemId}/cancel")
    public OrderResponse cancelItem(@PathVariable Long id, @PathVariable Long itemId) {
        orderService.cancelItem(id, itemId);
        return Mapper.toDto(orderService.get(id));
    }

    // ==================== SLANJE I ZATVARANJE ====================

    /**
     * Gumb "Naruči" iz Redux košarice: otvori/preuzmi narudžbu za stol,
     * upiši sve stavke i pošalji ih na print — jedan poziv, jedna transakcija.
     */
    @PostMapping("/submit")
    public SendResult submit(@Valid @RequestBody SubmitOrderRequest request) {
        OrderService.SubmitOutcome outcome =
                orderService.submit(request.orderId(), request.table(), request.userId(), request.items());
        List<Ticket> tickets = ticketService.forSentItems(outcome.order().getId(), outcome.sent());
        return new SendResult(Mapper.toDto(outcome.order()), tickets);
    }

    /** Slanje stavki koje su već upisane na narudžbu. */
    @PostMapping("/{id}/send")
    public SendResult send(@PathVariable Long id) {
        List<OrderItem> sent = orderService.sendNewItems(id);
        List<Ticket> tickets = ticketService.forSentItems(id, sent);
        return new SendResult(Mapper.toDto(orderService.get(id)), tickets);
    }

    @PostMapping("/{id}/close")
    public OrderResponse close(@PathVariable Long id) {
        return Mapper.toDto(orderService.close(id));
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable Long id) {
        return Mapper.toDto(orderService.cancel(id));
    }

    // ==================== TIKETI ====================

    @GetMapping("/{id}/tickets/kitchen")
    public Ticket kitchenTicket(@PathVariable Long id) {
        return ticketService.kitchenTicket(id);
    }

    @GetMapping("/{id}/tickets/bar")
    public Ticket barTicket(@PathVariable Long id) {
        return ticketService.barTicket(id);
    }

    /** Pregled / ponovni print računa — NE zatvara narudžbu. */
    @GetMapping("/{id}/bill")
    public Ticket bill(@PathVariable Long id) {
        return ticketService.bill(id);
    }

    /** Gumb "Račun": zatvori narudžbu i vrati račun za print (za zatvorenu samo ponovni print). */
    @PostMapping("/{id}/bill")
    public Ticket billAndClose(@PathVariable Long id) {
        orderService.closeForBill(id);
        return ticketService.bill(id);
    }
}
