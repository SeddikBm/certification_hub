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
import com.example.certificationHub.mapper.CertificationMapper;
import com.example.certificationHub.repository.*;
import com.example.certificationHub.repository.specification.CertificationSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificationService {

    private final CertificationRepository certificationRepository;
    private final CertificationSquadRepository certSquadRepository;
    private final SquadRepository squadRepository;
    private final AssignmentRepository assignmentRepository;
    private final CertificationRatingRepository ratingRepository;
    private final CertificationMapper certificationMapper; // Injection du nouveau Mapper

    @Transactional(readOnly = true)
    public Page<CertificationResponse> getCertifications(String provider, CertifDifficulty difficulty, CertifPriority priority, String search, Pageable pageable) {
        return certificationRepository
                .findAll(CertificationSpecification.withDynamicFilters(provider, difficulty, priority, search), pageable)
                .map(certificationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public CertificationResponse getCertificationDetails(UUID id) {
        Certification cert = certificationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification introuvable"));

        List<CertificationSquad> squads = certSquadRepository.findByCertificationId(id);
        Double averageRating = ratingRepository.getAverageRatingByCertificationId(id);

        return certificationMapper.toDetailedResponse(cert, squads, averageRating);
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

        return certificationMapper.toResponse(savedCert);
    }

    @Transactional
    public CertificationResponse updateCertification(UUID id, CertificationRequest request) {
        Certification cert = certificationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification introuvable"));

        if (!cert.getCode().equals(request.getCode()) && certificationRepository.existsByCodeAndDeletedAtIsNull(request.getCode())) {
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

        certSquadRepository.deleteByCertificationId(id); // Hard delete des liaisons
        assignToSquads(cert, request.getSquads()); // Recréation

        return certificationMapper.toResponse(certificationRepository.save(cert));
    }

    @Transactional
    public void deleteCertification(UUID id) {
        Certification cert = certificationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification introuvable"));

        List<Assignment> activeAssignments = assignmentRepository.findByItemTypeAndItemId(ItemType.CERTIFICATION, id).stream()
                .filter(a -> List.of(StatusCertification.PENDING_APPROVAL, StatusCertification.APPROVED, StatusCertification.PLANNED, StatusCertification.IN_PROGRESS, StatusCertification.EXAM_SCHEDULED)
                        .contains(a.getStatusCertification()))
                .toList();

        if (!activeAssignments.isEmpty()) {
            throw new ResourceConflictException("Impossible de supprimer : des collaborateurs sont actuellement assignés à cette certification.");
        }

        cert.setDeletedAt(Instant.now()); // Soft delete
        certificationRepository.save(cert);
    }

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
            
            certSquadRepository.save(cs);
        }
    }
}