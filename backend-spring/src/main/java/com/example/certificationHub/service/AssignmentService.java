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

        return assignmentRepository.findAll(
                AssignmentSpecification.withSecurityAndFilters(targetUserId, itemType, status, currentUserId,
                        role, managedUserIds),
                pageable).map(assignmentMapper::toResponse);
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

        // Vérification des doublons actifs
        boolean exists = assignmentRepository.existsByUserIdAndItemIdAndItemTypeAndCompletedAtIsNull(
                collaborator.getId(), request.getItemId(), request.getItemType());
        if (exists) {
            throw new ResourceConflictException("Une assignation active existe déjà pour cet utilisateur et cet item.");
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

        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            metadata.put("priority", request.getPriority());
        }
        if (request.getTargetManagerId() != null) {
            metadata.put("targetManagerId", request.getTargetManagerId().toString());
        }

        Assignment assignment = Assignment.builder()
                .itemType(request.getItemType())
                .itemId(request.getItemId())
                .user(collaborator)
                .assignedBy(assignedBy)
                .assignedAt(Instant.now())
                .examAt(examAt)
                .notes(request.getNotes())
                .metadata(metadata.isEmpty() ? null : metadata)
                .build();

        // Management assignments: if targetDate/examAt is provided, set to PLANNED; else APPROVED. Collaborator self-requests start as PENDING_APPROVAL.
        boolean isDirectManagementAssignment = !currentUserId.equals(collaborator.getId());
        boolean hasTargetDate = examAt != null;

        if (request.getItemType() == ItemType.CERTIFICATION) {
            if (isDirectManagementAssignment) {
                assignment.setStatusCertification(hasTargetDate ? StatusCertification.PLANNED : StatusCertification.APPROVED);
            } else {
                assignment.setStatusCertification(StatusCertification.PENDING_APPROVAL);
            }
        } else {
            if (isDirectManagementAssignment) {
                assignment.setStatusTraining(hasTargetDate ? StatusTraining.PLANNED : StatusTraining.APPROVED);
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
}