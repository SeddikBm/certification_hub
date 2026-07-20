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
    private UUID userId;
    private String userName;
    private UUID assignedById;
    private String statusCertification;
    private String statusTraining;
    private Instant assignedAt;
    private Instant completedAt;
    private Instant examAt;
    private Short trainingProgressPercentage;
    private String notes;
}