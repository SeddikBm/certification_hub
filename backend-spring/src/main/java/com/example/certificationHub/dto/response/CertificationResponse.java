package com.example.certificationHub.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class CertificationResponse {
    private UUID id;
    private String code;
    private String name;
    private String provider;
    private String difficulty;
    private String priority;
    private BigDecimal examCostUsd;
    private BigDecimal trainingCostUsd;
    private Integer validityMonths;
    private String officialUrl;
    private String examProviderUrl;
    private Map<String, Object> metadata;
    
    // Enrichissement spécifique pour le GET /:id
    private Double averageRating; 
    private List<SquadShortDto> associatedSquads;

    @Data
    @Builder
    public static class SquadShortDto {
        private UUID id;
        private String name;
        private String colorHex;
        private Short priority;
    }
}