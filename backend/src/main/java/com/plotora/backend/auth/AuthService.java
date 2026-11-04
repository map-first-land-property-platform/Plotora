package com.plotora.backend.auth;

import com.plotora.backend.user.Role;
import com.plotora.backend.user.RoleRepository;
import com.plotora.backend.user.User;
import com.plotora.backend.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.plotora.backend.auth.AuthDtos.*;

@Service
public class AuthService {
    public record Session(String accessToken, String refreshToken, Duration refreshLifetime, boolean rememberMe, UserResponse user) {}

    private final UserRepository users;
    private final RoleRepository roles;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthMailService mailService;
    private final Duration refreshLifetime;

    public AuthService(
        UserRepository users,
        RoleRepository roles,
        RefreshTokenRepository refreshTokens,
        PasswordResetTokenRepository resetTokens,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AuthMailService mailService,
        @Value("${app.jwt.refresh-days:7}") long refreshDays
    ) {
        this.users = users;
        this.roles = roles;
        this.refreshTokens = refreshTokens;
        this.resetTokens = resetTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.refreshLifetime = Duration.ofDays(refreshDays);
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        Role role = roles.findByName(request.role())
            .orElseThrow(() -> new IllegalStateException("Required role is missing from the database: " + request.role()));
        User user = new User(request.fullName().trim(), email, request.phone().trim(), passwordEncoder.encode(request.password()));
        user.getRoles().add(role);
        try {
            return toResponse(users.saveAndFlush(user));
        } catch (DataIntegrityViolationException duplicateRace) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
    }

    @Transactional
    public Session login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(normalizeEmail(request.email()))
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!"ACTIVE".equals(user.getStatus()) || user.getPasswordHash() == null
            || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        Duration lifetime = request.rememberMe() ? refreshLifetime : Duration.ofHours(12);
        return createSession(user, request.rememberMe(), lifetime);
    }

    @Transactional
    public Session refresh(String presentedToken) {
        if (presentedToken == null || presentedToken.isBlank()) throw invalidRefresh();
        RefreshToken stored = refreshTokens.findByTokenHash(TokenHasher.hash(presentedToken)).orElseThrow(AuthService::invalidRefresh);
        if (stored.isRevoked() || stored.isExpired() || !"ACTIVE".equals(stored.getUser().getStatus())) throw invalidRefresh();
        User user = stored.getUser();
        stored.revoke();
        Duration remaining = Duration.between(OffsetDateTime.now(), stored.getExpiresAt());
        boolean remembered = remaining.compareTo(Duration.ofHours(12)) > 0;
        return createSession(user, remembered, remembered ? refreshLifetime : Duration.ofHours(12));
    }

    @Transactional
    public void logout(String presentedToken) {
        if (presentedToken == null || presentedToken.isBlank()) return;
        refreshTokens.findByTokenHash(TokenHasher.hash(presentedToken)).ifPresent(RefreshToken::revoke);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(UUID userId) {
        if (userId == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Please sign in to continue.");
        }
        User user = users.findById(userId).filter(u -> "ACTIVE".equals(u.getStatus()))
            .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "Your session is no longer valid."));
        return toResponse(user);
    }

    @Transactional
    public void requestPasswordReset(String requestedEmail) {
        Optional<User> candidate = users.findByEmailIgnoreCase(normalizeEmail(requestedEmail))
            .filter(user -> "ACTIVE".equals(user.getStatus()));
        if (candidate.isEmpty()) return;

        User user = candidate.get();
        resetTokens.findAllByUser_IdAndUsedAtIsNull(user.getId()).forEach(PasswordResetToken::markUsed);
        String rawToken = TokenHasher.newToken();
        PasswordResetToken reset = new PasswordResetToken(user, TokenHasher.hash(rawToken), OffsetDateTime.now().plusMinutes(30));
        resetTokens.save(reset);
        if (!mailService.trySendPasswordReset(user.getEmail(), rawToken)) reset.markUsed();
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken reset = resetTokens.findByTokenHash(TokenHasher.hash(request.token()))
            .orElseThrow(AuthService::invalidReset);
        if (reset.isUsed() || reset.isExpired()) throw invalidReset();
        User user = reset.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        reset.markUsed();
        refreshTokens.findAllByUser_IdAndRevokedAtIsNull(user.getId()).forEach(RefreshToken::revoke);
    }

    private Session createSession(User user, boolean rememberMe, Duration lifetime) {
        String rawRefresh = TokenHasher.newToken();
        refreshTokens.save(new RefreshToken(user, TokenHasher.hash(rawRefresh), OffsetDateTime.now().plus(lifetime)));
        return new Session(jwtService.createAccessToken(user), rawRefresh, lifetime, rememberMe, toResponse(user));
    }

    private static UserResponse toResponse(User user) {
        List<String> roleNames = user.getRoles().stream().map(Role::getName).sorted(Comparator.naturalOrder()).toList();
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), roleNames);
    }

    private static String normalizeEmail(String email) { return email.trim().toLowerCase(java.util.Locale.ROOT); }
    private static AuthException invalidRefresh() { return new AuthException(HttpStatus.UNAUTHORIZED, "Your session has expired. Please sign in again."); }
    private static AuthException invalidReset() { return new AuthException(HttpStatus.BAD_REQUEST, "This password reset link is invalid or has expired."); }
}
