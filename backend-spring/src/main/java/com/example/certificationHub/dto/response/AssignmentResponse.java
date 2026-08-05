package com.example.certificationHub.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AssignmentResponse {
    private UUID id;
    private String itemType;
    private UUID itemId;
    private String itemName;
    private String itemCode;
    private String provider;
    private UUID userId;
    private String userName;
    private String userEmail;
    private String squadName;
    private UUID managerId;
    private String managerName;
    private UUID assignedById;
    private String assignedByName;
    private String assignedByRole;
    private String statusCertification;
    private String statusTraining;
    private String priority;
    private Instant assignedAt;
    private Instant completedAt;
    private Instant plannedStartDate;
    private Instant examAt;
    private Instant targetDate;
    private Boolean isNearDeadline;
    private Short trainingProgressPercentage;
    private String notes;
    private UUID certificateId;
    private String certificateFileName;
    private String certificateStatus;
    /**
     * Résultats de la validation IA stockés en JSONB sur le certificat.
     * Contient: decision, source, scores{name_score, title_score, date_score, overall_score},
     *           reasons[], extracted{holder_name, certification_title, issue_date, issuer}
     */
    private Map<String, Object> validationDetails;
}