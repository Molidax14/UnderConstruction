package com.underconstruction.api.web;

import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Devuelve 404 JSON para rutas /api no definidas (menos específicas que los demás controladores).
 */
@RestController
@Order(Ordered.LOWEST_PRECEDENCE)
public class ApiFallbackController {

    @RequestMapping(
            value = "/api/**",
            method = {
                org.springframework.web.bind.annotation.RequestMethod.GET,
                org.springframework.web.bind.annotation.RequestMethod.POST,
                org.springframework.web.bind.annotation.RequestMethod.PATCH,
                org.springframework.web.bind.annotation.RequestMethod.PUT,
                org.springframework.web.bind.annotation.RequestMethod.DELETE,
                org.springframework.web.bind.annotation.RequestMethod.HEAD
            })
    public ResponseEntity<Map<String, String>> notFound() {
        return ResponseEntity.status(404).body(Map.of("error", "Not found"));
    }
}
