package com.example.megibackend.Dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * @param fieldErrors popunjeno samo kod validacijskih grešaka (naziv polja -> poruka)
 */
public record ErrorResponse(int status,
                            String error,
                            LocalDateTime timestamp,
                            Map<String, String> fieldErrors) {

    public static ErrorResponse of(int status, String error) {
        return new ErrorResponse(status, error, LocalDateTime.now(), null);
    }

    public static ErrorResponse of(int status, String error, Map<String, String> fieldErrors) {
        return new ErrorResponse(status, error, LocalDateTime.now(), fieldErrors);
    }
}
