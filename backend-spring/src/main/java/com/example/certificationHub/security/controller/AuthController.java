package com.example.certificationHub.security.controller;

import com.example.certificationHub.security.dto.AuthResponse;
import com.example.certificationHub.security.dto.LoginRequest;
import com.example.certificationHub.security.dto.RefreshRequest;
import com.example.certificationHub.security.entity.RefreshToken;
import com.example.certificationHub.security.jwt.JwtService;
import com.example.certificationHub.security.repository.RefreshTokenRepository;
// Faux import à remplacer par ta vraie entité User et ton UserRepository
// import com.example.certificationHub.entity.User; 
// import com.example.certificationHub.repository.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        try {
            // 1. Vérifie email/password (Erreur 401 automatique si invalide)
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );

            // 2. Récupération du User (Simulation - à remplacer par ton vrai appel DB)
            // User user = userRepository.findByEmail(request.email()).orElseThrow();
            UUID userId = UUID.randomUUID(); // Remplace par user.getId()
            String role = "COLLABORATOR";    // Remplace par user.getRole().name()
            
            // 3. Génération des tokens
            String accessToken = jwtService.generateAccessToken(request.email(), userId.toString(), role);
            String refreshTokenString = jwtService.generateRefreshToken(request.email(), userId.toString());

            // 4. Hachage et Sauvegarde du Refresh Token en BDD
            saveRefreshToken(userId, refreshTokenString, /* expiration Instant ici */);

            // 5. Retour au format attendu
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshTokenString)
                    .user(AuthResponse.UserInfo.builder()
                            .id(userId)
                            .email(request.email())
                            .role(role)
                            .firstName("Simulation")
                            .lastName("Utilisateur")
                            .build())
                    .build();

        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants incorrects");
        }
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        try {
            // 1. Décodage du token (Vérifie automatiquement la signature et l'expiration)
            Jwt jwt = jwtDecoder.decode(request.getRefreshToken());

            // 2. Vérification du type
            if (!"REFRESH".equals(jwt.getClaimAsString("type"))) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide (pas un refresh token)");
            }

            UUID userId = UUID.fromString(jwt.getClaimAsString("user_id"));
            String email = jwt.getSubject();
            String tokenHash = hashToken(request.getRefreshToken());

            // 3. Vérification de l'existence en BDD
            RefreshToken storedToken = refreshTokenRepository.findByUserIdAndTokenHash(userId, tokenHash)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                            "Refresh token révoqué ou introuvable"));

            // 4. Génération d'un NOUVEAU Access Token (On garde le même rôle en récupérant
            // depuis la DB si besoin)
            String newAccessToken = jwtService.generateAccessToken(email, userId.toString(), "COLLABORATOR");

            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(request.getRefreshToken()) // On peut renvoyer le même ou en générer un nouveau
                                                             // (rotation)
                    .build();

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalide ou expiré");
        }
    }

    @PostMapping("/logout")
    public void logout(Authentication authentication) {
        // La route est protégée, donc authentication contient l'utilisateur connecté
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            UUID userId = UUID.fromString(jwt.getClaimAsString("user_id"));
            // Suppression en BDD : invalidation de tous les refresh tokens de cet
            // utilisateur
            refreshTokenRepository.deleteByUserId(userId);
        }
    }

    // --- Utilitaire de hachage SHA-256 ---
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erreur de hachage", e);
        }
    }

    private void saveRefreshToken(UUID userId, String tokenString, /* pass expiration date */) {
         // Implémentation de la sauvegarde via refreshTokenRepository
         // refreshTokenRepository.save(new RefreshToken(userId, hashToken(tokenString), expiresAt, null));
    }
}