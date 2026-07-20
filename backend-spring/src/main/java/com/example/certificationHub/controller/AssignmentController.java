package com.example.certificationHub.controller;

import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.dto.request.AssignmentCreateRequest;
import com.example.certificationHub.dto.response.AssignmentResponse;
import com.example.certificationHub.dto.request.AssignmentUpdateRequest;
import com.example.certificationHub.service.AssignmentService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    public Page<AssignmentResponse> getAssignments(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) ItemType itemType,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 25, sort = "assignedAt") Pageable pageable,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));
        String currentUserRole = jwt.getClaimAsString("role");

        return assignmentService.getAssignments(userId, itemType, status, pageable, currentUserId, currentUserRole);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CAREER_MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public AssignmentResponse createAssignment(
            @Valid @RequestBody AssignmentCreateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));
        String currentUserRole = jwt.getClaimAsString("role");

        return assignmentService.createAssignment(request, currentUserId, currentUserRole);
    }

    @PutMapping("/{id}")
    public AssignmentResponse updateAssignment(
            @PathVariable UUID id,
            @Valid @RequestBody AssignmentUpdateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));
        String currentUserRole = jwt.getClaimAsString("role");

        return assignmentService.updateAssignmentStatus(id, request, currentUserId, currentUserRole);
    }
}