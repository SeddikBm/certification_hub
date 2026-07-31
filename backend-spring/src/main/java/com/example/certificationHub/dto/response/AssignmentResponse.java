package com.example.certificationHub.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
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
}