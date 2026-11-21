-- Existing migration files are immutable. Existing sessions begin at version 0.
ALTER TABLE users ADD COLUMN auth_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE refresh_tokens ADD COLUMN auth_version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE recovery_rate_limits (
    key_hash VARCHAR(64) PRIMARY KEY,
    attempts INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_recovery_rate_expiry ON recovery_rate_limits (expires_at);

-- Payloads contain personal data / reset links and are encrypted with AES-GCM.
-- Successful/abandoned jobs are deleted rather than retaining reset links.
CREATE TABLE recovery_mail_jobs (
    id UUID PRIMARY KEY,
    kind VARCHAR(30) NOT NULL,
    payload TEXT NOT NULL,
    token_hash VARCHAR(64),
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    next_attempt_at TIMESTAMPTZ NOT NULL,
    lease_until TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_recovery_jobs_due ON recovery_mail_jobs (next_attempt_at, lease_until);
