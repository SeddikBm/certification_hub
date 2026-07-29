package com.example.certificationHub.dto.request;

import com.example.certificationHub.enumeration.ItemType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class AssignmentCreateRequest {
    @NotNull(message = "Le type d'item est obligatoire")
    private ItemType itemType;

    @NotNull(message = "L'ID de l'item est obligatoire")
    private UUID itemId;

    @NotNull(message = "L'ID de l'utilisateur est obligatoire")
    private UUID userId;

    private UUID targetManagerId;
    private String priority;
    private String targetDate;
    private String notes;
}