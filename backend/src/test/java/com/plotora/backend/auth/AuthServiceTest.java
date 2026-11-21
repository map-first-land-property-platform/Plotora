package com.plotora.backend.auth;

import com.plotora.backend.user.Role;
import com.plotora.backend.user.RoleRepository;
import com.plotora.backend.user.User;
import com.plotora.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.plotora.backend.auth.AuthDtos.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock RefreshTokenRepository refreshTokens;

    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        jwtService = new JwtService("unit-test-secret-that-is-at-least-32-bytes-long", 15);
        authService = new AuthService(users, roles, refreshTokens, passwordEncoder, jwtService, 7);
    }

    @Test
    void registerNormalizesEmailHashesPasswordAndAssignsSelectedRole() {
        Role buyer = new Role("BUYER");
        when(users.existsByEmailIgnoreCase("buyer@example.com")).thenReturn(false);
        when(roles.findByName("BUYER")).thenReturn(Optional.of(buyer));
        when(users.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.register(new RegisterRequest(
            "  A Buyer  ", " Buyer@Example.com ", "+94 77 123 4567", "StrongPass1", "BUYER"));

        assertThat(response.fullName()).isEqualTo("A Buyer");
        assertThat(response.email()).isEqualTo("buyer@example.com");
        assertThat(response.roles()).containsExactly("BUYER");
        verify(users).saveAndFlush(argThat(user -> passwordEncoder.matches("StrongPass1", user.getPasswordHash())));
    }

    @Test
    void registerRejectsAnExistingEmail() {
        when(users.existsByEmailIgnoreCase("buyer@example.com")).thenReturn(true);

        AuthException error = assertThrows(AuthException.class, () -> authService.register(new RegisterRequest(
            "A Buyer", "buyer@example.com", "+94 77 123 4567", "StrongPass1", "BUYER")));

        assertThat(error.getStatus()).isEqualTo(HttpStatus.CONFLICT);
        verify(users, never()).saveAndFlush(any());
    }

    @Test
    void loginIssuesSignedAccessAndHashedRefreshTokens() {
        User user = userWithPassword("CorrectPass1");
        when(users.findForUpdateByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(refreshTokens.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthService.Session session = authService.login(new LoginRequest("BUYER@example.com", "CorrectPass1", true));

        assertThat(jwtService.validateAndGetUserId(session.accessToken())).isEqualTo((UUID) ReflectionTestUtils.getField(user, "id"));
        assertThat(session.rememberMe()).isTrue();
        verify(refreshTokens).save(argThat(token -> token.getUser() == user
            && token.getExpiresAt().isAfter(OffsetDateTime.now().plusDays(6))));
        assertThat(session.refreshToken()).isNotEqualTo(TokenHasher.hash(session.refreshToken()));
    }

    @Test
    void loginDoesNotRevealWhetherEmailOrPasswordWasWrong() {
        when(users.findForUpdateByEmail("buyer@example.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class,
            () -> authService.login(new LoginRequest("buyer@example.com", "wrong", false)));
    }

    @Test
    void refreshRotatesTheTokenAndRevokesThePresentedToken() {
        User user = userWithPassword("CorrectPass1");
        String raw = TokenHasher.newToken();
        RefreshToken stored = new RefreshToken(user, TokenHasher.hash(raw), OffsetDateTime.now().plusDays(7));
        when(refreshTokens.findUserIdByTokenHash(TokenHasher.hash(raw))).thenReturn(Optional.of(user.getId()));
        when(users.findForUpdateById(user.getId())).thenReturn(Optional.of(user));
        when(refreshTokens.findByTokenHash(TokenHasher.hash(raw))).thenReturn(Optional.of(stored));
        when(refreshTokens.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthService.Session rotated = authService.refresh(raw);

        assertThat(stored.isRevoked()).isTrue();
        assertThat(rotated.refreshToken()).isNotEqualTo(raw);
        assertThat(jwtService.validateAndGetUserId(rotated.accessToken())).isNotNull();
    }

    private User userWithPassword(String rawPassword) {
        User user = new User("A Buyer", "buyer@example.com", "+94 77 123 4567", passwordEncoder.encode(rawPassword));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.getRoles().add(new Role("BUYER"));
        return user;
    }
}
