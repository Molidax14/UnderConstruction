# Guía del login: Spring Boot + React

Esta guía prioriza el **backend Spring Boot** (`backend-spring`): endpoints, seguridad, JWT y acceso a MariaDB. Al final resume el frontend React que consume la API.

## Spring Boot: módulo backend-spring

- Proyecto Maven, paquete base `com.underconstruction.api`.
- **REST** en `web/` (`AuthController`, etc.), **reglas de seguridad** en `config/SecurityConfig`, **JWT** en `security/`.
- Contraseñas con **BCrypt** (`JwtConfig` expone el bean `PasswordEncoder`).
- Sesión **stateless**: no hay cookies de sesión; el cliente envía `Authorization: Bearer <token>` en rutas `/api/**` protegidas.

Rutas públicas relevantes al login:

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/api/auth/login` | Credenciales → JWT + datos de usuario |
| POST | `/api/auth/register` | Alta de usuario con hash bcrypt |
| GET | `/api/health` | Comprobación de vida del servicio |

## AuthController: login y registro REST

`AuthController` recibe JSON, delega en `AuthService` y firma el JWT con `JwtService`.

```java
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
```

DTO de entrada del login (record Java):

```java
package com.underconstruction.api.web.dto;

public record LoginRequest(String usuario, String password, String tipo) {}
```

Registro:

```java
package com.underconstruction.api.web.dto;

public record RegisterRequest(String nombre, String usuario, String password) {}
```

## AuthService: bcrypt y MariaDB

Consulta el usuario por nombre de login, valida con `passwordEncoder.matches` y normaliza el tipo (`generic` / `acm`). El registro valida campos, comprueba duplicados e inserta con contraseña ya hasheada.

```java
package com.underconstruction.api.service;

import com.underconstruction.api.web.dto.AuthUserDto;
import java.util.Locale;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String FIND_USER =
            "SELECT IdUsuarios, Nombre, Usuario, Clave FROM usuarios "
                    + "WHERE LOWER(TRIM(Usuario)) = LOWER(TRIM(?)) LIMIT 1";

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public AuthService(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    /** @return null if invalid credentials */
    public AuthUserDto authenticate(String usuario, String password, String tipo) {
        if (usuario == null || usuario.isBlank() || password == null) {
            return null;
        }
        String tipoNorm = (tipo == null || tipo.isBlank()) ? "generic" : tipo.toLowerCase(Locale.ROOT);
        if (!tipoNorm.equals("generic") && !tipoNorm.equals("acm")) {
            tipoNorm = "generic";
        }
        try {
            UserRow row =
                    jdbcTemplate.queryForObject(
                            FIND_USER,
                            (rs, rowNum) ->
                                    new UserRow(
                                            rs.getLong("IdUsuarios"),
                                            rs.getString("Nombre"),
                                            rs.getString("Usuario"),
                                            rs.getString("Clave")),
                            usuario.trim());
            if (!passwordEncoder.matches(password, row.clave())) {
                return null;
            }
            return new AuthUserDto(row.idUsuarios(), row.nombre(), row.usuario(), tipoNorm);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private static final String COUNT_USUARIO =
            "SELECT COUNT(*) FROM usuarios WHERE LOWER(TRIM(Usuario)) = LOWER(TRIM(?))";

    /**
     * Crea un usuario con contraseña hasheada (bcrypt). El nombre de usuario debe ser único
     * (comparación sin distinguir mayúsculas).
     */
    public RegisterResult register(String nombre, String usuario, String password) {
        if (nombre == null || nombre.isBlank()) {
            return new RegisterResult.Error("El nombre es obligatorio");
        }
        if (usuario == null || usuario.isBlank()) {
            return new RegisterResult.Error("El usuario es obligatorio");
        }
        String u = usuario.trim();
        if (u.length() < 2 || u.length() > 64) {
            return new RegisterResult.Error("El usuario debe tener entre 2 y 64 caracteres");
        }
        if (!u.matches("^[a-zA-Z0-9._-]+$")) {
            return new RegisterResult.Error(
                    "El usuario solo puede contener letras, números, punto, guion y guion bajo");
        }
        if (password == null || password.length() < 6) {
            return new RegisterResult.Error("La contraseña debe tener al menos 6 caracteres");
        }
        if (nombre.trim().length() > 255) {
            return new RegisterResult.Error("El nombre es demasiado largo");
        }
        Integer count =
                jdbcTemplate.queryForObject(COUNT_USUARIO, Integer.class, u);
        if (count != null && count > 0) {
            return new RegisterResult.Error("Ese nombre de usuario ya está en uso");
        }
        String hash = passwordEncoder.encode(password);
        jdbcTemplate.update(
                "INSERT INTO usuarios (Nombre, Usuario, Clave) VALUES (?, ?, ?)",
                nombre.trim(),
                u,
                hash);
        return new RegisterResult.Ok();
    }

    private record UserRow(long idUsuarios, String nombre, String usuario, String clave) {}
}
```

## SecurityConfig: CORS y filtro JWT

Define CORS permisivo para desarrollo, desactiva CSRF (API stateless), permite sin autenticación login/registro/health y exige autenticación para el resto de `/api/**`. Añade `JwtAuthenticationFilter` antes del filtro de usuario/contraseña de Spring Security.

```java
package com.underconstruction.api.config;

import com.underconstruction.api.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                                        .permitAll()
                                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/health")
                                        .permitAll()
                                        .requestMatchers("/api/**")
                                        .authenticated())
                .exceptionHandling(
                        ex ->
                                ex.authenticationEntryPoint(
                                                (req, res, e) -> writeJson(
                                                        res,
                                                        HttpServletResponse.SC_UNAUTHORIZED,
                                                        Map.of("error", "Unauthorized")))
                                        .accessDeniedHandler(
                                                (req, res, e) -> writeJson(
                                                        res,
                                                        HttpServletResponse.SC_FORBIDDEN,
                                                        Map.of("error", "Forbidden"))))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private void writeJson(jakarta.servlet.http.HttpServletResponse res, int status, Map<String, String> body)
            throws java.io.IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        res.getWriter().write(objectMapper.writeValueAsString(body));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOriginPatterns(java.util.List.of("*"));
        c.setAllowedMethods(java.util.List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(java.util.List.of("*"));
        c.setExposedHeaders(java.util.List.of(HttpHeaders.AUTHORIZATION));
        c.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", c);
        return source;
    }
}
```

## JwtAuthenticationFilter

No filtra `OPTIONS`, ni `/api/auth/login`, `/api/auth/register`, `/api/health`, ni rutas fuera de `/api/`. Si hay cabecera `Bearer`, valida el token y rellena el `SecurityContext`.

```java
package com.underconstruction.api.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/health")
                || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            Claims claims = jwtService.parseClaims(token);
            String sub = claims.getSubject();
            if (sub != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                var auth =
                        new UsernamePasswordAuthenticationToken(
                                sub, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ignored) {
            // Invalid token — leave unauthenticated; Security will return 401
        }
        filterChain.doFilter(request, response);
    }
}
```

## JwtService: tokens JWT

Genera y parsea JWT con **JJWT**, usando la clave y caducidad de `JwtProperties`.

```java
package com.underconstruction.api.security;

import com.underconstruction.api.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtProperties props;
    private final SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(long idUsuarios, String usuario, String nombre, String tipo) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + props.expirationMs());
        return Jwts.builder()
                .subject(String.valueOf(idUsuarios))
                .claim("usuario", usuario)
                .claim("nombre", nombre)
                .claim("tipo", tipo)
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
```

Bean **BCrypt** (`PasswordEncoder`):

```java
package com.underconstruction.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class JwtConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

## Frontend React: componentes del login

Resumen de la parte cliente (carpeta `src/` del frontend Vite):

- `LoginGeneric.jsx`: `POST /api/auth/login` con `{ usuario, password, tipo: "generic" }`, luego `login(user, token)` del contexto.
- `RegisterModal.jsx`: `POST /api/auth/register`.
- `AuthProvider.jsx`: guarda usuario y JWT en estado y `sessionStorage`.
- `authFetch.js`: añade `Authorization: Bearer` a las peticiones autenticadas.
- `ProtectedRoute.jsx`: redirige al login si no hay sesión.
- Rutas en `App.jsx` con `react-router-dom`.

La **validación real** de credenciales y la emisión del token ocurren en Spring Boot, no en el navegador.

## Flujo completo

1. El usuario envía credenciales desde React a `POST /api/auth/login`.
2. `AuthService` comprueba usuario y bcrypt contra MariaDB.
3. `JwtService` devuelve un JWT; `AuthController` responde con `ok`, `token` y `user`.
4. El frontend guarda el token y navega a `/home`.
5. Las llamadas siguientes a `/api/**` llevan `Authorization: Bearer …`; `JwtAuthenticationFilter` autentica la petición y `SecurityConfig` autoriza el acceso.

---

*Guía pensada para exponer el proyecto: énfasis en código Spring Boot y flujo de seguridad JWT.*
