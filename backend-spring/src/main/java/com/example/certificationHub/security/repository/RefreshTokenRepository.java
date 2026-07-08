package com.example.certificationHub.security.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.certificationHub.security.entity.RefreshToken;
import com.example.certificationHub.security.entity.RefreshTokenId;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, RefreshTokenId> {
    Optional<RefreshToken> findByUserIdAndTokenHash(UUID userId, String tokenHash);

    void deleteByUserId(UUID userId); // Pour le logout
}