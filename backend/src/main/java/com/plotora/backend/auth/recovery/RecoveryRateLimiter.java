package com.plotora.backend.auth.recovery;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.plotora.backend.auth.AuthException;
import com.plotora.backend.auth.TokenHasher;
import java.time.Duration;
import java.time.OffsetDateTime;

/** Shared, restart-safe fixed windows. Never trust unvalidated X-Forwarded-For. */
@Service
public class RecoveryRateLimiter {
    private final JdbcTemplate jdbc;
    public RecoveryRateLimiter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void checkRequestIp(String ip) { require("request-ip:" + ip, 10); }
    public boolean allowEmail(String email) {
        return consume("email-window:" + email, 3, Duration.ofMinutes(15))
            && consume("email-cooldown:" + email, 1, Duration.ofMinutes(1));
    }
    public void checkReset(String ip, String token) {
        require("reset-ip:" + ip, 20);
        require("reset-token:" + token, 10);
    }
    private void require(String key, int maximum) {
        if (!consume(key, maximum, Duration.ofMinutes(15))) {
            throw new AuthException(HttpStatus.TOO_MANY_REQUESTS, "Too many recovery attempts. Please wait 15 minutes and try again.");
        }
    }

    // Called before the password-reset transaction, so invalid attempts still count.
    public boolean consume(String key, int maximum, Duration window) {
        String hash = TokenHasher.hash(key);
        OffsetDateTime now = OffsetDateTime.now();
        if (increment(hash, maximum, now)) return true;
        if (jdbc.update("UPDATE recovery_rate_limits SET attempts = 1, expires_at = ? WHERE key_hash = ? AND expires_at <= ?",
                now.plus(window), hash, now) == 1) return true;
        try {
            jdbc.update("INSERT INTO recovery_rate_limits (key_hash, attempts, expires_at) VALUES (?, 1, ?)", hash, now.plus(window));
            return true;
        } catch (DuplicateKeyException occupied) {
            return increment(hash, maximum, now);
        }
    }
    private boolean increment(String hash, int maximum, OffsetDateTime now) {
        return jdbc.update("UPDATE recovery_rate_limits SET attempts = attempts + 1 WHERE key_hash = ? AND expires_at > ? AND attempts < ?",
            hash, now, maximum) == 1;
    }
}
