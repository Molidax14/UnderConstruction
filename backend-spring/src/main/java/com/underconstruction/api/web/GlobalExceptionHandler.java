package com.underconstruction.api.web;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(
                        Map.of(
                                "error",
                                e.getReason() != null ? e.getReason() : "Error"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        String msg = e.getMessage() != null ? e.getMessage() : "Solicitud inválida";
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDb(DataAccessException e) {
        log.error("Database error", e);
        Throwable cause = e.getMostSpecificCause();
        String msg = cause.getMessage() != null ? cause.getMessage() : "Server error";
        return ResponseEntity.status(500).body(Map.of("error", msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handle(Exception e) {
        log.error("Unhandled exception", e);
        String msg = e.getMessage() != null ? e.getMessage() : "Server error";
        return ResponseEntity.status(500).body(Map.of("error", msg));
    }
}
