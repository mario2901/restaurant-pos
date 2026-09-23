package com.example.megibackend.Repository;

import com.example.megibackend.Entity.Drink;
import com.example.megibackend.Entity.DrinkCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DrinkRepository extends JpaRepository<Drink, Long> {

    List<Drink> findByAvailableTrue();

    List<Drink> findAllByOrderByNameAsc();

    // karta pića koju vidi konobar
    List<Drink> findByAvailableTrueOrderByNameAsc();

    // tabovi na karti pića (Piva, Sokovi, ...)
    List<Drink> findByCategoryOrderByNameAsc(DrinkCategory category);

    List<Drink> findByAvailableTrueAndCategoryOrderByNameAsc(DrinkCategory category);

    // za upozorenje "pri kraju" u profilu/statistici
    List<Drink> findByStockLessThanEqualOrderByStockAsc(int threshold);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
