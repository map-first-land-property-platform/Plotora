package com.plotora.backend.auth;

import com.plotora.backend.user.Role;
import com.plotora.backend.user.RoleRepository;
import com.plotora.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordResetTokenRepository resetTokens;

    @BeforeEach
    void prepareDatabase() {
        refreshTokens.deleteAll();
        resetTokens.deleteAll();
        users.deleteAll();
        if (roles.findByName("BUYER").isEmpty()) roles.save(new Role("BUYER"));
        if (roles.findByName("SELLER").isEmpty()) roles.save(new Role("SELLER"));
    }

    @Test
    void registrationValidatesInputAndPersistsBuyerAccount() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"A Buyer","email":"Buyer@Example.com","phone":"+94 77 123 4567","password":"StrongPass1","role":"BUYER"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("buyer@example.com"))
            .andExpect(jsonPath("$.roles[0]").value("BUYER"));

        mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Another Buyer","email":"buyer@example.com","phone":"+94 77 123 4567","password":"StrongPass1","role":"BUYER"}
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("An account with this email already exists."));
    }

    @Test
    void loginSetsHttpOnlyCookiesAndTheyAuthenticateMeEndpoint() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"A Buyer","email":"buyer@example.com","phone":"+94 77 123 4567","password":"StrongPass1","role":"BUYER"}
                    """))
            .andExpect(status().isOk());

        MvcResult result = mvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"buyer@example.com","password":"StrongPass1","rememberMe":true}
                    """))
            .andExpect(status().isOk())
            .andExpect(cookie().httpOnly("PLOTORA_ACCESS", true))
            .andExpect(cookie().httpOnly("PLOTORA_REFRESH", true))
            .andReturn();

        String access = result.getResponse().getCookie(AuthController.ACCESS_COOKIE).getValue();
        mvc.perform(get("/api/auth/me").cookie(result.getResponse().getCookie(AuthController.ACCESS_COOKIE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("buyer@example.com"));

        mvc.perform(post("/api/auth/logout").with(csrf())
                .cookie(result.getResponse().getCookie(AuthController.REFRESH_COOKIE)))
            .andExpect(status().isOk());

        // The access JWT remains valid only for its short 15-minute lifetime; logout revokes the refresh token.
        org.assertj.core.api.Assertions.assertThat(access).isNotBlank();
    }

    @Test
    void registrationReturnsFieldErrorsForInvalidPassword() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"A Buyer","email":"buyer@example.com","phone":"+94 77 123 4567","password":"weak","role":"BUYER"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.password").exists());
    }
}
