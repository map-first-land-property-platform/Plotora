package com.plotora.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    List<RefreshToken> findAllByUser_IdAndRevokedAtIsNull(UUID userId);
    @Query("select r.user.id from RefreshToken r where r.tokenHash = :hash")
    Optional<UUID> findUserIdByTokenHash(@Param("hash") String hash);
}
