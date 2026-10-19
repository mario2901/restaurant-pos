package com.example.megibackend.Controller;

import com.example.megibackend.Service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * GET  /api/backup   stanje: zadnji backup, greška, popis kopija
 * POST /api/backup   napravi backup odmah
 */
@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService backupService;

    @GetMapping
    public BackupService.BackupStatus status() {
        return backupService.status();
    }

    @PostMapping
    public BackupService.BackupFile backupNow() {
        return backupService.backupNow();
    }
}
