package com.example.megibackend.Repository;

import com.example.megibackend.Entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Služi prije svega za provjeru "je li ovaj artikl ikad bio naručen"
 * prije brisanja s menija — stare narudžbe se ne smiju pokvariti.
 */
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("select count(i) from FoodOrderItem i where i.food.id = :foodId")
    long countByFoodId(@Param("foodId") Long foodId);

    @Query("select count(i) from FoodOrderItem i where i.portion.id = :portionId")
    long countByPortionId(@Param("portionId") Long portionId);

    @Query("select count(i) from DrinkOrderItem i where i.drink.id = :drinkId")
    long countByDrinkId(@Param("drinkId") Long drinkId);

    @Query("select count(i) from AddonOrderItem i where i.addon.id = :addonId")
    long countByAddonId(@Param("addonId") Long addonId);

    @Query("select count(i) from FoodOrderItem i join i.options o where o.id = :optionId")
    long countByOptionId(@Param("optionId") Long optionId);
}
