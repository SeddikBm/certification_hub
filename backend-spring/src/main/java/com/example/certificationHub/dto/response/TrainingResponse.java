package com.example.certificationHub.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class TrainingResponse {
    private UUID id;
    private String title;
    private String type;
    private String provider;
    private String priority;
    private String description;
    private String language;
    private BigDecimal durationHours;
    private BigDecimal costUsd;
    private String url;
    private Map<String, Object> metadata;

    private List<SquadShortDto> associatedSquads;

    @Data
    @Builder
    public static class SquadShortDto {
        private UUID id;
        private String name;
        private Short priority;
    }
}