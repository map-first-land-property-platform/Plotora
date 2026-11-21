package com.plotora.backend.auth;

import com.plotora.backend.auth.recovery.*;
import com.plotora.backend.user.*;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.mockito.ArgumentCaptor;
import java.time.OffsetDateTime;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.*;
import java.util.regex.Pattern;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "management.health.mail.enabled=false")
@AutoConfigureMockMvc
class PasswordRecoveryIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired RefreshTokenRepository refresh;
    @Autowired PasswordResetTokenRepository tokens;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordRecoveryService recovery;
    @Autowired RecoveryMailQueue queue;
    @Autowired AuthMailService mail;
    @Autowired RecoveryRateLimiter limiter;
    @Autowired PasswordEncoder passwords;
    @MockitoBean JavaMailSender sender;
    RecoveryMailWorker worker;

    @BeforeEach void setup() {
        jdbc.update("DELETE FROM recovery_mail_jobs");
        jdbc.update("DELETE FROM recovery_rate_limits");
        refresh.deleteAll(); tokens.deleteAll(); users.deleteAll();
        reset(sender);
        if (roles.findByName("BUYER").isEmpty()) roles.save(new Role("BUYER"));
        worker = new RecoveryMailWorker(queue, recovery, mail);
    }

    @Test void requestsArePrivateQueuedEncryptedAndDoNotRequireAnExistingSession() throws Exception {
        register();
        MvcResult known = forgot("buyer@example.com");
        MvcResult unknown = forgot("unknown@example.com");
        assertThat(known.getResponse().getContentAsString()).isEqualTo(unknown.getResponse().getContentAsString());
        verifyNoInteractions(sender);
        assertThat(jdbc.queryForList("SELECT payload FROM recovery_mail_jobs", String.class))
            .allSatisfy(payload -> assertThat(payload).doesNotContain("@", "buyer", "unknown"));
        String token = deliverAndGetToken();
        assertThat(token).hasSize(43);
        assertThat(tokens.findByTokenHash(TokenHasher.hash(token))).isPresent();
        assertThat(jdbc.queryForObject("SELECT token_hash FROM password_reset_tokens", String.class)).isNotEqualTo(token);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recovery_mail_jobs", Integer.class)).isZero();
    }

    @Test void resetChangesPasswordOnceRevokesAllSessionsAndNotifiesUser() throws Exception {
        register();
        MvcResult oldLogin = login("OldPassword1", 200);
        forgot("buyer@example.com");
        String token = deliverAndGetToken();
        mvc.perform(get("/api/auth/me").cookie(oldLogin.getResponse().getCookie(AuthController.ACCESS_COOKIE))).andExpect(status().isOk());
        submit(token, "NewPassword2", 200);
        assertThat(tokens.findByTokenHash(TokenHasher.hash(token)).orElseThrow().isUsed()).isTrue();
        assertThat(users.findByEmailIgnoreCase("buyer@example.com").orElseThrow().getAuthVersion()).isEqualTo(1);
        mvc.perform(get("/api/auth/me").cookie(oldLogin.getResponse().getCookie(AuthController.ACCESS_COOKIE))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").with(csrf()).cookie(oldLogin.getResponse().getCookie(AuthController.REFRESH_COOKIE)))
            .andExpect(status().isUnauthorized());
        submit(token, "AnotherPassword3", 400);
        login("OldPassword1", 401);
        login("NewPassword2", 200);
        worker.deliver();
        ArgumentCaptor<SimpleMailMessage> messages = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender, times(2)).send(messages.capture());
        assertThat(messages.getAllValues().get(1).getSubject()).isEqualTo("Your Plotora password was changed");
        assertThat(messages.getAllValues().get(1).getText()).doesNotContain("NewPassword2", token);
    }

    @Test void expiredTamperedWeakAndSamePasswordCannotChangeAnAccount() throws Exception {
        register(); forgot("buyer@example.com"); String token = deliverAndGetToken();
        submit(token, "weak", 400);
        submit(token, "OldPassword1", 409);
        submit(token, "Ab1" + "界".repeat(24), 400);
        submit(TokenHasher.newToken(), "NewPassword2", 400);
        jdbc.update("UPDATE password_reset_tokens SET expires_at = ?", OffsetDateTime.now().minusMinutes(1));
        submit(token, "NewPassword2", 400);
        login("OldPassword1", 200);
    }

    @Test void simultaneousRequestsCanConsumeARecoveryTokenOnlyOnce() throws Exception {
        register(); forgot("buyer@example.com"); String token = deliverAndGetToken();
        try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
            CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
            Callable<Boolean> attempt = () -> {
                ready.countDown(); start.await();
                try { recovery.resetPassword(new AuthDtos.ResetPasswordRequest(token, "NewPassword2")); return true; }
                catch (AuthException invalid) { return false; }
            };
            Future<Boolean> first = pool.submit(attempt), second = pool.submit(attempt);
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue(); start.countDown();
            assertThat(List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(true, false);
        }
        assertThat(users.findByEmailIgnoreCase("buyer@example.com").orElseThrow().getAuthVersion()).isEqualTo(1);
    }

    @Test void cooldownIsSilentForEveryEmailAndIpLimitsAreEnforced() throws Exception {
        for (int i = 0; i < 3; i++) forgot("unknown@example.com");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recovery_mail_jobs", Integer.class)).isEqualTo(1);
        for (int i = 3; i < 10; i++) forgot("unknown" + i + "@example.com");
        mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"another@example.com\"}")).andExpect(status().isTooManyRequests());
        String repeated = TokenHasher.newToken();
        for (int i = 0; i < 10; i++) submit(repeated, "NewPassword2", 400);
        submit(repeated, "NewPassword2", 429);
    }

    @Test void smtpFailureKeepsAnEncryptedRetryAndExpiredJobsAreRemoved() throws Exception {
        register(); forgot("buyer@example.com"); worker.deliver();
        doThrow(new MailSendException("Simulated SMTP outage")).when(sender).send(any(SimpleMailMessage.class));
        worker.deliver();
        assertThat(jdbc.queryForObject("SELECT attempts FROM recovery_mail_jobs", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT payload FROM recovery_mail_jobs", String.class)).doesNotContain("buyer@example.com");
        jdbc.update("UPDATE recovery_mail_jobs SET lease_until = ?, next_attempt_at = ?", OffsetDateTime.now().minusMinutes(3), OffsetDateTime.now().minusMinutes(3));
        reset(sender); worker.deliver();
        verify(sender).send(any(SimpleMailMessage.class));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recovery_mail_jobs", Integer.class)).isZero();
        queue.enqueue("RESET_REQUEST", "expired@example.com");
        jdbc.update("UPDATE recovery_mail_jobs SET expires_at = ?", OffsetDateTime.now().minusMinutes(1));
        queue.cleanup();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recovery_mail_jobs", Integer.class)).isZero();
    }

    @Test void recoveryRequiresCsrfAndRejectsMalformedTokens() throws Exception {
        mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"buyer@example.com\"}"))
            .andExpect(status().isForbidden());
        submit("invalid", "NewPassword2", 400);
    }

    @Test void aLaterResetRequestInvalidatesThePreviousLink() throws Exception {
        register(); forgot("buyer@example.com"); String first = deliverAndGetToken();
        jdbc.update("DELETE FROM recovery_rate_limits");
        reset(sender); forgot("buyer@example.com"); String second = deliverAndGetToken();
        submit(first, "NewPassword2", 400); submit(second, "NewPassword2", 200);
    }

    private void register() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"fullName\":\"Recovery Test\",\"email\":\"buyer@example.com\",\"phone\":\"+94 77 123 4567\",\"password\":\"OldPassword1\",\"role\":\"BUYER\"}"))
            .andExpect(status().isOk());
    }
    private MvcResult forgot(String email) throws Exception {
        return mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\"}")).andExpect(status().isOk()).andReturn();
    }
    private MvcResult login(String password, int expected) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"buyer@example.com\",\"password\":\"" + password + "\",\"rememberMe\":true}"))
            .andExpect(status().is(expected)).andReturn();
    }
    private void submit(String token, String password, int expected) throws Exception {
        mvc.perform(post("/api/auth/reset-password").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\":\"" + token + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().is(expected));
    }
    private String deliverAndGetToken() {
        // Real delivery polls on successive ticks; persisted timestamps have microsecond precision.
        await().atMost(Duration.ofSeconds(5)).pollInterval(Duration.ofMillis(20)).untilAsserted(() -> {
            worker.deliver();
            verify(sender).send(any(SimpleMailMessage.class));
        });
        ArgumentCaptor<SimpleMailMessage> message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(message.capture());
        var matcher = Pattern.compile("#token=([A-Za-z0-9_-]{43})").matcher(message.getValue().getText());
        assertThat(matcher.find()).isTrue(); return matcher.group(1);
    }
}
