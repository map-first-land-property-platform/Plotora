package com.plotora.backend.auth;

import com.plotora.backend.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final Duration accessLifetime;

    public JwtService(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.access-minutes:15}") long accessMinutes
    ) {
        byte[] key = secret.getBytes(StandardCharsets.UTF_8);
        if (key.length < 32) throw new IllegalArgumentException("app.jwt.secret must be at least 32 UTF-8 bytes");
        this.signingKey = Keys.hmacShaKeyFor(key);
        this.accessLifetime = Duration.ofMinutes(accessMinutes);
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("roles", user.getRoles().stream().map(role -> role.getName()).toList())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(accessLifetime)))
            .signWith(signingKey)
            .compact();
    }

    public UUID validateAndGetUserId(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
            return UUID.fromString(claims.getSubject());
        } catch (JwtException | IllegalArgumentException invalid) {
            return null;
        }
    }

    public Duration getAccessLifetime() { return accessLifetime; }
}
