package com.example.certificationHub.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String type; // INFO, WARNING, SUCCESS, ERROR (pour colorer l'icône)
    private String title;
    private String message;
    private Boolean isRead;
    private String actionUrl;
    private Instant createdAt;
}