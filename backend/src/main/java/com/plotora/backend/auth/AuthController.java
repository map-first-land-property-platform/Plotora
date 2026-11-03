package com.plotora.backend.auth;

import com.plotora.backend.auth.AuthDtos.CsrfResponse;
import com.plotora.backend.auth.AuthDtos.ForgotPasswordRequest;
import com.plotora.backend.auth.AuthDtos.LoginRequest;
import com.plotora.backend.auth.AuthDtos.MessageResponse;
import com.plotora.backend.auth.AuthDtos.RegisterRequest;
import com.plotora.backend.auth.AuthDtos.ResetPasswordRequest;
import com.plotora.backend.auth.AuthDtos.UserResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    public static final String ACCESS_COOKIE = "PLOTORA_ACCESS";
    public static final String REFRESH_COOKIE = "PLOTORA_REFRESH";
    private final AuthService authService;
    private final Duration accessLifetime;
    private final boolean secureCookies;

    public AuthController(AuthService authService, JwtService jwtService,
                          @Value("${app.cookie.secure:false}") boolean secureCookies) {
        this.authService = authService;
        this.accessLifetime = jwtService.getAccessLifetime();
        this.secureCookies = secureCookies;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken csrfToken) {
        return new CsrfResponse(csrfToken.getToken());
    }

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthService.Session session = authService.login(request);
        setSessionCookies(response, session);
        return session.user();
    }

    @PostMapping("/refresh")
    public UserResponse refresh(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
                                HttpServletResponse response) {
        AuthService.Session session = authService.refresh(refreshToken);
        setSessionCookies(response, session);
        return session.user();
    }

    @PostMapping("/logout")
    public MessageResponse logout(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
                                  HttpServletResponse response) {
        authService.logout(refreshToken);
        clearSessionCookies(response);
        return new MessageResponse("Signed out successfully.");
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UUID userId) {
        return authService.currentUser(userId);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return new MessageResponse("If an account exists for this email, a password reset link will be sent.");
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletResponse response) {
        authService.resetPassword(request);
        clearSessionCookies(response);
        return new MessageResponse("Your password has been reset. Please sign in.");
    }

    private void setSessionCookies(HttpServletResponse response, AuthService.Session session) {
        ResponseCookie access = ResponseCookie.from(ACCESS_COOKIE, session.accessToken())
            .httpOnly(true).secure(secureCookies).sameSite("Strict").path("/")
            .maxAge(accessLifetime).build();
        ResponseCookie.ResponseCookieBuilder refreshBuilder = ResponseCookie.from(REFRESH_COOKIE, session.refreshToken())
            .httpOnly(true).secure(secureCookies).sameSite("Strict").path("/");
        if (session.rememberMe()) refreshBuilder.maxAge(session.refreshLifetime());
        response.addHeader(HttpHeaders.SET_COOKIE, access.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshBuilder.build().toString());
    }

    private void clearSessionCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie(ACCESS_COOKIE));
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie(REFRESH_COOKIE));
    }

    private String expiredCookie(String name) {
        return ResponseCookie.from(name, "").httpOnly(true).secure(secureCookies)
            .sameSite("Strict").path("/").maxAge(Duration.ZERO).build().toString();
    }
}
