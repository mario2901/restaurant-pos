package com.example.megibackend.Dto;

import com.example.megibackend.Entity.Role;

/** PIN se namjerno NE vraća prema van. */
public record UserResponse(Long id, String name, Role role, boolean active) {
}
