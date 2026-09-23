package com.example.megibackend.Controller;

import com.example.megibackend.Dto.*;
import com.example.megibackend.Entity.Role;
import com.example.megibackend.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Konobar utipka PIN na tabletu. */
    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request) {
        return Mapper.toDto(userService.login(request.pin()));
    }

    @GetMapping
    public List<UserResponse> all(@RequestParam(defaultValue = "false") boolean onlyActive,
                                  @RequestParam(required = false) Role role) {
        if (role != null) {
            return Mapper.map(userService.getByRole(role), Mapper::toDto);
        }
        return Mapper.map(onlyActive ? userService.getActive() : userService.getAll(), Mapper::toDto);
    }

    @GetMapping("/{id}")
    public UserResponse one(@PathVariable Long id) {
        return Mapper.toDto(userService.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserRequest request) {
        return Mapper.toDto(userService.create(request.name(), request.pin(), request.role()));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        return Mapper.toDto(userService.update(id, request.name(), request.role()));
    }

    @PatchMapping("/{id}/pin")
    public UserResponse changePin(@PathVariable Long id, @Valid @RequestBody PinRequest request) {
        return Mapper.toDto(userService.changePin(id, request.pin()));
    }

    /** Konobar koji više ne radi — deaktiviraj umjesto brisanja. */
    @PatchMapping("/{id}/active")
    public UserResponse setActive(@PathVariable Long id, @RequestParam boolean active) {
        return Mapper.toDto(userService.setActive(id, active));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
