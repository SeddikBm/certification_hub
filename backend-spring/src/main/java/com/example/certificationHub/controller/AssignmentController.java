package com.example.certificationHub.controller;

import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.dto.request.AssignmentCreateRequest;
import com.example.certificationHub.dto.response.AssignmentResponse;
import com.example.certificationHub.dto.request.AssignmentUpdateRequest;
import com.example.certificationHub.service.AssignmentService;
import com.example.certificationHub.service.CertificateService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final CertificateService certificateService;
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

    @GetMapping("/my")
    public Page<AssignmentResponse> getMyAssignments(
            @RequestParam(required = false) ItemType itemType,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 25, sort = "assignedAt") Pageable pageable,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));
        String currentUserRole = jwt.getClaimAsString("role");

        // Force targetUserId to currentUserId to get only their own assignments
        return assignmentService.getAssignments(currentUserId, itemType, status, pageable, currentUserId,
                currentUserRole);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'COLLABORATOR')")
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

    @PostMapping(value = "/{id}/upload-certificate", consumes = { "multipart/form-data" })
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    public void uploadCertificate(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));

        certificateService.uploadCertificate(id, file, currentUserId);
    }
}