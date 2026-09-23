package com.example.megibackend.Repository;

import com.example.megibackend.Entity.Role;
import com.example.megibackend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPin(String pin);

    Optional<User> findByPinAndActiveTrue(String pin);

    List<User> findAllByOrderByNameAsc();

    List<User> findByActiveTrueOrderByNameAsc();

    List<User> findByRoleAndActiveTrueOrderByNameAsc(Role role);

    boolean existsByPin(String pin);

    boolean existsByPinAndIdNot(String pin, Long id);
}
