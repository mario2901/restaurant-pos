package com.example.megibackend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users") // "user" je rezervirana riječ u PostgreSQL-u
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String pin;

    private String name;

    @Enumerated(EnumType.STRING)
    private Role role = Role.WAITER;

    private boolean active = true;
}
