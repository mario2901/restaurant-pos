package com.example.megibackend.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * "Radni dan" restorana. Počinje u app.business-day.start (default 00:00 = kalendarski dan) i traje 24h.
 * Restoran radi 07-23, pa je default ponoć; pomakni samo ako počnu raditi iza ponoći.
 * Vrijeme se uzima sa sata servera (PC u restoranu), ne s tableta.
 */
@Service
public class BusinessDayService {

    private final LocalTime dayStart;

    public BusinessDayService(@Value("${app.business-day.start:00:00}") LocalTime dayStart) {
        this.dayStart = dayStart;
    }

    /** Datum trenutnog radnog dana (iza ponoći, prije početka dana = jučer). */
    public LocalDate currentDay() {
        LocalDateTime now = LocalDateTime.now();
        return now.toLocalTime().isBefore(dayStart)
                ? now.toLocalDate().minusDays(1)
                : now.toLocalDate();
    }

    public LocalDateTime startOf(LocalDate day) {
        return day.atTime(dayStart);
    }

    /** Ekskluzivni kraj: početak sljedećeg radnog dana. */
    public LocalDateTime endOf(LocalDate day) {
        return day.plusDays(1).atTime(dayStart);
    }

    public LocalDateTime currentStart() {
        return startOf(currentDay());
    }

    public LocalDateTime currentEnd() {
        return endOf(currentDay());
    }
}
