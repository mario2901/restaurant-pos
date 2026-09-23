package com.example.megibackend.Repository;

import com.example.megibackend.Entity.Portion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortionRepository extends JpaRepository<Portion, Long> {
    List<Portion> findByFoodId(Long foodId);
}
