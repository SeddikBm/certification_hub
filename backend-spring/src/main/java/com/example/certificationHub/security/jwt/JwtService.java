package com.example.certificationHub.security.jwt;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtEncoder jwtEncoder;

    @Value("${spring.security.jwt.access-token-expiration}")
    private long accessTokenExpirationMs;

    @Value("${spring.security.jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    public String generateAccessToken(String email, String userId, String role) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("certification-hub")
                .issuedAt(now)
                .expiresAt(now.plusMillis(accessTokenExpirationMs))
                .subject(email)
                .claim("user_id", userId)
                .claim("role", role)
                .build();

        return encodeToken(claims);
    }

    public String generateRefreshToken(String email, String userId) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("certification-hub")
                .issuedAt(now)
                .expiresAt(now.plusMillis(refreshTokenExpirationMs))
                .subject(email)
                .claim("user_id", userId)
                .claim("type", "REFRESH")
                .build();

        return encodeToken(claims);
    }

    private String encodeToken(JwtClaimsSet claims) {
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
