package com.example.certificationHub.mapper;

import com.example.certificationHub.entity.Certification;
import com.example.certificationHub.entity.CertificationSquad;
import com.example.certificationHub.dto.response.CertificationResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CertificationMapper {

    public CertificationResponse toResponse(Certification cert) {
        return CertificationResponse.builder()
                .id(cert.getId())
                .code(cert.getCode())
                .name(cert.getName())
                .provider(cert.getProvider())
                .difficulty(cert.getDifficulty() != null ? cert.getDifficulty().name() : null)
                .priority(cert.getPriority() != null ? cert.getPriority().name() : null)
                .examCostUsd(cert.getExamCostUsd())
                .trainingCostUsd(cert.getTrainingCostUsd())
                .validityMonths(cert.getValidityMonths())
                .officialUrl(cert.getOfficialUrl())
                .examProviderUrl(cert.getExamProviderUrl())
                .metadata(cert.getMetadata())
                .build();
    }

    public CertificationResponse toDetailedResponse(Certification cert, List<CertificationSquad> squads, Double averageRating) {
        CertificationResponse response = toResponse(cert);
        
        response.setAverageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : null);
        
        List<CertificationResponse.SquadShortDto> squadDtos = squads.stream()
                .map(cs -> CertificationResponse.SquadShortDto.builder()
                        .id(cs.getSquad().getId())
                        .name(cs.getSquad().getName())
                        .priority(cs.getPriority())
                        .build())
                .toList();
                
        response.setAssociatedSquads(squadDtos);
        return response;
    }
}