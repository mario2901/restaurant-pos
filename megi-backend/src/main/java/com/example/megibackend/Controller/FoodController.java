package com.example.megibackend.Controller;

import com.example.megibackend.Dto.*;
import com.example.megibackend.Exceptions.BusinessRuleException;
import com.example.megibackend.Service.FoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/food")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    // ==================== JELA ====================

    /** @param onlyAvailable true = meni za konobara, false = administracija */
    @GetMapping
    public List<FoodResponse> all(@RequestParam(defaultValue = "false") boolean onlyAvailable) {
        return Mapper.map(onlyAvailable ? foodService.getAvailable() : foodService.getAll(), Mapper::toDto);
    }

    @GetMapping("/{id}")
    public FoodResponse one(@PathVariable Long id) {
        return Mapper.toDto(foodService.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FoodResponse create(@Valid @RequestBody FoodRequest request) {
        if (request.portions() == null || request.portions().isEmpty()) {
            throw new BusinessRuleException("Jelo mora imati barem jednu porciju s cijenom.");
        }
        return Mapper.toDto(foodService.create(request.name(), request.description(), request.category(), request.portions()));
    }

    @PutMapping("/{id}")
    public FoodResponse update(@PathVariable Long id, @Valid @RequestBody FoodRequest request) {
        return Mapper.toDto(foodService.update(id, request.name(), request.description(), request.category()));
    }

    /** Skidanje s menija / vraćanje na meni. */
    @PatchMapping("/{id}/availability")
    public FoodResponse setAvailable(@PathVariable Long id, @RequestParam boolean available) {
        return Mapper.toDto(foodService.setAvailable(id, available));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        foodService.delete(id);
    }

    // ==================== PORCIJE ====================

    @GetMapping("/{id}/portions")
    public List<PortionResponse> portions(@PathVariable Long id) {
        return Mapper.map(foodService.getPortions(id), Mapper::toDto);
    }

    @PostMapping("/{id}/portions")
    @ResponseStatus(HttpStatus.CREATED)
    public PortionResponse addPortion(@PathVariable Long id, @Valid @RequestBody PortionInput request) {
        return Mapper.toDto(foodService.addPortion(id, request.size(), request.price()));
    }

    @PutMapping("/portions/{portionId}")
    public PortionResponse updatePortion(@PathVariable Long portionId,
                                         @Valid @RequestBody PortionInput request) {
        return Mapper.toDto(foodService.updatePortion(portionId, request.size(), request.price()));
    }

    @DeleteMapping("/portions/{portionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePortion(@PathVariable Long portionId) {
        foodService.removePortion(portionId);
    }

    // ==================== OPCIJE ====================

    /**
     * @param portionId ako je zadan, vraća samo opcije koje vrijede uz tu porciju
     *                  (plus one koje vrijede za sve porcije)
     */
    @GetMapping("/{id}/options")
    public List<FoodOptionResponse> options(@PathVariable Long id,
                                            @RequestParam(required = false) Long portionId) {
        return Mapper.map(
                portionId != null ? foodService.getOptionsForPortion(id, portionId) : foodService.getOptions(id),
                Mapper::toDto);
    }

    @PostMapping("/{id}/options")
    @ResponseStatus(HttpStatus.CREATED)
    public FoodOptionResponse addOption(@PathVariable Long id,
                                        @Valid @RequestBody FoodOptionRequest request) {
        return Mapper.toDto(foodService.addOption(id, request.portionId(),
                request.name(), request.extraPrice()));
    }

    @PutMapping("/options/{optionId}")
    public FoodOptionResponse updateOption(@PathVariable Long optionId,
                                           @Valid @RequestBody FoodOptionRequest request) {
        return Mapper.toDto(foodService.updateOption(optionId, request.name(), request.extraPrice()));
    }

    @DeleteMapping("/options/{optionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeOption(@PathVariable Long optionId) {
        foodService.removeOption(optionId);
    }
}
