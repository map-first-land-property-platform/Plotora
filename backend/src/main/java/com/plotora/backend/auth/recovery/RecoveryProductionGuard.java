package com.plotora.backend.auth.recovery;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Fail closed when production is explicitly enabled; localhost needs no external provider. */
@Component
class RecoveryProductionGuard {
    RecoveryProductionGuard(@Value("${app.recovery.production:false}") boolean production,
            @Value("${app.web.base-url}") String baseUrl,
            @Value("${app.cookie.secure}") boolean secureCookies,
            @Value("${spring.mail.properties.mail.smtp.auth:false}") boolean smtpAuth,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:false}") boolean tls,
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.mail.queue-secret}") String mailSecret) {
        if (!production) return;
        if (!baseUrl.startsWith("https://") || !secureCookies || !smtpAuth || !tls
            || jwtSecret.startsWith("dev-") || mailSecret.startsWith("dev-") || mailSecret.equals(jwtSecret)) {
            throw new IllegalStateException("Recovery production mode needs HTTPS, secure cookies, authenticated TLS SMTP and separate private JWT/mail secrets");
        }
    }
}
