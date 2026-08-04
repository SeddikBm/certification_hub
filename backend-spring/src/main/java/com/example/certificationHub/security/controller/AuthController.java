package com.example.certificationHub.security.controller;

import com.example.certificationHub.entity.User;
import com.example.certificationHub.repository.UserRepository;
import com.example.certificationHub.security.dto.AuthResponse;
import com.example.certificationHub.security.dto.LoginRequest;
import com.example.certificationHub.security.dto.RefreshRequest;
import com.example.certificationHub.security.entity.RefreshToken;
import com.example.certificationHub.security.jwt.JwtService;
import com.example.certificationHub.security.repository.RefreshTokenRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtDecoder jwtDecoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${spring.security.jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            String role = user.getRole().name();

            String accessToken = jwtService.generateAccessToken(request.getEmail(), user.getId().toString(), role);
            String refreshTokenString = jwtService.generateRefreshToken(request.getEmail(), user.getId().toString());

            saveRefreshToken(user.getId(), refreshTokenString);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshTokenString)
                    .user(AuthResponse.UserInfo.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .role(role)
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .build())
                    .build();
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
        }
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        try {
            Jwt jwt = jwtDecoder.decode(request.getRefreshToken());

            if (!"REFRESH".equals(jwt.getClaimAsString("type"))) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide (pas un refresh token)");
            }

            UUID userId = UUID.fromString(jwt.getClaimAsString("user_id"));
            String email = jwt.getSubject();
            String tokenHash = hashToken(request.getRefreshToken());

            RefreshToken storedToken = refreshTokenRepository.findByUserIdAndTokenHash(userId, tokenHash)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                            "Refresh token révoqué ou introuvable"));

            // Récupération du rôle réel de l'utilisateur depuis la base
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));

            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Le compte utilisateur a été désactivé");
            }

            String actualRole = user.getRole().name();

            String newAccessToken = jwtService.generateAccessToken(email, userId.toString(), actualRole);

            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(request.getRefreshToken())
                    .build();

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalide ou expiré");
        }
    }

    @PostMapping("/logout")
    public void logout(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            UUID userId = UUID.fromString(jwt.getClaimAsString("user_id"));
            refreshTokenRepository.deleteByUserId(userId);
        }
    }

    private void saveRefreshToken(UUID userId, String tokenString) {
        Instant expiresAt = Instant.now().plusMillis(refreshTokenExpirationMs);

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .tokenHash(hashToken(tokenString))
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erreur de hachage", e);
        }
    }
}