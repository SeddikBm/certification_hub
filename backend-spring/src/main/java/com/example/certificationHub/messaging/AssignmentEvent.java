package com.example.certificationHub.messaging;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AssignmentEvent {
    private UUID userId;
    private String userEmail;
    private String userFullName;
    private UUID assignmentId;
    private String itemName; // Nom de la formation ou certification
    private String eventType; // "CREATED", "APPROVED", "REJECTED", "CERTIFICATE_UPLOADED"
}