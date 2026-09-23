package com.example.megibackend.Repository;

import com.example.megibackend.Entity.Addon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddonRepository extends JpaRepository<Addon, Long> {

    List<Addon> findByAvailableTrue();

    List<Addon> findAllByOrderByNameAsc();

    List<Addon> findByAvailableTrueOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
