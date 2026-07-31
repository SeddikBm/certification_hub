package com.example.certificationHub.mapper;

import com.example.certificationHub.dto.response.AssignmentResponse;
import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.UserRole;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import com.example.certificationHub.repository.TrainingRepository;
import com.example.certificationHub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AssignmentMapper {

    private final CertificationRepository certificationRepository;
    private final TrainingRepository trainingRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;
    private final UserRepository userRepository;

    public AssignmentResponse toResponse(Assignment assignment) {
        if (assignment == null) return null;

        String itemName = null;
        String itemCode = null;
        String provider = null;

        if (assignment.getItemType() == ItemType.CERTIFICATION && assignment.getItemId() != null) {
            var cert = certificationRepository.findById(assignment.getItemId()).orElse(null);
            if (cert != null) {
                itemName = cert.getName();
                itemCode = cert.getCode();
                provider = cert.getProvider();
            }
        } else if (assignment.getItemType() == ItemType.TRAINING && assignment.getItemId() != null) {
            var training = trainingRepository.findById(assignment.getItemId()).orElse(null);
            if (training != null) {
                itemName = training.getTitle();
                provider = training.getProvider();
            }
        }

        String userName = null;
        String userEmail = null;
        String squadName = null;
        UUID managerId = null;
        String managerName = null;

        if (assignment.getUser() != null) {
            userName = assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName();
            userEmail = assignment.getUser().getEmail();
            if (assignment.getUser().getSquad() != null) {
                squadName = assignment.getUser().getSquad().getName();
            }
        }

        // 1. Resolve manager from metadata.targetManagerId (selected on self-request)
        if (assignment.getMetadata() != null && assignment.getMetadata().containsKey("targetManagerId")) {
            try {
                Object tmObj = assignment.getMetadata().get("targetManagerId");
                if (tmObj != null && !tmObj.toString().isBlank()) {
                    UUID tmId = UUID.fromString(tmObj.toString());
                    User tm = userRepository.findById(tmId).orElse(null);
                    if (tm != null) {
                        managerId = tm.getId();
                        managerName = tm.getFirstName() + " " + tm.getLastName();
                    }
                }
            } catch (Exception ignored) {}
        }

        // 2. If no targetManagerId, check if assignedBy is a CAREER_MANAGER, TRAINING_MANAGER or ADMIN
        if (managerName == null && assignment.getAssignedBy() != null) {
            UserRole assignerRole = assignment.getAssignedBy().getRole();
            if (assignerRole == UserRole.CAREER_MANAGER || assignerRole == UserRole.TRAINING_MANAGER || assignerRole == UserRole.ADMIN) {
                managerId = assignment.getAssignedBy().getId();
                managerName = assignment.getAssignedBy().getFirstName() + " " + assignment.getAssignedBy().getLastName();
            }
        }

        // 3. Fallback: Check collaborator's primary linked manager in manager_assignments
        if (managerName == null && assignment.getUser() != null) {
            var ma = managerAssignmentRepository.findFirstByCollaboratorId(assignment.getUser().getId()).orElse(null);
            if (ma != null && ma.getManager() != null) {
                managerId = ma.getManager().getId();
                managerName = ma.getManager().getFirstName() + " " + ma.getManager().getLastName();
            }
        }

        String priority = null;
        if (assignment.getMetadata() != null && assignment.getMetadata().containsKey("priority")) {
            Object pObj = assignment.getMetadata().get("priority");
            if (pObj != null) {
                priority = pObj.toString();
            }
        }

        String assignedByName = null;
        String assignedByRole = null;
        if (assignment.getAssignedBy() != null) {
            assignedByName = assignment.getAssignedBy().getFirstName() + " " + assignment.getAssignedBy().getLastName();
            if (assignment.getAssignedBy().getRole() != null) {
                assignedByRole = assignment.getAssignedBy().getRole().name();
            }
        }

        java.time.Instant targetDateInstant = null;
        java.time.Instant plannedStartDateInstant = null;
        Boolean isNearDeadline = false;

        if (assignment.getMetadata() != null) {
            if (assignment.getMetadata().containsKey("targetDate")) {
                try {
                    targetDateInstant = java.time.Instant.parse(assignment.getMetadata().get("targetDate").toString());
                } catch (Exception ignored) {}
            }
            if (assignment.getMetadata().containsKey("plannedStartDate")) {
                try {
                    plannedStartDateInstant = java.time.Instant.parse(assignment.getMetadata().get("plannedStartDate").toString());
                } catch (Exception ignored) {}
            }
        }

        if (targetDateInstant != null) {
            long daysUntilTarget = java.time.Duration.between(java.time.Instant.now(), targetDateInstant).toDays();
            boolean isNotScheduled = (assignment.getStatusCertification() != com.example.certificationHub.enumeration.StatusCertification.EXAM_SCHEDULED &&
                                      assignment.getStatusCertification() != com.example.certificationHub.enumeration.StatusCertification.COMPLETED);
            if (daysUntilTarget >= 0 && daysUntilTarget <= 7 && isNotScheduled) {
                isNearDeadline = true;
            }
        }

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .itemType(assignment.getItemType() != null ? assignment.getItemType().name() : null)
                .itemId(assignment.getItemId())
                .itemName(itemName)
                .itemCode(itemCode)
                .provider(provider)
                .userId(assignment.getUser() != null ? assignment.getUser().getId() : null)
                .userName(userName)
                .userEmail(userEmail)
                .squadName(squadName)
                .managerId(managerId)
                .managerName(managerName)
                .assignedById(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getId() : null)
                .assignedByName(assignedByName)
                .assignedByRole(assignedByRole)
                .statusCertification(assignment.getStatusCertification() != null
                        ? assignment.getStatusCertification().name() : null)
                .statusTraining(assignment.getStatusTraining() != null
                        ? assignment.getStatusTraining().name() : null)
                .priority(priority)
                .assignedAt(assignment.getAssignedAt())
                .completedAt(assignment.getCompletedAt())
                .plannedStartDate(plannedStartDateInstant)
                .examAt(assignment.getExamAt())
                .targetDate(targetDateInstant)
                .isNearDeadline(isNearDeadline)
                .trainingProgressPercentage(assignment.getTrainingProgressPercentage())
                .notes(assignment.getNotes())
                .build();
    }
}
