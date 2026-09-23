package com.example.megibackend.Service;

import com.example.megibackend.Entity.Addon;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Exceptions.NotFoundException;
import com.example.megibackend.Repository.AddonRepository;
import com.example.megibackend.Repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Dodaci koji se naplaćuju kao zasebna stavka (npr. "Extra sir", "Umak"). */
@Service
@RequiredArgsConstructor
@Transactional
public class AddonService {

    private final AddonRepository addonRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public Addon get(Long addonId) {
        return addonRepository.findById(addonId)
                .orElseThrow(() -> new NotFoundException("Dodatak " + addonId + " ne postoji."));
    }

    @Transactional(readOnly = true)
    public List<Addon> getAll() {
        return addonRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<Addon> getAvailable() {
        return addonRepository.findByAvailableTrueOrderByNameAsc();
    }

    public Addon create(String name, BigDecimal price) {
        String cleanName = requireName(name);

        if (addonRepository.existsByNameIgnoreCase(cleanName)) {
            throw new BusinessRuleException("Dodatak '" + cleanName + "' već postoji.");
        }

        Addon addon = new Addon();
        addon.setName(cleanName);
        addon.setPrice(requirePrice(price));
        addon.setAvailable(true);
        return addonRepository.save(addon);
    }

    public Addon update(Long addonId, String name, BigDecimal price) {
        Addon addon = get(addonId);
        String cleanName = requireName(name);

        if (addonRepository.existsByNameIgnoreCaseAndIdNot(cleanName, addonId)) {
            throw new BusinessRuleException("Dodatak '" + cleanName + "' već postoji.");
        }

        addon.setName(cleanName);
        addon.setPrice(requirePrice(price));
        return addonRepository.save(addon);
    }

    public Addon setAvailable(Long addonId, boolean available) {
        Addon addon = get(addonId);
        addon.setAvailable(available);
        return addonRepository.save(addon);
    }

    public void delete(Long addonId) {
        Addon addon = get(addonId);

        if (orderItemRepository.countByAddonId(addonId) > 0) {
            throw new BusinessRuleException("Dodatak '" + addon.getName()
                    + "' postoji u starim narudžbama i ne može se obrisati — skini ga s ponude.");
        }

        addonRepository.delete(addon);
    }

    private String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessRuleException("Naziv dodatka je obavezan.");
        }
        return name.trim();
    }

    private BigDecimal requirePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Cijena mora biti 0 ili veca.");
        }
        return price;
    }
}
