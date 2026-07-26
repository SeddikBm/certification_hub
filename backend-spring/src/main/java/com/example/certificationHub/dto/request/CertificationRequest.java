package com.example.certificationHub.dto.request;

import com.example.certificationHub.enumeration.CertifDifficulty;
import com.example.certificationHub.enumeration.CertifPriority;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class CertificationRequest {
    @NotBlank(message = "Le code est obligatoire")
    private String code;

    @NotBlank(message = "Le nom est obligatoire")
    private String name;
    @NotBlank(message = "Le provider est obligatoire")
    private String provider;

    @NotNull(message = "La difficulté est obligatoire")
    private CertifDifficulty difficulty;

    @NotNull(message = "La priorité est obligatoire")
    private CertifPriority priority;

    @PositiveOrZero(message = "Le coût de l'examen doit être positif ou nul")
    private BigDecimal examCostUsd;

    @PositiveOrZero(message = "Le coût de la formation doit être positif ou nul")
    private BigDecimal trainingCostUsd;

    @Positive(message = "La validité en mois doit être positive")
    private Integer validityMonths;

    private String officialUrl;
    private String examProviderUrl;
    
    private Map<String, Object> metadata;

    @NotNull(message = "La liste des squads (même vide) est requise")
    private List<SquadPriorityDto> squads;

    @Data
    public static class SquadPriorityDto {
        @NotNull(message = "L'ID du squad est obligatoire")
        private UUID squadId;

        @Min(value = 1, message = "Priorité min = 1")
        @Max(value = 5, message = "Priorité max = 5")
        private Short priority;
    }
}