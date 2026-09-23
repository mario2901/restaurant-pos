package com.example.megibackend.Controller;

import com.example.megibackend.Dto.DrinkRequest;
import com.example.megibackend.Dto.DrinkResponse;
import com.example.megibackend.Dto.Mapper;
import com.example.megibackend.Dto.StockRequest;
import com.example.megibackend.Entity.DrinkCategory;
import com.example.megibackend.Service.DrinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drinks")
@RequiredArgsConstructor
public class DrinkController {

    private final DrinkService drinkService;

    /**
     * GET /api/drinks                     -> sve
     * GET /api/drinks?category=PIVA       -> samo piva
     * GET /api/drinks?onlyAvailable=true  -> samo ono što je na karti
     */
    @GetMapping
    public List<DrinkResponse> all(@RequestParam(defaultValue = "false") boolean onlyAvailable,
                                   @RequestParam(required = false) DrinkCategory category) {
        return Mapper.map(onlyAvailable
                ? drinkService.getAvailableByCategory(category)
                : drinkService.getByCategory(category), Mapper::toDto);
    }

    /** Popis kategorija za tabove na frontendu — {value, label}. */
    @GetMapping("/categories")
    public List<Map<String, String>> categories() {
        return Arrays.stream(DrinkCategory.values())
                .map(c -> Map.of("value", c.name(), "label", c.getLabel()))
                .toList();
    }

    @GetMapping("/{id}")
    public DrinkResponse one(@PathVariable Long id) {
        return Mapper.toDto(drinkService.get(id));
    }

    /** Piće pri kraju — upozorenje na admin ekranu. */
    @GetMapping("/low-stock")
    public List<DrinkResponse> lowStock(@RequestParam(defaultValue = "5") int threshold) {
        return Mapper.map(drinkService.getLowStock(threshold), Mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DrinkResponse create(@Valid @RequestBody DrinkRequest request) {
        return Mapper.toDto(drinkService.create(
                request.name(), request.price(), request.stock(), request.category()));
    }

    @PutMapping("/{id}")
    public DrinkResponse update(@PathVariable Long id, @Valid @RequestBody DrinkRequest request) {
        return Mapper.toDto(drinkService.update(
                id, request.name(), request.price(), request.category()));
    }

    @PatchMapping("/{id}/availability")
    public DrinkResponse setAvailable(@PathVariable Long id, @RequestParam boolean available) {
        return Mapper.toDto(drinkService.setAvailable(id, available));
    }

    /** Dostava robe: dodaj N komada. */
    @PostMapping("/{id}/stock")
    public DrinkResponse addStock(@PathVariable Long id, @Valid @RequestBody StockRequest request) {
        return Mapper.toDto(drinkService.addStock(id, request.amount()));
    }

    /** Inventura: postavi točno stanje. */
    @PutMapping("/{id}/stock")
    public DrinkResponse setStock(@PathVariable Long id, @Valid @RequestBody StockRequest request) {
        return Mapper.toDto(drinkService.setStock(id, request.amount()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        drinkService.delete(id);
    }
}
