package com.plotora.backend.auth.recovery;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

/** Authenticated encryption for short-lived mail payloads, not password hashing. */
@Component
public class RecoveryPayloadCipher {
    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public RecoveryPayloadCipher(@Value("${app.mail.queue-secret}") String secret) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("Mail queue secret must be at least 32 bytes");
        }
        try {
            Mac derivation = Mac.getInstance("HmacSHA256");
            derivation.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            key = new SecretKeySpec(derivation.doFinal("plotora/recovery-mail/v1".getBytes(StandardCharsets.UTF_8)), "AES");
        } catch (GeneralSecurityException e) { throw new IllegalStateException("Mail encryption unavailable", e); }
    }

    public String encrypt(String value) {
        try {
            byte[] nonce = new byte[12];
            random.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, nonce));
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(nonce.length + encrypted.length).put(nonce).put(encrypted).array());
        } catch (GeneralSecurityException e) { throw new IllegalStateException("Could not encrypt mail payload", e); }
    }

    public String decrypt(String value) {
        try {
            byte[] bytes = Base64.getDecoder().decode(value);
            if (bytes.length < 28) throw new IllegalArgumentException("Invalid encrypted payload");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, bytes, 0, 12));
            return new String(cipher.doFinal(bytes, 12, bytes.length - 12), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Could not decrypt mail payload");
        }
    }
}
