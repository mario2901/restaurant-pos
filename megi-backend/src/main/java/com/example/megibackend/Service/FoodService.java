package com.example.megibackend.Service;

import com.example.megibackend.Dto.PortionInput;
import com.example.megibackend.Entity.Food;
import com.example.megibackend.Entity.FoodOption;
import com.example.megibackend.Entity.Portion;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Exceptions.NotFoundException;
import com.example.megibackend.Repository.FoodOptionRepository;
import com.example.megibackend.Repository.FoodRepository;
import com.example.megibackend.Repository.OrderItemRepository;
import com.example.megibackend.Repository.PortionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Uređivanje menija hrane (ekran iza gumba "profil").
 *
 * Pravila:
 *  - jelo mora imati barem jednu porciju, jer cijena živi na porciji
 *  - artikl koji je ikad bio naručen se NE briše nego se skine s menija
 *    (available = false) — inače pucaju stare narudžbe i statistika
 *  - promjena cijene ne dira stare narudžbe zahvaljujući priceAtOrder
 */
@Service
@RequiredArgsConstructor
@Transactional
public class FoodService {

    private final FoodRepository foodRepository;
    private final PortionRepository portionRepository;
    private final FoodOptionRepository foodOptionRepository;
    private final OrderItemRepository orderItemRepository;

    // ==================== ČITANJE ====================

    @Transactional(readOnly = true)
    public Food get(Long foodId) {
        return foodRepository.findById(foodId)
                .orElseThrow(() -> new NotFoundException("Jelo " + foodId + " ne postoji."));
    }

    /** Sve, uključujući skinuto s menija — za administraciju. */
    @Transactional(readOnly = true)
    public List<Food> getAll() {
        return foodRepository.findAllByOrderByNameAsc();
    }

    /** Samo ono što konobar smije naručiti. */
    @Transactional(readOnly = true)
    public List<Food> getAvailable() {
        return foodRepository.findByAvailableTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<Portion> getPortions(Long foodId) {
        return portionRepository.findByFoodId(get(foodId).getId());
    }

    // ==================== KREIRANJE ====================

    public Food create(String name, String description, String category, List<PortionInput> portions) {
        String cleanName = requireName(name);

        if (foodRepository.existsByNameIgnoreCase(cleanName)) {
            throw new BusinessRuleException("Jelo '" + cleanName + "' već postoji.");
        }
        if (portions == null || portions.isEmpty()) {
            throw new BusinessRuleException("Jelo mora imati barem jednu porciju s cijenom.");
        }

        Food food = new Food();
        food.setName(cleanName);
        food.setDescription(trimToNull(description));
        food.setCategory(trimToNull(category));
        food.setAvailable(true);

        for (PortionInput input : portions) {
            Portion portion = new Portion();
            portion.setSize(requireSize(input.size()));
            portion.setPrice(requirePrice(input.price()));
            food.addPortion(portion);
        }

        return foodRepository.save(food);
    }

    // ==================== IZMJENA ====================

    public Food update(Long foodId, String name, String description, String category) {
        Food food = get(foodId);
        String cleanName = requireName(name);

        if (foodRepository.existsByNameIgnoreCaseAndIdNot(cleanName, foodId)) {
            throw new BusinessRuleException("Jelo '" + cleanName + "' već postoji.");
        }

        food.setName(cleanName);
        food.setDescription(trimToNull(description));
        food.setCategory(trimToNull(category));
        return foodRepository.save(food);
    }

    /** Skidanje s menija / vraćanje na meni. */
    public Food setAvailable(Long foodId, boolean available) {
        Food food = get(foodId);
        food.setAvailable(available);
        return foodRepository.save(food);
    }

    // ==================== PORCIJE ====================

    public Portion addPortion(Long foodId, String size, BigDecimal price) {
        Food food = get(foodId);
        String cleanSize = requireSize(size);

        boolean duplicate = food.getPortions().stream()
                .anyMatch(p -> cleanSize.equalsIgnoreCase(p.getSize()));
        if (duplicate) {
            throw new BusinessRuleException(
                    "Jelo '" + food.getName() + "' već ima porciju '" + cleanSize + "'.");
        }

        Portion portion = new Portion();
        portion.setSize(cleanSize);
        portion.setPrice(requirePrice(price));
        food.addPortion(portion);

        foodRepository.save(food);
        return portion;
    }

    /** Nova cijena vrijedi od sada — stare narudžbe zadržavaju priceAtOrder. */
    public Portion updatePortion(Long portionId, String size, BigDecimal price) {
        Portion portion = getPortion(portionId);
        portion.setSize(requireSize(size));
        portion.setPrice(requirePrice(price));
        return portionRepository.save(portion);
    }

    public void removePortion(Long portionId) {
        Portion portion = getPortion(portionId);
        Food food = portion.getFood();

        if (food != null && food.getPortions().size() <= 1) {
            throw new BusinessRuleException(
                    "Jelo mora imati barem jednu porciju — skini cijelo jelo s menija umjesto brisanja porcije.");
        }
        if (orderItemRepository.countByPortionId(portionId) > 0) {
            throw new BusinessRuleException(
                    "Porcija '" + portion.getSize() + "' je već bila naručivana i ne može se obrisati.");
        }
        if (food != null) {
            boolean usedByOption = food.getOptions().stream()
                    .anyMatch(o -> o.getPortion() != null && o.getPortion().getId().equals(portionId));
            if (usedByOption) {
                throw new BusinessRuleException("Porcija '" + portion.getSize()
                        + "' ima vezane opcije — obriši prvo njih.");
            }
        }

        if (food != null) {
            food.removePortion(portion);
            foodRepository.save(food);
        } else {
            portionRepository.delete(portion);
        }
    }

    // ==================== OPCIJE ====================

    @Transactional(readOnly = true)
    public List<FoodOption> getOptions(Long foodId) {
        return foodOptionRepository.findByFoodIdOrderByNameAsc(get(foodId).getId());
    }

    /**
     * Opcije koje konobar vidi nakon što odabere porciju.
     * Opcija bez porcije vrijedi za sve porcije tog jela.
     */
    @Transactional(readOnly = true)
    public List<FoodOption> getOptionsForPortion(Long foodId, Long portionId) {
        return foodOptionRepository.findForPortion(get(foodId).getId(), portionId);
    }

    /**
     * @param portionId null = opcija vrijedi za sve porcije jela;
     *                  inače vrijedi samo uz tu porciju
     *                  (npr. "Cijela lepina" samo uz malu porciju ćevapa)
     */
    public FoodOption addOption(Long foodId, Long portionId, String name, BigDecimal extraPrice) {
        Food food = get(foodId);
        String cleanName = requireOptionName(name);

        Portion portion = null;
        if (portionId != null) {
            portion = getPortion(portionId);
            if (portion.getFood() == null || !portion.getFood().getId().equals(food.getId())) {
                throw new BusinessRuleException(
                        "Porcija '" + portion.getSize() + "' ne pripada jelu '" + food.getName() + "'.");
            }
        }

        final Long targetPortionId = portionId;
        boolean duplicate = food.getOptions().stream().anyMatch(o -> {
            Long existing = o.getPortion() != null ? o.getPortion().getId() : null;
            return cleanName.equalsIgnoreCase(o.getName()) && Objects.equals(existing, targetPortionId);
        });
        if (duplicate) {
            throw new BusinessRuleException("Opcija '" + cleanName + "' već postoji za to jelo.");
        }

        FoodOption option = new FoodOption();
        option.setName(cleanName);
        option.setExtraPrice(requireExtraPrice(extraPrice));
        option.setPortion(portion);
        food.addOption(option);

        foodRepository.save(food);
        return option;
    }

    public FoodOption updateOption(Long optionId, String name, BigDecimal extraPrice) {
        FoodOption option = getOption(optionId);
        option.setName(requireOptionName(name));
        option.setExtraPrice(requireExtraPrice(extraPrice));
        return foodOptionRepository.save(option);
    }

    public void removeOption(Long optionId) {
        FoodOption option = getOption(optionId);

        if (orderItemRepository.countByOptionId(optionId) > 0) {
            throw new BusinessRuleException("Opcija '" + option.getName()
                    + "' je već bila naručivana i ne može se obrisati.");
        }

        Food food = option.getFood();
        if (food != null) {
            food.removeOption(option);
            foodRepository.save(food);
        } else {
            foodOptionRepository.delete(option);
        }
    }

    // ==================== BRISANJE ====================

    public void delete(Long foodId) {
        Food food = get(foodId);

        if (orderItemRepository.countByFoodId(foodId) > 0) {
            throw new BusinessRuleException("Jelo '" + food.getName()
                    + "' postoji u starim narudžbama i ne može se obrisati — skini ga s menija.");
        }

        foodRepository.delete(food);
    }

    // ==================== POMOĆNE METODE ====================

    private Portion getPortion(Long portionId) {
        return portionRepository.findById(portionId)
                .orElseThrow(() -> new NotFoundException("Porcija " + portionId + " ne postoji."));
    }

    private FoodOption getOption(Long optionId) {
        return foodOptionRepository.findById(optionId)
                .orElseThrow(() -> new NotFoundException("Opcija " + optionId + " ne postoji."));
    }

    private String requireOptionName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessRuleException("Naziv opcije je obavezan (npr. Cijela lepina).");
        }
        return name.trim();
    }

    /** Opcija smije biti besplatna (0), ali ne i negativna. */
    private BigDecimal requireExtraPrice(BigDecimal extraPrice) {
        if (extraPrice == null) return BigDecimal.ZERO;
        if (extraPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Doplata za opciju ne može biti negativna.");
        }
        return extraPrice;
    }

    private String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessRuleException("Naziv jela je obavezan.");
        }
        return name.trim();
    }

    private String requireSize(String size) {
        if (size == null || size.isBlank()) {
            throw new BusinessRuleException("Naziv porcije je obavezan (npr. Mala, Srednja, Velika).");
        }
        return size.trim();
    }

    private BigDecimal requirePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Cijena mora biti veća od 0.");
        }
        return price;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
