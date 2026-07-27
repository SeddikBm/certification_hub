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
        String provider = null;

        if (assignment.getItemType() == ItemType.CERTIFICATION && assignment.getItemId() != null) {
            var cert = certificationRepository.findById(assignment.getItemId()).orElse(null);
            if (cert != null) {
                itemName = cert.getName();
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

            var ma = managerAssignmentRepository.findByCollaboratorId(assignment.getUser().getId()).orElse(null);
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

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .itemType(assignment.getItemType() != null ? assignment.getItemType().name() : null)
                .itemId(assignment.getItemId())
                .itemName(itemName)
                .provider(provider)
                .userId(assignment.getUser() != null ? assignment.getUser().getId() : null)
                .userName(userName)
                .userEmail(userEmail)
                .squadName(squadName)
                .managerName(managerName)
                .assignedById(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getId() : null)
                .statusCertification(assignment.getStatusCertification() != null
                        ? assignment.getStatusCertification().name() : null)
                .statusTraining(assignment.getStatusTraining() != null
                        ? assignment.getStatusTraining().name() : null)
                .priority(priority)
                .assignedAt(assignment.getAssignedAt())
                .completedAt(assignment.getCompletedAt())
                .examAt(assignment.getExamAt())
                .trainingProgressPercentage(assignment.getTrainingProgressPercentage())
                .notes(assignment.getNotes())
                .build();
    }
}
