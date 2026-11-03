package com.plotora.backend.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokenHasherTest {
    @Test
    void createsHighEntropyUrlSafeTokensAndStableHashes() {
        String first = TokenHasher.newToken();
        String second = TokenHasher.newToken();

        assertThat(first).matches("[A-Za-z0-9_-]{43}").isNotEqualTo(second);
        assertThat(TokenHasher.hash(first)).hasSize(64).isEqualTo(TokenHasher.hash(first));
        assertThat(TokenHasher.hash(first)).isNotEqualTo(first);
    }
}
