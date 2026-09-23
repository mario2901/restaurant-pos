package com.example.megibackend.Service;

import com.example.megibackend.Entity.Role;
import com.example.megibackend.Entity.User;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Exceptions.NotFoundException;
import com.example.megibackend.Repository.OrderRepository;
import com.example.megibackend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Konobari i admini. Prijava ide PIN-om jer se radi o tabletu u restoranu —
 * nema korisničkog imena i lozinke.
 *
 * PIN se sprema u čistom obliku — aplikacija radi lokalno u restoranu i PIN
 * služi samo za razlikovanje konobara, ne kao sigurnosna barijera.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    // ==================== PRIJAVA ====================

    /** Konobar utipka PIN na tabletu. */
    @Transactional(readOnly = true)
    public User login(String pin) {
        String cleanPin = requirePin(pin);
        return userRepository.findByPinAndActiveTrue(cleanPin)
                .orElseThrow(() -> new BusinessRuleException("Neispravan PIN."));
    }

    // ==================== ČITANJE ====================

    @Transactional(readOnly = true)
    public User get(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Korisnik " + userId + " ne postoji."));
    }

    @Transactional(readOnly = true)
    public List<User> getAll() {
        return userRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<User> getActive() {
        return userRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<User> getByRole(Role role) {
        return userRepository.findByRoleAndActiveTrueOrderByNameAsc(role);
    }

    // ==================== KREIRANJE / IZMJENA ====================

    public User create(String name, String pin, Role role) {
        String cleanName = requireName(name);
        String cleanPin = requirePin(pin);

        if (userRepository.existsByPin(cleanPin)) {
            throw new BusinessRuleException("PIN je već u upotrebi — odaberi drugi.");
        }

        User user = new User();
        user.setName(cleanName);
        user.setPin(cleanPin);
        user.setRole(role != null ? role : Role.WAITER);
        user.setActive(true);
        return userRepository.save(user);
    }

    public User update(Long userId, String name, Role role) {
        User user = get(userId);
        user.setName(requireName(name));

        if (role != null) {
            if (user.getRole() == Role.ADMIN && role != Role.ADMIN && isLastAdmin(userId)) {
                throw new BusinessRuleException("Mora postojati barem jedan aktivan admin.");
            }
            user.setRole(role);
        }

        return userRepository.save(user);
    }

    public User changePin(Long userId, String newPin) {
        User user = get(userId);
        String cleanPin = requirePin(newPin);

        if (userRepository.existsByPinAndIdNot(cleanPin, userId)) {
            throw new BusinessRuleException("PIN je već u upotrebi — odaberi drugi.");
        }

        user.setPin(cleanPin);
        return userRepository.save(user);
    }

    /** Konobar koji više ne radi — deaktivira se, ne briše, da mu ostanu narudžbe. */
    public User setActive(Long userId, boolean active) {
        User user = get(userId);

        if (!active && user.getRole() == Role.ADMIN && isLastAdmin(userId)) {
            throw new BusinessRuleException("Mora postojati barem jedan aktivan admin.");
        }

        user.setActive(active);
        return userRepository.save(user);
    }

    // ==================== BRISANJE ====================

    public void delete(Long userId) {
        User user = get(userId);

        if (orderRepository.countByUserId(userId) > 0) {
            throw new BusinessRuleException("Korisnik '" + user.getName()
                    + "' ima narudžbe i ne može se obrisati — deaktiviraj ga.");
        }
        if (user.getRole() == Role.ADMIN && isLastAdmin(userId)) {
            throw new BusinessRuleException("Mora postojati barem jedan aktivan admin.");
        }

        userRepository.delete(user);
    }

    // ==================== POMOĆNE METODE ====================

    private boolean isLastAdmin(Long userId) {
        return userRepository.findByRoleAndActiveTrueOrderByNameAsc(Role.ADMIN).stream()
                .noneMatch(u -> !u.getId().equals(userId));
    }

    private String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessRuleException("Ime je obavezno.");
        }
        return name.trim();
    }

    private String requirePin(String pin) {
        if (pin == null || pin.isBlank()) {
            throw new BusinessRuleException("PIN je obavezan.");
        }
        String clean = pin.trim();
        if (!clean.matches("\\d{4,6}")) {
            throw new BusinessRuleException("PIN mora imati 4 do 6 znamenki.");
        }
        return clean;
    }
}
