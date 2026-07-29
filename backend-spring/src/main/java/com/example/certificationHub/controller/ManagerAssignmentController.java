package com.example.certificationHub.controller;

import com.example.certificationHub.dto.request.ManagerAssignmentRequest;
import com.example.certificationHub.dto.response.AssignedCollaboratorResponse;
import com.example.certificationHub.dto.response.CareerManagerHierarchyResponse;
import com.example.certificationHub.dto.response.ManagerAssignmentResponse;
import com.example.certificationHub.service.ManagerAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/manager-assignments")
@RequiredArgsConstructor
public class ManagerAssignmentController {

    private final ManagerAssignmentService managerAssignmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ManagerAssignmentResponse assignManager(
            @Valid @RequestBody ManagerAssignmentRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID adminId = UUID.fromString(jwt.getClaimAsString("user_id"));

        return managerAssignmentService.assignManager(request, adminId);
    }

    @DeleteMapping("/{managerId}/{collaboratorId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAssignment(
            @PathVariable UUID managerId,
            @PathVariable UUID collaboratorId) {

        managerAssignmentService.removeAssignment(managerId, collaboratorId);
    }

    @GetMapping("/hierarchy")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<CareerManagerHierarchyResponse> getHierarchyOverview(
            @PageableDefault(size = 25, sort = "firstName") Pageable pageable) {
        return managerAssignmentService.getHierarchyOverview(pageable);
    }

    @GetMapping("/{managerId}/collaborators")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAREER_MANAGER', 'TRAINING_MANAGER')")
    public List<AssignedCollaboratorResponse> getAssignedCollaborators(@PathVariable UUID managerId) {
        return managerAssignmentService.getAssignedCollaborators(managerId);
    }

    @GetMapping("/my-managers")
    @PreAuthorize("isAuthenticated()")
    public List<AssignedCollaboratorResponse> getMyManagers(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID userId = UUID.fromString(jwt.getClaimAsString("user_id"));
        return managerAssignmentService.getMyManagers(userId);
    }
}