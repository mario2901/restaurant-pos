package com.example.megibackend.Dto;

import com.example.megibackend.Entity.*;

import java.util.List;
import java.util.function.Function;

/**
 * Pretvorba entiteta u DTO.
 *
 * Postoji iz dva razloga: entiteti imaju dvosmjerne veze (Order <-> OrderItem)
 * koje bi Jackson vrtio u beskonačnost, i PIN korisnika ne smije van.
 */
public final class Mapper {

    private Mapper() {
    }

    public static <T, R> List<R> map(List<T> source, Function<T, R> mapper) {
        if (source == null) return List.of();
        return source.stream().map(mapper).toList();
    }

    // ==================== MENI ====================

    public static PortionResponse toDto(Portion portion) {
        if (portion == null) return null;
        return new PortionResponse(portion.getId(), portion.getSize(), portion.getPrice());
    }

    public static FoodOptionResponse toDto(FoodOption option) {
        if (option == null) return null;
        Portion portion = option.getPortion();
        return new FoodOptionResponse(
                option.getId(),
                option.getName(),
                option.getExtraPrice(),
                portion != null ? portion.getId() : null,
                portion != null ? portion.getSize() : null
        );
    }

    public static FoodResponse toDto(Food food) {
        if (food == null) return null;
        return new FoodResponse(
                food.getId(),
                food.getName(),
                food.getDescription(),
                food.getCategory(),
                food.isAvailable(),
                map(food.getPortions(), Mapper::toDto),
                map(food.getOptions(), Mapper::toDto)
        );
    }

    public static DrinkResponse toDto(Drink drink) {
        if (drink == null) return null;
        return new DrinkResponse(drink.getId(), drink.getName(), drink.getPrice(),
                drink.getStock(), drink.isAvailable(), drink.getCategory(),
                drink.getCategory() != null ? drink.getCategory().getLabel() : null);
    }

    public static AddonResponse toDto(Addon addon) {
        if (addon == null) return null;
        return new AddonResponse(addon.getId(), addon.getName(), addon.getPrice(), addon.isAvailable());
    }

    // ==================== KORISNICI ====================

    public static UserResponse toDto(User user) {
        if (user == null) return null;
        return new UserResponse(user.getId(), user.getName(), user.getRole(), user.isActive());
    }

    // ==================== NARUDŽBE ====================

    public static OrderItemResponse toDto(OrderItem item) {
        if (item == null) return null;

        String type = "ITEM";
        Long referenceId = null;
        String name = "Stavka";
        String detail = null;
        String note = null;
        List<String> options = List.of();

        if (item instanceof FoodOrderItem food) {
            type = "FOOD";
            referenceId = food.getFood() != null ? food.getFood().getId() : null;
            name = food.getFood() != null ? food.getFood().getName() : "Jelo";
            detail = food.getPortion() != null ? food.getPortion().getSize() : null;
            note = food.getNote();
            options = map(food.getOptions(), FoodOption::getName);
        } else if (item instanceof DrinkOrderItem drink) {
            type = "DRINK";
            referenceId = drink.getDrink() != null ? drink.getDrink().getId() : null;
            name = drink.getDrink() != null ? drink.getDrink().getName() : "Piće";
        } else if (item instanceof AddonOrderItem addon) {
            type = "ADDON";
            referenceId = addon.getAddon() != null ? addon.getAddon().getId() : null;
            name = addon.getAddon() != null ? addon.getAddon().getName() : "Dodatak";
        }

        return new OrderItemResponse(
                item.getId(), type, referenceId, name, detail,
                item.getQuantity(), item.getStornoQuantity(), item.getPriceAtOrder(), item.getLineTotal(),
                item.getStatus(), note, options
        );
    }

    public static OrderResponse toDto(Order order) {
        if (order == null) return null;
        User waiter = order.getUser();
        return new OrderResponse(
                order.getId(),
                order.getTable(),
                order.getType(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getClosedAt(),
                order.getNote(),
                waiter != null ? waiter.getId() : null,
                waiter != null ? waiter.getName() : null,
                map(order.getItems(), Mapper::toDto),
                order.getTotal()
        );
    }
}
