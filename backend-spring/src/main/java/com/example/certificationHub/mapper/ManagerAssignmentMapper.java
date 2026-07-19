package com.example.certificationHub.mapper;

import org.springframework.stereotype.Component;

import com.example.certificationHub.dto.response.ManagerAssignmentResponse;
import com.example.certificationHub.entity.ManagerAssignment;

@Component
public class ManagerAssignmentMapper {

    public ManagerAssignmentResponse toResponse(ManagerAssignment assignment) {
        if (assignment == null) {
            return null;
        }

        return ManagerAssignmentResponse.builder()
                .managerId(assignment.getManager().getId())
                .managerName(assignment.getManager().getFirstName() + " " + assignment.getManager().getLastName())
                .collaboratorId(assignment.getCollaborator().getId())
                .collaboratorName(
                        assignment.getCollaborator().getFirstName() + " " + assignment.getCollaborator().getLastName())
                .assignedById(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getId() : null)
                .build();
    }
}