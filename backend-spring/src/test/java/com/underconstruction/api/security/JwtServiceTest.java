package com.underconstruction.api.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.underconstruction.api.config.JwtProperties;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void generatesAndParsesToken() {
        JwtProperties props =
                new JwtProperties(
                        "test-secret-key-at-least-256-bits-long-for-hmac-sha-256-algorithm-required",
                        3600_000);
        JwtService jwt = new JwtService(props);
        String token = jwt.generateToken(1L, "demo", "Demo User", "generic");
        Claims claims = jwt.parseClaims(token);
        assertThat(claims.getSubject()).isEqualTo("1");
        assertThat(claims.get("usuario", String.class)).isEqualTo("demo");
        assertThat(claims.get("nombre", String.class)).isEqualTo("Demo User");
        assertThat(claims.get("tipo", String.class)).isEqualTo("generic");
    }
}
