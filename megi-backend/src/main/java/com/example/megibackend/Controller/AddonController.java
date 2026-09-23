package com.example.megibackend.Controller;

import com.example.megibackend.Dto.AddonRequest;
import com.example.megibackend.Dto.AddonResponse;
import com.example.megibackend.Dto.Mapper;
import com.example.megibackend.Service.AddonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addons")
@RequiredArgsConstructor
public class AddonController {

    private final AddonService addonService;

    @GetMapping
    public List<AddonResponse> all(@RequestParam(defaultValue = "false") boolean onlyAvailable) {
        return Mapper.map(onlyAvailable ? addonService.getAvailable() : addonService.getAll(), Mapper::toDto);
    }

    @GetMapping("/{id}")
    public AddonResponse one(@PathVariable Long id) {
        return Mapper.toDto(addonService.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddonResponse create(@Valid @RequestBody AddonRequest request) {
        return Mapper.toDto(addonService.create(request.name(), request.price()));
    }

    @PutMapping("/{id}")
    public AddonResponse update(@PathVariable Long id, @Valid @RequestBody AddonRequest request) {
        return Mapper.toDto(addonService.update(id, request.name(), request.price()));
    }

    @PatchMapping("/{id}/availability")
    public AddonResponse setAvailable(@PathVariable Long id, @RequestParam boolean available) {
        return Mapper.toDto(addonService.setAvailable(id, available));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        addonService.delete(id);
    }
}
