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

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CertificationRepository certificationRepository;
    private final TrainingRepository trainingRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentWorkflowValidator workflowValidator;

    // Services factices pour l'exemple (à remplacer par tes implémentations)
    // private final AuditLogService auditLogService;
    // private final NotificationProducer notificationProducer;

    @Transactional(readOnly = true)
    public Page<AssignmentResponse> getAssignments(UUID targetUserId, ItemType itemType, String status,
            Pageable pageable, UUID currentUserId, String currentUserRole) {
        List<UUID> managedUserIds = new ArrayList<>();

        if ("CAREER_MANAGER".equals(currentUserRole)) {
            managedUserIds = managerAssignmentRepository.findByManagerId(currentUserId).stream()
                    .map(ma -> ma.getCollaborator().getId())
                    .toList();
        }

        return assignmentRepository.findAll(
                AssignmentSpecification.withSecurityAndFilters(targetUserId, itemType, status, currentUserId,
                        currentUserRole, managedUserIds),
                pageable).map(assignmentMapper::toResponse);
    }

    @Transactional
    public AssignmentResponse createAssignment(AssignmentCreateRequest request, UUID currentUserId,
            String currentUserRole) {
        User collaborator = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur introuvable"));

        if ("COLLABORATOR".equals(currentUserRole) && !currentUserId.equals(collaborator.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous ne pouvez demander une certification que pour vous-même.");
        }
        // Validation RLS : Un manager ne peut assigner qu'à SES collaborateurs
        if ("CAREER_MANAGER".equals(currentUserRole)) {
            boolean isManaged = managerAssignmentRepository.existsById(
                    new ManagerAssignment.Id(currentUserId, collaborator.getId()));
            if (!isManaged && !currentUserId.equals(collaborator.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vous ne pouvez assigner qu'à vos propres collaborateurs.");
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

        Assignment assignment = Assignment.builder()
                .itemType(request.getItemType())
                .itemId(request.getItemId())
                .user(collaborator)
                .assignedBy(assignedBy)
                .assignedAt(Instant.now())
                .notes(request.getNotes())
                .build();

        // Gestion du polymorphisme des statuts
        if (request.getItemType() == ItemType.CERTIFICATION) {
            assignment.setStatusCertification(StatusCertification.PENDING_APPROVAL);
        } else {
            assignment.setStatusTraining(StatusTraining.PENDING_APPROVAL);
        }

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // notificationProducer.sendAssignmentNotification(collaborator.getId(),
        // savedAssignment.getId());

        return assignmentMapper.toResponse(savedAssignment);
    }

    @Transactional
    public AssignmentResponse updateAssignmentStatus(UUID assignmentId, AssignmentUpdateRequest request,
            UUID currentUserId, String currentUserRole) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignation introuvable"));

        // Validation RLS (Identique au GET/POST)
        if (!"ADMIN".equals(currentUserRole) && !assignment.getUser().getId().equals(currentUserId)) {
            if ("CAREER_MANAGER".equals(currentUserRole)) {
                boolean isManaged = managerAssignmentRepository.existsById(
                        new ManagerAssignment.Id(currentUserId, assignment.getUser().getId()));
                if (!isManaged)
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
            } else {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
            }
        }

        // Traitement Polymorphique & Machine à états
        if (assignment.getItemType() == ItemType.CERTIFICATION && request.getStatusCertification() != null) {
            workflowValidator.validateCertificationTransition(assignment.getStatusCertification(),
                    request.getStatusCertification());
            assignment.setStatusCertification(request.getStatusCertification());

            if (request.getStatusCertification() == StatusCertification.COMPLETED
                    || request.getStatusCertification() == StatusCertification.FAILED) {
                assignment.setCompletedAt(Instant.now());
            }
        } else if (assignment.getItemType() == ItemType.TRAINING && request.getStatusTraining() != null) {
            workflowValidator.validateTrainingTransition(assignment.getStatusTraining(), request.getStatusTraining());
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

        // auditLogService.logAction(currentUserId, "UPDATE_STATUS", "ASSIGNMENT",
        // assignmentId);
        // notificationProducer.sendStatusChangeNotification(assignment.getUser().getId(),
        // updatedAssignment);

        return assignmentMapper.toResponse(updatedAssignment);
    }
}