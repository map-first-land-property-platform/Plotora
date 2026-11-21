package com.plotora.backend.auth.recovery;

import com.plotora.backend.auth.*;
import com.plotora.backend.user.User;
import com.plotora.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;
import java.nio.charset.StandardCharsets;

@Service
public class PasswordRecoveryService {
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwords;
    private final RecoveryMailQueue queue;
    private final RecoveryRateLimiter limiter;

    public PasswordRecoveryService(UserRepository users, PasswordResetTokenRepository tokens, RefreshTokenRepository refreshTokens,
            PasswordEncoder passwords, RecoveryMailQueue queue, RecoveryRateLimiter limiter) {
        this.users = users; this.tokens = tokens; this.refreshTokens = refreshTokens;
        this.passwords = passwords; this.queue = queue; this.limiter = limiter;
    }

    public void requestReset(String rawEmail, String ip) {
        limiter.checkRequestIp(ip);
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        // No account lookup or SMTP operation on the public request path.
        // Email throttling is silent for existing AND nonexistent addresses.
        if (limiter.allowEmail(email)) queue.enqueue("RESET_REQUEST", email);
    }

    @Transactional
    public void prepareResetMail(RecoveryMailQueue.Job job) {
        User user = users.findForUpdateByEmail(job.payload()).filter(this::eligible).orElse(null);
        if (user == null) { queue.remove(job.id()); return; }
        tokens.findAllByUser_IdAndUsedAtIsNull(user.getId()).forEach(PasswordResetToken::markUsed);
        String raw = TokenHasher.newToken();
        OffsetDateTime expires = OffsetDateTime.now().plusMinutes(30);
        tokens.save(new PasswordResetToken(user, TokenHasher.hash(raw), expires));
        // This transaction commits the token BEFORE the worker can send the link.
        queue.prepareLink(job.id(), user.getEmail(), raw, expires);
    }

    @Transactional(readOnly = true)
    public boolean canSendLink(String hash) {
        return tokens.findByTokenHash(hash).filter(t -> !t.isUsed() && !t.isExpired()
            && eligible(t.getUser())).isPresent();
    }

    @Transactional
    public void resetPassword(AuthDtos.ResetPasswordRequest request) {
        String hash = TokenHasher.hash(request.token());
        UUID userId = tokens.findUserIdByTokenHash(hash).orElseThrow(PasswordRecoveryService::invalidLink);
        // All reset issuance, consumption, login and refresh serialize on this account.
        User user = users.findForUpdateById(userId).filter(this::eligible)
            .orElseThrow(PasswordRecoveryService::invalidLink);
        PasswordResetToken token = tokens.findByTokenHash(hash).orElseThrow(PasswordRecoveryService::invalidLink);
        if (token.isUsed() || token.isExpired()) throw invalidLink();
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Password must fit within 72 UTF-8 bytes. Use a shorter password.");
        }
        if (passwords.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException(HttpStatus.CONFLICT, "Choose a password different from your current password.");
        }
        user.setPasswordHash(passwords.encode(request.password()));
        user.invalidateSessions();
        tokens.findAllByUser_IdAndUsedAtIsNull(userId).forEach(PasswordResetToken::markUsed);
        token.markUsed();
        refreshTokens.findAllByUser_IdAndRevokedAtIsNull(userId).forEach(RefreshToken::revoke);
        queue.enqueue("PASSWORD_CHANGED", user.getEmail());
    }

    @Transactional
    public void cleanup() { tokens.deleteExpiredBefore(OffsetDateTime.now().minusDays(1)); }

    private static AuthException invalidLink() {
        return new AuthException(HttpStatus.BAD_REQUEST, "This password reset link is invalid or has expired. Request a new link.");
    }

    private boolean eligible(User user) {
        // Email-only recovery must not bypass a future MFA factor or replace social-only credentials.
        return "ACTIVE".equals(user.getStatus()) && user.getPasswordHash() != null && !user.isTwoFactorEnabled();
    }
}
