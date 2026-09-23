package com.example.megibackend.Repository;

import com.example.megibackend.Entity.FoodOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FoodOptionRepository extends JpaRepository<FoodOption, Long> {

    List<FoodOption> findByFoodIdOrderByNameAsc(Long foodId);

    /**
     * Opcije koje konobar smije ponuditi za odabranu porciju:
     * one bez porcije vrijede za cijelo jelo, ostale samo za svoju porciju.
     */
    @Query("""
            select o from FoodOption o
            where o.food.id = :foodId
              and (o.portion is null or o.portion.id = :portionId)
            order by o.name asc
            """)
    List<FoodOption> findForPortion(@Param("foodId") Long foodId,
                                    @Param("portionId") Long portionId);
}
