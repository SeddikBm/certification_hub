package com.example.certificationHub.security.entity;

import lombok.Data;
import java.io.Serializable;
import java.util.UUID;

@Data
public class RefreshTokenId implements Serializable {
    private UUID userId;
    private String tokenHash;
}