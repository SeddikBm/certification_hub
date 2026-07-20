package com.example.certificationHub.mapper;

import com.example.certificationHub.entity.Certification;
import com.example.certificationHub.entity.CertificationSquad;
import com.example.certificationHub.dto.request.CertificationRequest;
import com.example.certificationHub.dto.response.CertificationResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CertificationMapper {

    // --- SENS ENTITÉ -> DTO ---

    public CertificationResponse toResponse(Certification cert) {
        if (cert == null)
            return null;

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

    public CertificationResponse toDetailedResponse(Certification cert, List<CertificationSquad> squads,
            Double averageRating) {
        CertificationResponse response = toResponse(cert);

        // Arrondir la moyenne à 1 décimale (ex: 4.3)
        response.setAverageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : null);

        if (squads != null) {
            List<CertificationResponse.SquadShortDto> squadDtos = squads.stream()
                    .map(cs -> CertificationResponse.SquadShortDto.builder()
                            .id(cs.getSquad().getId())
                            .name(cs.getSquad().getName())
                            .priority(cs.getPriority())
                            .build())
                    .toList();
            response.setAssociatedSquads(squadDtos);
        }

        return response;
    }

    // --- SENS DTO -> ENTITÉ ---

    // Pour la création (POST)
    public Certification toEntity(CertificationRequest request) {
        if (request == null)
            return null;

        return Certification.builder()
                .code(request.getCode())
                .name(request.getName())
                .provider(request.getProvider())
                .difficulty(request.getDifficulty())
                .priority(request.getPriority())
                .examCostUsd(request.getExamCostUsd())
                .trainingCostUsd(request.getTrainingCostUsd())
                .validityMonths(request.getValidityMonths())
                .officialUrl(request.getOfficialUrl())
                .examProviderUrl(request.getExamProviderUrl())
                .metadata(request.getMetadata())
                .build();
    }

    // Pour la mise à jour (PUT) - Écrase les valeurs existantes
    public void updateEntity(Certification cert, CertificationRequest request) {
        if (request == null || cert == null)
            return;

        cert.setCode(request.getCode());
        cert.setName(request.getName());
        cert.setProvider(request.getProvider());
        cert.setDifficulty(request.getDifficulty());
        cert.setPriority(request.getPriority());
        cert.setExamCostUsd(request.getExamCostUsd());
        cert.setTrainingCostUsd(request.getTrainingCostUsd());
        cert.setValidityMonths(request.getValidityMonths());
        cert.setOfficialUrl(request.getOfficialUrl());
        cert.setExamProviderUrl(request.getExamProviderUrl());
        cert.setMetadata(request.getMetadata());
    }
}