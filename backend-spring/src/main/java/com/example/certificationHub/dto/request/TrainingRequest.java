package com.example.certificationHub.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.example.certificationHub.enumeration.TrainingPriority;
import com.example.certificationHub.enumeration.TrainingType;

@Data
public class TrainingRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    @NotNull(message = "Le type de formation est obligatoire")
    private TrainingType type;

    private String provider;

    @NotNull(message = "La priorité est obligatoire")
    private TrainingPriority priority;

    // Stockés dans metadata en base
    private String description;
    private String language;

    @PositiveOrZero(message = "La durée doit être positive")
    private BigDecimal durationHours;

    @PositiveOrZero(message = "Le coût doit être positif ou nul")
    private BigDecimal costUsd;

    private String url;

    private Map<String, Object> metadata; // Pour d'autres champs libres

    @NotNull(message = "La liste des squads est requise")
    private List<SquadPriorityDto> squads;

    @Data
    public static class SquadPriorityDto {
        @NotNull(message = "L'ID du squad est obligatoire")
        private UUID squadId;

        @NotNull(message = "La priorité est obligatoire")
        @Min(value = 1, message = "Priorité min = 1")
        @Max(value = 5, message = "Priorité max = 5")
        private Short priority;
    }
}