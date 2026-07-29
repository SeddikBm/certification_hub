package com.example.certificationHub.mapper;

import com.example.certificationHub.dto.response.AssignmentResponse;
import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import com.example.certificationHub.repository.TrainingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AssignmentMapper {

    private final CertificationRepository certificationRepository;
    private final TrainingRepository trainingRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;

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
        String managerName = null;

        if (assignment.getUser() != null) {
            userName = assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName();
            userEmail = assignment.getUser().getEmail();
            if (assignment.getUser().getSquad() != null) {
                squadName = assignment.getUser().getSquad().getName();
            }

            var ma = managerAssignmentRepository.findFirstByCollaboratorId(assignment.getUser().getId()).orElse(null);
            if (ma != null && ma.getManager() != null) {
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
        Boolean isNearDeadline = false;
        if (assignment.getMetadata() != null && assignment.getMetadata().containsKey("targetDate")) {
            try {
                targetDateInstant = java.time.Instant.parse(assignment.getMetadata().get("targetDate").toString());
            } catch (Exception ignored) {}
        }
        if (targetDateInstant == null && assignment.getExamAt() != null &&
            (assignment.getStatusCertification() == com.example.certificationHub.enumeration.StatusCertification.APPROVED ||
             assignment.getStatusCertification() == com.example.certificationHub.enumeration.StatusCertification.IN_PROGRESS ||
             assignment.getStatusCertification() == com.example.certificationHub.enumeration.StatusCertification.PLANNED)) {
            targetDateInstant = assignment.getExamAt();
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
                .examAt(assignment.getExamAt())
                .targetDate(targetDateInstant)
                .isNearDeadline(isNearDeadline)
                .trainingProgressPercentage(assignment.getTrainingProgressPercentage())
                .notes(assignment.getNotes())
                .build();
    }
}
