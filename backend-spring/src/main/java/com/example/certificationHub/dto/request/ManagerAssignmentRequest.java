package com.example.certificationHub.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ManagerAssignmentRequest {
    @NotNull(message = "L'ID du manager est obligatoire")
    private UUID managerId;

    @NotNull(message = "L'ID du collaborateur est obligatoire")
    private UUID collaboratorId;
}