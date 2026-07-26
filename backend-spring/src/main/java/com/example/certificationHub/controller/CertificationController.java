package com.example.certificationHub.controller;

import com.example.certificationHub.enumeration.CertifDifficulty;
import com.example.certificationHub.enumeration.CertifPriority;
import com.example.certificationHub.dto.request.CertificationRequest;
import com.example.certificationHub.dto.response.CertificationResponse;
import com.example.certificationHub.service.CertificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/certifications")
@RequiredArgsConstructor
public class CertificationController {

    private final CertificationService certificationService;

    // Protégé par défaut à tout utilisateur connecté (configuré dans
    // SecurityConfig)
    @GetMapping
    public Page<CertificationResponse> getAllCertifications(
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) CertifDifficulty difficulty,
            @RequestParam(required = false) CertifPriority priority,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return certificationService.getCertifications(provider, difficulty, priority, search, pageable);
    }

    @GetMapping("/providers")
    public java.util.List<String> getProviders() {
        return certificationService.getProviders();
    }

    @GetMapping("/{id}")
    public CertificationResponse getCertificationById(@PathVariable UUID id) {
        return certificationService.getCertificationDetails(id);
    }

    // RBAC: Seuls ADMIN et TRAINING_MANAGER peuvent créer, modifier ou supprimer
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public CertificationResponse createCertification(@Valid @RequestBody CertificationRequest request) {
        return certificationService.createCertification(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    public CertificationResponse updateCertification(@PathVariable UUID id,
            @Valid @RequestBody CertificationRequest request) {
        return certificationService.updateCertification(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCertification(@PathVariable UUID id) {
        certificationService.deleteCertification(id);
    }
}
