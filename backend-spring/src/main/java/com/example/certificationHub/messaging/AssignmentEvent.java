package com.example.certificationHub.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentEvent {
    private UUID userId; // Collaborateur concerné
    private String userEmail;
    private String userFullName;
    
    private UUID targetUserId; // Destinataire de la notification/email
    private String targetUserEmail;
    private String targetUserFullName;

    private UUID assignmentId;
    private String itemName; // Nom de la formation ou certification
    private String itemType; // CERTIFICATION ou TRAINING
    private String eventType; // CREATED, APPROVED, REJECTED, CERTIFICATE_UPLOADED, CERTIFICATE_STATUS_CHANGED, DEADLINE_APPROACHING, EXPIRED, REVIEW_REPORTED
    private String notes;
    private String noteLabel;
    private String actionUrl;
    private String details;
}