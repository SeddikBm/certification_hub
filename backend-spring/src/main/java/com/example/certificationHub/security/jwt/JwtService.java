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
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtEncoder jwtEncoder;

    @Value("${spring.security.jwt.access-token-expiration:15}")
    private long accessTokenValidityMinutes;

    @Value("${spring.security.jwt.refresh-token-expiration:7}")
    private long refreshTokenValidityDays;

    public String generateAccessToken(String email, String userId, String role) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("certification-hub")
                .issuedAt(now)
                .expiresAt(now.plus(accessTokenValidityMinutes, ChronoUnit.MINUTES))
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
                .expiresAt(now.plus(refreshTokenValidityDays, ChronoUnit.DAYS))
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
