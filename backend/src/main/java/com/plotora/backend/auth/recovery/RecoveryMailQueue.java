package com.plotora.backend.auth.recovery;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RecoveryMailQueue {
    public record Job(UUID id, String kind, String payload, String tokenHash, int attempts, OffsetDateTime expiresAt) {}
    private final JdbcTemplate jdbc;
    private final RecoveryPayloadCipher cipher;
    public RecoveryMailQueue(JdbcTemplate jdbc, RecoveryPayloadCipher cipher) { this.jdbc = jdbc; this.cipher = cipher; }

    public void enqueue(String kind, String payload) {
        OffsetDateTime now = OffsetDateTime.now();
        jdbc.update("INSERT INTO recovery_mail_jobs (id, kind, payload, attempts, created_at, expires_at, next_attempt_at, lease_until) VALUES (?, ?, ?, 0, ?, ?, ?, ?)",
            UUID.randomUUID(), kind, cipher.encrypt(payload), now, now.plusMinutes(kind.equals("RESET_REQUEST") ? 10 : 1440), now, now);
    }
    public List<UUID> dueIds() {
        OffsetDateTime now = OffsetDateTime.now();
        return jdbc.query("SELECT id FROM recovery_mail_jobs WHERE next_attempt_at <= ? AND lease_until <= ? AND expires_at > ? ORDER BY created_at FETCH FIRST 10 ROWS ONLY",
            (rs, row) -> rs.getObject(1, UUID.class), now, now, now);
    }
    public Job claim(UUID id) {
        OffsetDateTime now = OffsetDateTime.now();
        // Claim is atomic across processes. A crashed worker's lease expires.
        if (jdbc.update("UPDATE recovery_mail_jobs SET lease_until = ? WHERE id = ? AND lease_until <= ? AND expires_at > ?",
                now.plusMinutes(2), id, now, now) != 1) return null;
        return jdbc.queryForObject("SELECT * FROM recovery_mail_jobs WHERE id = ?", (rs, row) -> new Job(
            id, rs.getString("kind"), cipher.decrypt(rs.getString("payload")), rs.getString("token_hash"),
            rs.getInt("attempts"), rs.getObject("expires_at", OffsetDateTime.class)), id);
    }
    public void prepareLink(UUID id, String email, String token, OffsetDateTime expiresAt) {
        OffsetDateTime now = OffsetDateTime.now();
        jdbc.update("UPDATE recovery_mail_jobs SET kind = 'RESET_LINK', payload = ?, token_hash = ?, expires_at = ?, next_attempt_at = ?, lease_until = ? WHERE id = ?",
            cipher.encrypt(email + "\n" + token), com.plotora.backend.auth.TokenHasher.hash(token), expiresAt, now, now, id);
    }
    public void remove(UUID id) { jdbc.update("DELETE FROM recovery_mail_jobs WHERE id = ?", id); }
    public boolean retry(Job job) {
        if (job.attempts() >= 4 || !OffsetDateTime.now().isBefore(job.expiresAt())) { remove(job.id()); return false; }
        OffsetDateTime next = OffsetDateTime.now().plusSeconds(Math.min(300, 5L << job.attempts()));
        jdbc.update("UPDATE recovery_mail_jobs SET attempts = attempts + 1, next_attempt_at = ?, lease_until = ? WHERE id = ?", next, next, job.id());
        return true;
    }
    public void cleanup() {
        OffsetDateTime now = OffsetDateTime.now();
        jdbc.update("DELETE FROM recovery_mail_jobs WHERE expires_at <= ?", now);
        jdbc.update("DELETE FROM recovery_rate_limits WHERE expires_at <= ?", now);
    }
}
