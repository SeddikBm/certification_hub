package com.example.certificationHub.controller;

import com.example.certificationHub.dto.request.RatingCreateRequest;
import com.example.certificationHub.dto.response.RatingResponse;
import com.example.certificationHub.service.CertificationRatingService;
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
@RequestMapping("/api/v1/certifications/{certId}/ratings")
@RequiredArgsConstructor
public class CertificationRatingController {

    private final CertificationRatingService ratingService;

    // GET - Affichage des avis (Publique aux personnes authentifiées)
    @GetMapping
    public Page<RatingResponse> getRatings(
            @PathVariable UUID certId,
            @PageableDefault(size = 25, sort = "rating") Pageable pageable) {
        return ratingService.getRatings(certId, pageable);
    }

    // POST - Ajouter/Modifier un avis
    @PostMapping
    @PreAuthorize("hasRole('COLLABORATOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public RatingResponse addRating(
            @PathVariable UUID certId,
            @Valid @RequestBody RatingCreateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));

        return ratingService.addRating(certId, request, currentUserId);
    }

    // POST - Signaler un avis (Modération)
    @PostMapping("/{authorId}/report")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void reportRating(
            @PathVariable UUID certId,
            @PathVariable UUID authorId,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));

        ratingService.reportInappropriateRating(certId, authorId, currentUserId);
    }
}