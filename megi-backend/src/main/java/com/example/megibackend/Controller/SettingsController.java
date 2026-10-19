package com.example.megibackend.Controller;

import com.example.megibackend.Dto.SettingsRequest;
import com.example.megibackend.Dto.SettingsResponse;
import com.example.megibackend.Service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * GET /api/settings   važeće postavke (baza + application.properties)
 * PUT /api/settings   djelomična izmjena — šalju se samo polja koja se mijenjaju
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public SettingsResponse get() {
        return settingsService.toResponse();
    }

    @PutMapping
    public SettingsResponse update(@Valid @RequestBody SettingsRequest request) {
        return settingsService.update(request);
    }
}
