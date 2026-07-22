package com.example.certificationHub.mapper;

import com.example.certificationHub.dto.response.AssignmentResponse;
import com.example.certificationHub.entity.Assignment;
import org.springframework.stereotype.Component;

@Component
public class AssignmentMapper {

    public AssignmentResponse toResponse(Assignment assignment) {
        if (assignment == null) return null;

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .itemType(assignment.getItemType() != null ? assignment.getItemType().name() : null)
                .itemId(assignment.getItemId())
                .userId(assignment.getUser() != null ? assignment.getUser().getId() : null)
                .userName(assignment.getUser() != null
                        ? assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName()
                        : null)
                .assignedById(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getId() : null)
                .statusCertification(assignment.getStatusCertification() != null
                        ? assignment.getStatusCertification().name() : null)
                .statusTraining(assignment.getStatusTraining() != null
                        ? assignment.getStatusTraining().name() : null)
                .assignedAt(assignment.getAssignedAt())
                .completedAt(assignment.getCompletedAt())
                .examAt(assignment.getExamAt())
                .trainingProgressPercentage(assignment.getTrainingProgressPercentage())
                .notes(assignment.getNotes())
                .build();
    }
}
