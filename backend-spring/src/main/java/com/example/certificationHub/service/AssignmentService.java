package com.example.certificationHub.service;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.ManagerAssignment;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.enumeration.StatusTraining;
import com.example.certificationHub.dto.request.AssignmentCreateRequest;
import com.example.certificationHub.dto.response.AssignmentResponse;
import com.example.certificationHub.dto.request.AssignmentUpdateRequest;
import com.example.certificationHub.exception.ResourceConflictException;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.mapper.AssignmentMapper;
import com.example.certificationHub.messaging.AssignmentEvent;
import com.example.certificationHub.messaging.NotificationProducer;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import com.example.certificationHub.repository.TrainingRepository;
import com.example.certificationHub.repository.UserRepository;
import com.example.certificationHub.repository.specification.AssignmentSpecification;
import com.example.certificationHub.validator.AssignmentWorkflowValidator;

import org.springframework.scheduling.annotation.Scheduled;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final NotificationProducer notificationProducer;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CertificationRepository certificationRepository;
    private final TrainingRepository trainingRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentWorkflowValidator workflowValidator;

    @Transactional(readOnly = true)
    public Page<AssignmentResponse> getAssignments(UUID targetUserId, ItemType itemType, String status,
            Pageable pageable, UUID currentUserId, String currentUserRole) {
        List<UUID> managedUserIds = new ArrayList<>();
        String role = currentUserRole != null ? currentUserRole.replace("ROLE_", "") : "";

        if ("CAREER_MANAGER".equals(role) || "ADMIN".equals(role) || "DIRECTOR".equals(role) || "TRAINING_MANAGER".equals(role)) {
            managedUserIds = managerAssignmentRepository.findByManagerId(currentUserId).stream()
                    .filter(ma -> ma.getCollaborator() != null)
                    .map(ma -> ma.getCollaborator().getId())
                    .toList();
        } else if ("SQUAD_LEAD".equals(role)) {
            User squadLead = userRepository.findById(currentUserId).orElse(null);
            if (squadLead != null && squadLead.getSquad() != null) {
                UUID squadId = squadLead.getSquad().getId();
                managedUserIds = userRepository.findAll().stream()
                        .filter(u -> u.getSquad() != null && squadId.equals(u.getSquad().getId()))
                        .map(User::getId)
                        .toList();
            }
        }

        Page<Assignment> page = assignmentRepository.findAll(
                AssignmentSpecification.withSecurityAndFilters(targetUserId, itemType, status, currentUserId,
                        role, managedUserIds),
                pageable);

        if ("CAREER_MANAGER".equals(role)) {
            List<AssignmentResponse> filtered = page.getContent().stream()
                    .filter(a -> {
                        // 1. If assigned directly by this CM: KEEP IT
                        if (a.getAssignedBy() != null && currentUserId.equals(a.getAssignedBy().getId())) {
                            return true;
                        }
                        // 2. If assigned by someone else (ADMIN, TRAINING_MANAGER, or another CM): HIDE FROM THIS CM
                        if (a.getAssignedBy() != null && !currentUserId.equals(a.getAssignedBy().getId())) {
                            return false;
                        }
                        // 3. If requested by collaborator targeting a specific CM: ONLY show if targeted to THIS CM
                        if (a.getMetadata() != null && a.getMetadata().containsKey("targetManagerId")) {
                            Object tmObj = a.getMetadata().get("targetManagerId");
                            if (tmObj != null && !tmObj.toString().isBlank()) {
                                return currentUserId.toString().equals(tmObj.toString());
                            }
                        }
                        return true;
                    })
                    .map(assignmentMapper::toResponse)
                    .toList();
            return new org.springframework.data.domain.PageImpl<>(filtered, pageable, page.getTotalElements());
        }

        return page.map(assignmentMapper::toResponse);
    }

    @Transactional
    public AssignmentResponse createAssignment(AssignmentCreateRequest request, UUID currentUserId,
            String currentUserRole) {
        User collaborator = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur introuvable"));

        if ("DIRECTOR".equals(currentUserRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Le directeur n'a pas le droit d'effectuer des assignations.");
        }

        if ("COLLABORATOR".equals(currentUserRole) && !currentUserId.equals(collaborator.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous ne pouvez demander une certification que pour vous-même.");
        }
        // Validation RLS : Un manager ne peut assigner qu'à SES collaborateurs
        if ("CAREER_MANAGER".equals(currentUserRole)) {
            boolean isManaged = managerAssignmentRepository.existsById(
                    new ManagerAssignment.Id(currentUserId, collaborator.getId()));
            if (!isManaged && !currentUserId.equals(collaborator.getId())) {
                boolean isManagedFallback = managerAssignmentRepository.findFirstByCollaboratorId(collaborator.getId())
                        .map(ma -> ma.getManager() != null && currentUserId.equals(ma.getManager().getId()))
                        .orElse(false);
                if (!isManagedFallback) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Vous ne pouvez assigner qu'à vos propres collaborateurs.");
                }
            }
        }

        // Vérification de l'existence de l'item dans le catalogue
        if (request.getItemType() == ItemType.CERTIFICATION) {
            if (!certificationRepository.existsById(request.getItemId()))
                throw new ResourceNotFoundException("Certification introuvable");
        } else {
            if (!trainingRepository.existsById(request.getItemId()))
                throw new ResourceNotFoundException("Formation introuvable");
        }

        // Vérification des doublons à l'échelle du système
        List<Assignment> existingAssignments = assignmentRepository.findByUserId(collaborator.getId());

        // 1. Interdit si déjà obtenu (COMPLETED)
        boolean existsCompleted = existingAssignments.stream().anyMatch(a ->
            a.getItemType() == request.getItemType() &&
            request.getItemId().equals(a.getItemId()) &&
            ((a.getItemType() == ItemType.CERTIFICATION && a.getStatusCertification() == StatusCertification.COMPLETED) ||
             (a.getItemType() == ItemType.TRAINING && a.getStatusTraining() == StatusTraining.COMPLETED))
        );
        if (existsCompleted) {
            String label = request.getItemType() == ItemType.CERTIFICATION ? "cette certification." : "cette formation.";
            throw new ResourceConflictException("Ce collaborateur a déjà obtenu " + label);
        }

        // 2. Interdit si assignation active (sauf si CANCELLED ou FAILED)
        boolean existsActive = existingAssignments.stream().anyMatch(a ->
            a.getItemType() == request.getItemType() &&
            request.getItemId().equals(a.getItemId()) &&
            (a.getStatusCertification() == null || (a.getStatusCertification() != StatusCertification.CANCELLED && a.getStatusCertification() != StatusCertification.FAILED)) &&
            (a.getStatusTraining() == null || a.getStatusTraining() != StatusTraining.CANCELLED)
        );
        if (existsActive) {
            throw new ResourceConflictException("Ce collaborateur a déjà une assignation active pour cette certification/formation.");
        }

        User assignedBy = userRepository.findById(currentUserId).orElseThrow();

        Instant examAt = null;
        if (request.getTargetDate() != null && !request.getTargetDate().isBlank()) {
            try {
                examAt = Instant.parse(request.getTargetDate());
            } catch (Exception ignored) {
                try {
                    examAt = java.time.LocalDate.parse(request.getTargetDate()).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
                } catch (Exception ignored2) {}
            }
        }

        boolean isDirectManagementAssignment = !currentUserId.equals(collaborator.getId());
        if (!isDirectManagementAssignment && examAt != null) {
            Instant min7Days = java.time.LocalDate.now().plusDays(6).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
            if (examAt.isBefore(min7Days)) {
                throw new ResourceConflictException("La date cible doit être fixée au moins 7 jours à l'avance.");
            }
        }

        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            metadata.put("priority", request.getPriority());
        }
        if (request.getTargetManagerId() != null) {
            metadata.put("targetManagerId", request.getTargetManagerId().toString());
        }
        if (examAt != null) {
            metadata.put("targetDate", examAt.toString());
        }

        Assignment assignment = Assignment.builder()
                .itemType(request.getItemType())
                .itemId(request.getItemId())
                .user(collaborator)
                .assignedBy(assignedBy)
                .assignedAt(Instant.now())
                .examAt(null)
                .notes(request.getNotes())
                .metadata(metadata.isEmpty() ? null : metadata)
                .build();

        // Management assignments start as APPROVED. Collaborator self-requests start as PENDING_APPROVAL.
        boolean isDirectManagementAssignment = !currentUserId.equals(collaborator.getId());

        if (request.getItemType() == ItemType.CERTIFICATION) {
            if (isDirectManagementAssignment) {
                assignment.setStatusCertification(StatusCertification.APPROVED);
            } else {
                assignment.setStatusCertification(StatusCertification.PENDING_APPROVAL);
            }
        } else {
            if (isDirectManagementAssignment) {
                assignment.setStatusTraining(StatusTraining.APPROVED);
            } else {
                assignment.setStatusTraining(StatusTraining.PENDING_APPROVAL);
            }
        }

        Assignment savedAssignment = assignmentRepository.save(assignment);

        String itemName = request.getItemType() == ItemType.CERTIFICATION
                ? certificationRepository.findById(request.getItemId()).map(c -> c.getName()).orElse("Certification")
                : trainingRepository.findById(request.getItemId()).map(t -> t.getTitle()).orElse("Formation");

        notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                .userId(collaborator.getId())
                .userEmail(collaborator.getEmail())
                .userFullName(collaborator.getFirstName() + " " + collaborator.getLastName())
                .assignmentId(savedAssignment.getId())
                .itemName(itemName)
                .eventType("CREATED") // Déclenche le template "Nouvelle demande"
                .build());

        return assignmentMapper.toResponse(savedAssignment);
    }

    @Transactional
    public AssignmentResponse updateAssignmentStatus(UUID assignmentId, AssignmentUpdateRequest request,
            UUID currentUserId, String currentUserRole) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignation introuvable"));

        // Validation RLS
        String role = currentUserRole != null ? currentUserRole.replace("ROLE_", "") : "";
        if ("DIRECTOR".equals(role) || "SQUAD_LEAD".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé : Ce rôle a un accès en lecture seule aux assignations.");
        }

        if (!"ADMIN".equals(role) && !"TRAINING_MANAGER".equals(role) && !assignment.getUser().getId().equals(currentUserId)) {
            if ("CAREER_MANAGER".equals(role)) {
                boolean isManaged = managerAssignmentRepository.existsById(
                        new ManagerAssignment.Id(currentUserId, assignment.getUser().getId()));
                if (!isManaged)
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
            } else {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
            }
        }
        boolean isNewlyApproved = false;
        boolean isNewlyRejected = false;
        boolean isNewlyScheduled = false;

        // Traitement Polymorphique & Machine à états
        if (assignment.getItemType() == ItemType.CERTIFICATION && request.getStatusCertification() != null) {
            workflowValidator.validateCertificationTransition(assignment.getStatusCertification(),
                    request.getStatusCertification());

            if (assignment.getStatusCertification() == StatusCertification.PENDING_APPROVAL) {
                if (request.getStatusCertification() == StatusCertification.APPROVED)
                    isNewlyApproved = true;
                if (request.getStatusCertification() == StatusCertification.CANCELLED)
                    isNewlyRejected = true;
            }
            if (assignment.getStatusCertification() == StatusCertification.IN_PROGRESS &&
                    request.getStatusCertification() == StatusCertification.EXAM_SCHEDULED) {
                isNewlyScheduled = true;
            }

            assignment.setStatusCertification(request.getStatusCertification());

            if (request.getStatusCertification() == StatusCertification.COMPLETED
                    || request.getStatusCertification() == StatusCertification.FAILED) {
                assignment.setCompletedAt(Instant.now());
            }
        } else if (assignment.getItemType() == ItemType.TRAINING && request.getStatusTraining() != null) {
            workflowValidator.validateTrainingTransition(assignment.getStatusTraining(), request.getStatusTraining());

            if (assignment.getStatusTraining() == StatusTraining.PENDING_APPROVAL) {
                if (request.getStatusTraining() == StatusTraining.APPROVED)
                    isNewlyApproved = true;
                if (request.getStatusTraining() == StatusTraining.CANCELLED)
                    isNewlyRejected = true;
            }
            assignment.setStatusTraining(request.getStatusTraining());

            if (request.getStatusTraining() == StatusTraining.COMPLETED) {
                assignment.setCompletedAt(Instant.now());
                assignment.setTrainingProgressPercentage((short) 100);
            }
        }

        if (request.getPlannedStartDate() != null) {
            java.util.Map<String, Object> metadata = assignment.getMetadata();
            if (metadata == null) {
                metadata = new java.util.HashMap<>();
            } else {
                metadata = new java.util.HashMap<>(metadata);
            }
            metadata.put("plannedStartDate", request.getPlannedStartDate().toString());
            assignment.setMetadata(metadata);
        }

        // Mise à jour des autres champs optionnels
        if (request.getExamAt() != null)
            assignment.setExamAt(request.getExamAt());
        if (request.getTrainingProgressPercentage() != null)
            assignment.setTrainingProgressPercentage(request.getTrainingProgressPercentage());
        if (request.getNotes() != null)
            assignment.setNotes(request.getNotes());

        Assignment updatedAssignment = assignmentRepository.save(assignment);

        if (isNewlyApproved || isNewlyRejected || isNewlyScheduled) {
            String itemName = assignment.getItemType() == ItemType.CERTIFICATION
                    ? certificationRepository.findById(assignment.getItemId()).map(c -> c.getName())
                            .orElse("Certification")
                    : trainingRepository.findById(assignment.getItemId()).map(t -> t.getTitle()).orElse("Formation");

            String eventType;
            if (isNewlyApproved) {
                eventType = "APPROVED";
            } else if (isNewlyScheduled) {
                eventType = "EXAM_SCHEDULED";
            } else {
                eventType = "REJECTED";
            }

            notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                    .userId(assignment.getUser().getId())
                    .userEmail(assignment.getUser().getEmail())
                    .userFullName(assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName())
                    .assignmentId(updatedAssignment.getId())
                    .itemName(itemName)
                    .eventType(eventType)
                    .build());
        }

        return assignmentMapper.toResponse(updatedAssignment);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoFailExpiredAssignments() {
        List<Assignment> assignments = assignmentRepository.findAll();
        Instant now = Instant.now();
        for (Assignment a : assignments) {
            if (a.getCompletedAt() != null) continue;

            Instant targetDate = null;
            if (a.getMetadata() != null && a.getMetadata().containsKey("targetDate")) {
                try {
                    targetDate = Instant.parse(a.getMetadata().get("targetDate").toString());
                } catch (Exception ignored) {}
            }

            if (targetDate != null && targetDate.isBefore(now)) {
                if (a.getItemType() == ItemType.CERTIFICATION) {
                    if (a.getStatusCertification() != StatusCertification.EXAM_SCHEDULED &&
                        a.getStatusCertification() != StatusCertification.COMPLETED &&
                        a.getStatusCertification() != StatusCertification.FAILED &&
                        a.getStatusCertification() != StatusCertification.CANCELLED) {
                        
                        a.setStatusCertification(StatusCertification.FAILED);
                        a.setCompletedAt(now);
                        assignmentRepository.save(a);
                    }
                } else if (a.getItemType() == ItemType.TRAINING) {
                    if (a.getStatusTraining() != StatusTraining.COMPLETED &&
                        a.getStatusTraining() != StatusTraining.CANCELLED) {
                        
                        a.setStatusTraining(StatusTraining.CANCELLED);
                        a.setCompletedAt(now);
                        assignmentRepository.save(a);
                    }
                }
            }
        }
    }
}