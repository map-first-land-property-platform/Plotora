package com.plotora.backend.auth;

import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class AuthMailService {
    private final JavaMailSender mailSender;
    private final String from;
    private final String webBaseUrl;

    public AuthMailService(
        JavaMailSender mailSender,
        @Value("${app.mail.from:no-reply@plotora.local}") String from,
        @Value("${app.web.base-url:http://localhost:3000}") String webBaseUrl
    ) {
        this.mailSender = mailSender;
        this.from = from;
        URI base = URI.create(webBaseUrl);
        boolean local = "localhost".equals(base.getHost()) || "127.0.0.1".equals(base.getHost()) || "[::1]".equals(base.getHost());
        if (base.getHost() == null || base.getUserInfo() != null || base.getQuery() != null || base.getFragment() != null
            || !("https".equals(base.getScheme()) || local && "http".equals(base.getScheme()))) {
            throw new IllegalArgumentException("WEB_BASE_URL must be a trusted HTTPS URL (HTTP is allowed only on localhost)");
        }
        this.webBaseUrl = webBaseUrl.replaceAll("/$", "");
    }

    public void sendPasswordReset(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Reset your Plotora password");
        message.setText("Use this link within 30 minutes to reset your Plotora password:\n\n"
            // Fragments are not sent to the web server or recorded in ordinary access logs.
            + webBaseUrl + "/reset-password#token=" + token
            + "\n\nDo not share this link. If you did not request it, ignore this email."
            + "\nYour password will stay unchanged until you complete the reset.");
        mailSender.send(message);
    }

    public void sendPasswordChanged(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Your Plotora password was changed");
        message.setText("Your Plotora password has been changed and existing sign-in sessions have been invalidated.\n\n"
            + "If you made this change, no further action is needed.\n"
            + "If you did not make this change, use the Forgot password page immediately and secure your email account:\n"
            + webBaseUrl + "/forgot-password\n\nWe will never ask you to reply with your password or reset link.");
        mailSender.send(message);
    }
}
