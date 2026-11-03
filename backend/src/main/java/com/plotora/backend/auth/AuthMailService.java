package com.plotora.backend.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
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
        this.webBaseUrl = webBaseUrl.replaceAll("/$", "");
    }

    public void sendPasswordReset(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Reset your Plotora password");
        message.setText("Use this link within 30 minutes to reset your Plotora password:\n\n"
            + webBaseUrl + "/reset-password?token=" + token
            + "\n\nIf you did not request this, you can ignore this message.");
        mailSender.send(message);
    }

    public boolean trySendPasswordReset(String email, String token) {
        try {
            sendPasswordReset(email, token);
            return true;
        } catch (MailException failure) {
            return false;
        }
    }
}
