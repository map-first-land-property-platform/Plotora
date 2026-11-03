package com.plotora.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Pattern(regexp = "^\\+?[0-9 ]{9,20}$", message = "Enter a valid mobile number") String phone,
        @NotBlank @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,100}$", message = "Use 8+ characters with upper case, lower case and a number") String password,
        @NotBlank @Pattern(regexp = "BUYER|SELLER", message = "Choose Buyer or Seller") String role
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        boolean rememberMe
    ) {}

    public record ForgotPasswordRequest(@NotBlank @Email String email) {}

    public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,100}$", message = "Use 8+ characters with upper case, lower case and a number") String password
    ) {}

    public record UserResponse(UUID id, String fullName, String email, List<String> roles) {}
    public record MessageResponse(String message) {}
    public record CsrfResponse(String token) {}
}
