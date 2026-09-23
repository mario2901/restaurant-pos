package com.example.megibackend.Controller;

import com.example.megibackend.Dto.DeliveryReport;
import com.example.megibackend.Dto.SalesReport;
import com.example.megibackend.Service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/today")
    public SalesReport today() {
        return reportService.today();
    }

    /** /api/reports/day?date=2026-09-10 */
    @GetMapping("/day")
    public SalesReport day(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reportService.forDay(date);
    }

    /** /api/reports/month?year=2026&month=9 */
    @GetMapping("/month")
    public SalesReport month(@RequestParam int year, @RequestParam int month) {
        return reportService.forMonth(year, month);
    }

    /** /api/reports/range?from=2026-09-01T00:00:00&to=2026-09-30T23:59:59 */
    @GetMapping("/range")
    public SalesReport range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return reportService.forRange(from, to);
    }

    // ==================== DOSTAVA ====================

    /** Izvještaj dostave za danas — može se izvući bilo kad u toku dana. */
    @GetMapping("/delivery/today")
    public DeliveryReport deliveryToday() {
        return reportService.deliveryToday();
    }

    /** /api/reports/delivery/day?date=2026-09-15 */
    @GetMapping("/delivery/day")
    public DeliveryReport deliveryDay(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reportService.deliveryForDay(date);
    }

    /** /api/reports/delivery/range?from=2026-09-01T00:00:00&to=2026-09-30T23:59:59 */
    @GetMapping("/delivery/range")
    public DeliveryReport deliveryRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return reportService.deliveryForRange(from, to);
    }

    /** Samo broj: ukupan promet dostave. /api/reports/delivery/total (danas) ili ?date=2026-09-15 */
    @GetMapping("/delivery/total")
    public BigDecimal deliveryTotal(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reportService.deliveryTotal(date != null ? date : LocalDate.now());
    }
}
