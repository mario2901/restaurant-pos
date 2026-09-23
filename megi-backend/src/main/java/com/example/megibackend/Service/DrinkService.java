package com.example.megibackend.Service;

import com.example.megibackend.Entity.Drink;
import com.example.megibackend.Entity.DrinkCategory;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Exceptions.NotFoundException;
import com.example.megibackend.Repository.DrinkRepository;
import com.example.megibackend.Repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Karta pića i stanje zaliha.
 *
 * Napomena o zalihi: OrderService skida stock pri dodavanju stavke i vraća ga
 * pri storniranju. Ovdje su samo ručne korekcije — dostava robe i inventura.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DrinkService {

    private static final int DEFAULT_LOW_STOCK_THRESHOLD = 5;

    private final DrinkRepository drinkRepository;
    private final OrderItemRepository orderItemRepository;

    // ==================== ČITANJE ====================

    @Transactional(readOnly = true)
    public Drink get(Long drinkId) {
        return drinkRepository.findById(drinkId)
                .orElseThrow(() -> new NotFoundException("Piće " + drinkId + " ne postoji."));
    }

    @Transactional(readOnly = true)
    public List<Drink> getAll() {
        return drinkRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<Drink> getAvailable() {
        return drinkRepository.findByAvailableTrueOrderByNameAsc();
    }

    /** Tab na karti pića. category == null -> sve. */
    @Transactional(readOnly = true)
    public List<Drink> getByCategory(DrinkCategory category) {
        if (category == null) return getAll();
        return drinkRepository.findByCategoryOrderByNameAsc(category);
    }

    @Transactional(readOnly = true)
    public List<Drink> getAvailableByCategory(DrinkCategory category) {
        if (category == null) return getAvailable();
        return drinkRepository.findByAvailableTrueAndCategoryOrderByNameAsc(category);
    }

    /** Za upozorenje "pri kraju" na admin ekranu. */
    @Transactional(readOnly = true)
    public List<Drink> getLowStock() {
        return getLowStock(DEFAULT_LOW_STOCK_THRESHOLD);
    }

    @Transactional(readOnly = true)
    public List<Drink> getLowStock(int threshold) {
        return drinkRepository.findByStockLessThanEqualOrderByStockAsc(threshold);
    }

    // ==================== KREIRANJE / IZMJENA ====================

    public Drink create(String name, BigDecimal price, int stock, DrinkCategory category) {
        String cleanName = requireName(name);

        if (drinkRepository.existsByNameIgnoreCase(cleanName)) {
            throw new BusinessRuleException("Piće '" + cleanName + "' već postoji.");
        }

        Drink drink = new Drink();
        drink.setName(cleanName);
        drink.setPrice(requirePrice(price));
        drink.setStock(requireNotNegative(stock));
        drink.setCategory(requireCategory(category));
        drink.setAvailable(true);
        return drinkRepository.save(drink);
    }

    /** Nova cijena vrijedi od sada — stare narudžbe zadržavaju priceAtOrder. */
    public Drink update(Long drinkId, String name, BigDecimal price, DrinkCategory category) {
        Drink drink = get(drinkId);
        String cleanName = requireName(name);

        if (drinkRepository.existsByNameIgnoreCaseAndIdNot(cleanName, drinkId)) {
            throw new BusinessRuleException("Piće '" + cleanName + "' već postoji.");
        }

        drink.setName(cleanName);
        drink.setPrice(requirePrice(price));
        drink.setCategory(requireCategory(category));
        return drinkRepository.save(drink);
    }

    public Drink setAvailable(Long drinkId, boolean available) {
        Drink drink = get(drinkId);
        drink.setAvailable(available);
        return drinkRepository.save(drink);
    }

    // ==================== ZALIHA ====================

    /** Dostava robe: +N komada. */
    public Drink addStock(Long drinkId, int amount) {
        if (amount <= 0) {
            throw new BusinessRuleException("Količina za nadopunu mora biti veća od 0.");
        }
        Drink drink = get(drinkId);
        drink.setStock(drink.getStock() + amount);
        return drinkRepository.save(drink);
    }

    /** Inventura: postavi točno stanje. */
    public Drink setStock(Long drinkId, int stock) {
        Drink drink = get(drinkId);
        drink.setStock(requireNotNegative(stock));
        return drinkRepository.save(drink);
    }

    // ==================== BRISANJE ====================

    public void delete(Long drinkId) {
        Drink drink = get(drinkId);

        if (orderItemRepository.countByDrinkId(drinkId) > 0) {
            throw new BusinessRuleException("Piće '" + drink.getName()
                    + "' postoji u starim narudžbama i ne može se obrisati — skini ga s karte.");
        }

        drinkRepository.delete(drink);
    }

    // ==================== POMOĆNE METODE ====================

    private String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessRuleException("Naziv pića je obavezan.");
        }
        return name.trim();
    }

    private BigDecimal requirePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Cijena mora biti veća od 0.");
        }
        return price;
    }

    private DrinkCategory requireCategory(DrinkCategory category) {
        if (category == null) {
            throw new BusinessRuleException("Kategorija pića je obavezna.");
        }
        return category;
    }

    private int requireNotNegative(int stock) {
        if (stock < 0) {
            throw new BusinessRuleException("Zaliha ne može biti negativna.");
        }
        return stock;
    }
}
