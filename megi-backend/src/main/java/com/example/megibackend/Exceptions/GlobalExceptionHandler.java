package com.example.megibackend.Exceptions;

import com.example.megibackend.Dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

/**
 * Pretvara SVE iznimke u uredan JSON { status, error, timestamp, fieldErrors },
 * tako da frontend uvijek dobije čitljivu poruku i nijedna greška ne izađe kao
 * stack trace ili HTML stranica.
 *
 * Napomena: Spring Boot ionako ne "pada" zbog greške u jednom zahtjevu — ovaj
 * handler osigurava da konobar vidi razumljivu poruku, a mi trag u logu.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==================== NAŠE IZNIMKE ====================

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // ==================== NEISPRAVAN ZAHTJEV ====================

    /** Greške iz @Valid anotacija na request DTO-ovima. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Neispravni podaci u zahtjevu.",
                fieldErrors));
    }

    /** @Validated na parametrima (npr. @Min na @RequestParam). */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
        return error(HttpStatus.BAD_REQUEST, "Neispravni podaci u zahtjevu.");
    }

    /** Neispravan ili nepotpun JSON u tijelu zahtjeva. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        log.warn("Neispravan JSON: {}", ex.getMostSpecificCause().getMessage());
        return error(HttpStatus.BAD_REQUEST, "Neispravan format zahtjeva.");
    }

    /** npr. /api/orders/abc umjesto broja, ili nepoznata vrijednost enuma. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return error(HttpStatus.BAD_REQUEST, "Neispravna vrijednost za '" + ex.getName() + "'.");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        return error(HttpStatus.BAD_REQUEST, "Nedostaje parametar '" + ex.getParameterName() + "'.");
    }

    // ==================== BAZA ====================

    /** FK / unique: npr. brisanje nečega na što se narudžbe pozivaju. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Narušen integritet podataka: {}", ex.getMostSpecificCause().getMessage());
        return error(HttpStatus.CONFLICT,
                "Radnja nije moguća jer je zapis povezan s drugim podacima (npr. narudžbama).");
    }

    /** Dvije izmjene istog zapisa u isto vrijeme. */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleConcurrent(OptimisticLockingFailureException ex) {
        return error(HttpStatus.CONFLICT, "Podatak je upravo izmijenjen na drugom uređaju — pokušaj ponovno.");
    }

    // ==================== SVE OSTALO ====================

    /**
     * Zadnja linija obrane. Springove vlastite greške (404 nepostojeći URL,
     * 405 kriva metoda, 415...) nose svoj status kroz ErrorResponse — njih
     * ne pretvaramo u 500, samo im damo naš oblik JSON-a.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAny(Exception ex) {
        if (ex instanceof org.springframework.web.ErrorResponse springError) {
            HttpStatusCode status = springError.getStatusCode();
            String message = switch (status.value()) {
                case 404 -> "Traženi resurs ne postoji.";
                case 405 -> "Metoda nije podržana za ovu adresu.";
                default -> "Neispravan zahtjev.";
            };
            return ResponseEntity.status(status).body(ErrorResponse.of(status.value(), message));
        }

        log.error("Neočekivana greška", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR,
                "Došlo je do neočekivane greške. Pokušaj ponovno, a ako se ponavlja javi administratoru.");
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ErrorResponse.of(status.value(), message));
    }
}
