package com.example.certificationHub.service;

import com.example.certificationHub.entity.ManagerAssignment;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.UserRole;
import com.example.certificationHub.dto.response.AssignedCollaboratorResponse;
import com.example.certificationHub.dto.response.CareerManagerHierarchyResponse;
import com.example.certificationHub.dto.request.ManagerAssignmentRequest;
import com.example.certificationHub.dto.response.ManagerAssignmentResponse;
import com.example.certificationHub.exception.ResourceConflictException;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.mapper.ManagerAssignmentMapper;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import com.example.certificationHub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ManagerAssignmentService {

    private final ManagerAssignmentRepository managerAssignmentRepository;
    private final UserRepository userRepository;
    private final ManagerAssignmentMapper mapper; // Injection du mapper

    @Transactional(readOnly = true)
    public Page<CareerManagerHierarchyResponse> getHierarchyOverview(Pageable pageable) {
        return managerAssignmentRepository.getHierarchyOverview(pageable);
    }

    @Transactional(readOnly = true)
    public List<AssignedCollaboratorResponse> getAssignedCollaborators(UUID managerId) {
        if (!userRepository.existsById(managerId)) {
            throw new ResourceNotFoundException("Manager introuvable");
        }
        return managerAssignmentRepository.getCollaboratorsByManagerId(managerId);
    }

    @Transactional
    public ManagerAssignmentResponse assignManager(ManagerAssignmentRequest request, UUID adminId) {
        ManagerAssignment.Id id = new ManagerAssignment.Id(request.getManagerId(), request.getCollaboratorId());

        if (managerAssignmentRepository.existsById(id)) {
            throw new ResourceConflictException("Ce collaborateur est déjà assigné à ce Career Manager.");
        }

        User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new ResourceNotFoundException("Career Manager introuvable."));

        if (manager.getRole() != UserRole.CAREER_MANAGER) {
            throw new ResourceConflictException(
                    "L'utilisateur désigné comme manager doit avoir le rôle CAREER_MANAGER.");
        }

        User collaborator = userRepository.findById(request.getCollaboratorId())
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur introuvable."));

        if (collaborator.getRole() != UserRole.COLLABORATOR) {
            throw new ResourceConflictException("L'utilisateur assigné doit avoir le rôle COLLABORATOR.");
        }

        User assignedBy = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur introuvable."));

        ManagerAssignment assignment = ManagerAssignment.builder()
                .id(id)
                .manager(manager)
                .collaborator(collaborator)
                .assignedBy(assignedBy)
                .build();

        ManagerAssignment savedAssignment = managerAssignmentRepository.save(assignment);

        // Appel propre au mapper
        return mapper.toResponse(savedAssignment);
    }

    @Transactional
    public void removeAssignment(UUID managerId, UUID collaboratorId) {
        ManagerAssignment.Id id = new ManagerAssignment.Id(managerId, collaboratorId);

        if (!managerAssignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cette assignation n'existe pas.");
        }

        managerAssignmentRepository.deleteById(id);
    }
}