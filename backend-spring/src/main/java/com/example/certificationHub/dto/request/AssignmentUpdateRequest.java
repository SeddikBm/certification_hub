package com.example.certificationHub.dto.request;

import lombok.Data;
import java.time.Instant;

import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.enumeration.StatusTraining;

@Data
public class AssignmentUpdateRequest {
    private StatusCertification statusCertification;
    private StatusTraining statusTraining;
    private Instant plannedStartDate;
    private Instant examAt;
    private Short trainingProgressPercentage;
    private String notes;
}