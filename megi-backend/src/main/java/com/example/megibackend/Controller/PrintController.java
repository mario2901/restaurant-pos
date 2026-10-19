package com.example.megibackend.Controller;

import com.example.megibackend.Dto.Ticket;
import com.example.megibackend.Service.PrintService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * POST /api/print                 body: [Ticket, ...]  -> backend rutira na kuhinju/šank
 * POST /api/print/test/kitchen    probna stranica
 * POST /api/print/test/bar
 * GET  /api/print/status          { enabled }
 *
 * Neisprintani tiketi (printer nije ispisao: nema papira, ugašen, zapeo red...):
 * GET    /api/print/failed            lista, najstariji prvi
 * POST   /api/print/failed/{id}/retry ponovni ispis (uspjeh ga briše s liste)
 * DELETE /api/print/failed/{id}       ukloni bez ispisa
 */
@RestController
@RequestMapping("/api/print")
@RequiredArgsConstructor
public class PrintController {

    private final PrintService printService;

    /** printed=false znači da je print isključen — frontend tada printa kroz browser. */
    public record PrintResult(boolean printed) {}

    @PostMapping
    public PrintResult print(@RequestBody List<Ticket> tickets) {
        return new PrintResult(printService.print(tickets));
    }

    @PostMapping("/test/{printer}")
    public PrintResult test(@PathVariable String printer) {
        printService.printTest(PrintService.Printer.valueOf(printer.toUpperCase()));
        return new PrintResult(true);
    }

    @GetMapping("/failed")
    public List<PrintService.FailedJob> failed() {
        return printService.failedJobs();
    }

    @PostMapping("/failed/{id}/retry")
    public PrintResult retry(@PathVariable long id) {
        printService.retry(id);
        return new PrintResult(true);
    }

    @DeleteMapping("/failed/{id}")
    public void dismiss(@PathVariable long id) {
        printService.dismiss(id);
    }

    /** Provjera printera bez ispisa (Admin -> Postavke). */
    @GetMapping("/check/{printer}")
    public PrintService.PrinterCheck check(@PathVariable String printer) {
        return printService.check(PrintService.Printer.valueOf(printer.toUpperCase()));
    }

    /** Printeri instalirani u Windowsima (za odabir USB šank printera). */
    @GetMapping("/windows-printers")
    public List<String> windowsPrinters() {
        return printService.windowsPrinters();
    }

    @GetMapping("/status")
    public PrintResult status() {
        return new PrintResult(printService.isEnabled());
    }
}
