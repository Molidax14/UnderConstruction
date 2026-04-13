package com.underconstruction.api.web;

import com.underconstruction.api.security.JwtService;
import com.underconstruction.api.service.AuthService;
import com.underconstruction.api.service.RegisterResult;
import com.underconstruction.api.web.dto.AuthUserDto;
import com.underconstruction.api.web.dto.LoginRequest;
import com.underconstruction.api.web.dto.RegisterRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {
        AuthUserDto user = authService.authenticate(req.usuario(), req.password(), req.tipo());
        if (user == null) {
            return ResponseEntity.status(401)
                    .body(
                            Map.of(
                                    "ok",
                                    false,
                                    "error",
                                    "Usuario o contraseña incorrectos"));
        }
        String token =
                jwtService.generateToken(
                        user.idUsuarios(), user.usuario(), user.nombre(), user.tipo());
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("usuario", user.usuario());
        userMap.put("tipo", user.tipo());
        userMap.put("idUsuarios", user.idUsuarios());
        userMap.put("nombre", user.nombre());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("token", token);
        body.put("user", userMap);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest req) {
        RegisterResult result =
                authService.register(req.nombre(), req.usuario(), req.password());
        if (result instanceof RegisterResult.Error err) {
            boolean conflict = err.message().contains("ya está en uso");
            int status = conflict ? 409 : 400;
            return ResponseEntity.status(status)
                    .body(Map.of("ok", false, "error", err.message()));
        }
        return ResponseEntity.status(201).body(Map.of("ok", true));
    }
}
