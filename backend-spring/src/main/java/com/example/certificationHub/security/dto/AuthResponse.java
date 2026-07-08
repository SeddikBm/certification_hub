package com.example.certificationHub.security.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserInfo user; // "infos utilisateur" demandées dans le tableau

    @Data
    @Builder
    public static class UserInfo {
        private UUID id;
        private String email;
        private String role;
        private String firstName;
        private String lastName;
    }
}