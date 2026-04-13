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
