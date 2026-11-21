package com.plotora.backend.auth.recovery;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "recovery_rate_limits")
class RecoveryRateLimit {
    @Id @Column(name = "key_hash", length = 64) String keyHash;
    @Column(nullable = false) int attempts;
    @Column(name = "expires_at", nullable = false) OffsetDateTime expiresAt;
}
