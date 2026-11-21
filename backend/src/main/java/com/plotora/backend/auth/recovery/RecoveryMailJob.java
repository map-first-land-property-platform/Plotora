package com.plotora.backend.auth.recovery;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/** JPA schema mapping; queue operations use atomic conditional SQL claims. */
@Entity
@Table(name = "recovery_mail_jobs")
class RecoveryMailJob {
    @Id UUID id;
    @Column(nullable = false, length = 30) String kind;
    @Column(nullable = false, columnDefinition = "text") String payload;
    @Column(name = "token_hash", length = 64) String tokenHash;
    @Column(nullable = false) int attempts;
    @Column(name = "created_at", nullable = false) OffsetDateTime createdAt;
    @Column(name = "expires_at", nullable = false) OffsetDateTime expiresAt;
    @Column(name = "next_attempt_at", nullable = false) OffsetDateTime nextAttemptAt;
    @Column(name = "lease_until", nullable = false) OffsetDateTime leaseUntil;
}
