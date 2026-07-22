package com.example.certificationHub.mapper;

import com.example.certificationHub.dto.request.RatingCreateRequest;
import com.example.certificationHub.dto.response.RatingResponse;
import com.example.certificationHub.entity.CertificationRating;
import org.springframework.stereotype.Component;

@Component
public class CertificationRatingMapper {

    public RatingResponse toResponse(CertificationRating rating) {
        if (rating == null) return null;

        return RatingResponse.builder()
                .userId(rating.getUser() != null ? rating.getUser().getId() : null)
                .userFullName(rating.getUser() != null
                        ? rating.getUser().getFirstName() + " " + rating.getUser().getLastName()
                        : null)
                .certificationId(rating.getCertification() != null ? rating.getCertification().getId() : null)
                .rating(rating.getRating())
                .comment(rating.getComment())
                .wouldRecommend(rating.getWouldRecommend())
                .build();
    }

    /**
     * Formate le commentaire en ajoutant les détails structurés (difficulté d'examen, temps de préparation)
     * dans le texte du commentaire pour un stockage enrichi.
     */
    public String formatCommentWithDetails(RatingCreateRequest request) {
        StringBuilder sb = new StringBuilder();

        if (request.getComment() != null && !request.getComment().isBlank()) {
            sb.append(request.getComment());
        }

        // Ajout des métadonnées structurées au commentaire
        if (request.getDifficulty() != null || request.getMaterialsQuality() != null || request.getUsefulness() != null) {
            sb.append("\n---\n");
            if (request.getDifficulty() != null) {
                sb.append("Difficulté : ").append(request.getDifficulty()).append("/5\n");
            }
            if (request.getMaterialsQuality() != null) {
                sb.append("Qualité des supports : ").append(request.getMaterialsQuality()).append("/5\n");
            }
            if (request.getUsefulness() != null) {
                sb.append("Utilité : ").append(request.getUsefulness()).append("/5\n");
            }
        }

        return sb.toString().trim().isEmpty() ? null : sb.toString().trim();
    }
}
