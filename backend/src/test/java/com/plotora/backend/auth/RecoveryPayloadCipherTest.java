package com.plotora.backend.auth;

import com.plotora.backend.auth.recovery.RecoveryPayloadCipher;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class RecoveryPayloadCipherTest {
    @Test void payloadEncryptionUsesRandomNoncesAndDetectsTampering() {
        var cipher = new RecoveryPayloadCipher("test-private-mail-secret-at-least-32-bytes");
        String value = "buyer@example.com\n" + TokenHasher.newToken();
        String first = cipher.encrypt(value), second = cipher.encrypt(value);
        assertThat(first).isNotEqualTo(second).doesNotContain(value);
        assertThat(cipher.decrypt(first)).isEqualTo(value);
        char replacement = first.charAt(20) == 'A' ? 'B' : 'A';
        assertThatThrownBy(() -> cipher.decrypt(first.substring(0, 20) + replacement + first.substring(21)))
            .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new RecoveryPayloadCipher("short")).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void resetUrlsRejectUntrustedHttpHosts() {
        var sender = org.mockito.Mockito.mock(org.springframework.mail.javamail.JavaMailSender.class);
        assertThatThrownBy(() -> new AuthMailService(sender, "no-reply@example.test", "http://attacker.example"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new AuthMailService(sender, "no-reply@example.test", "https://user:pass@example.com"))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
