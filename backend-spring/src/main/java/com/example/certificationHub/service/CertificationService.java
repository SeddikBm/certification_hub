package com.example.certificationHub.service;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.Certification;
import com.example.certificationHub.entity.CertificationSquad;
import com.example.certificationHub.entity.Squad;
import com.example.certificationHub.enumeration.CertifDifficulty;
import com.example.certificationHub.enumeration.CertifPriority;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.dto.request.CertificationRequest;
import com.example.certificationHub.dto.response.CertificationResponse;
import com.example.certificationHub.exception.ResourceConflictException;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.CertificationSquadRepository;
import com.example.certificationHub.repository.SquadRepository;
import com.example.certificationHub.repository.specification.CertificationSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificationService {

    private final CertificationRepository certificationRepository;
    private final CertificationSquadRepository certifSquadRepository;
    private final SquadRepository squadRepository;
    private final AssignmentRepository assignmentRepository;
    // Injecte ici le CertificationRatingRepository pour calculer la note moyenne
    // plus tard

    @Transactional(readOnly = true)
    public Page<CertificationResponse> getCertifications(String provider, CertifDifficulty difficulty,
            CertifPriority priority, String search, Pageable pageable) {
        Specification<Certification> spec = CertificationSpecification.withDynamicFilters(provider, difficulty,
                priority, search);
        return certificationRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public CertificationResponse getCertificationDetails(UUID id) {
        Certification cert = certificationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification introuvable"));

        CertificationResponse response = mapToResponse(cert);

        // Enrichissement avec les squads associés
        List<CertificationResponse.SquadShortDto> squads = certifSquadRepository.findByCertificationId(id).stream()
                .map(cs -> CertificationResponse.SquadShortDto.builder()
                        .id(cs.getSquad().getId())
                        .name(cs.getSquad().getName())
                        .priority(cs.getPriority())
                        .build())
                .collect(Collectors.toList());

        response.setAssociatedSquads(squads);
        // Optionnel: Calculer response.setAverageRating() avec le RatingRepository

        return response;
    }

    @Transactional
    public CertificationResponse createCertification(CertificationRequest request) {
        if (certificationRepository.existsByCodeAndDeletedAtIsNull(request.getCode())) {
            throw new ResourceConflictException("Le code de certification existe déjà");
        }

        Certification cert = Certification.builder()
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

        Certification savedCert = certificationRepository.save(cert);
        assignToSquads(savedCert, request.getSquads());

        return mapToResponse(savedCert);
    }

    @Transactional
    public CertificationResponse updateCertification(UUID id, CertificationRequest request) {
        Certification cert = certificationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification introuvable"));

        // Vérifier conflit de code (si on le modifie)
        if (!cert.getCode().equals(request.getCode())
                && certificationRepository.existsByCodeAndDeletedAtIsNull(request.getCode())) {
            throw new ResourceConflictException("Ce nouveau code de certification existe déjà");
        }

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

        certifSquadRepository.deleteByCertificationId(id); // On nettoie les anciennes liaisons
        assignToSquads(cert, request.getSquads()); // On recrée les nouvelles

        return mapToResponse(certificationRepository.save(cert));
    }

    @Transactional
    public void deleteCertification(UUID id) {
        Certification cert = certificationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification introuvable"));

        // Vérifier s'il y a des assignations actives (ex: EN COURS, PLANIFIEE)
        List<Assignment> activeAssignments = assignmentRepository.findByItemTypeAndItemId(ItemType.CERTIFICATION, id)
                .stream()
                .filter(a -> List
                        .of(StatusCertification.PENDING_APPROVAL, StatusCertification.APPROVED,
                                StatusCertification.PLANNED, StatusCertification.IN_PROGRESS,
                                StatusCertification.EXAM_SCHEDULED)
                        .contains(a.getStatusCertification()))
                .toList();

        if (!activeAssignments.isEmpty()) {
            throw new ResourceConflictException(
                    "Impossible de supprimer : des collaborateurs sont actuellement en cours sur cette certification.");
        }

        // Soft Delete
        cert.setDeletedAt(Instant.now());
        certificationRepository.save(cert);
    }

    // --- Méthodes utilitaires ---

    private void assignToSquads(Certification cert, List<CertificationRequest.SquadPriorityDto> squadDtos) {
        for (var dto : squadDtos) {
            Squad squad = squadRepository.findById(dto.getSquadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Squad ID " + dto.getSquadId() + " introuvable"));

            CertificationSquad cs = new CertificationSquad();
            cs.getId().setCertificationId(cert.getId());
            cs.getId().setSquadId(squad.getId());
            cs.setCertification(cert);
            cs.setSquad(squad);
            cs.setPriority(dto.getPriority());

            certifSquadRepository.save(cs);
        }
    }

    private CertificationResponse mapToResponse(Certification cert) {
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
}
