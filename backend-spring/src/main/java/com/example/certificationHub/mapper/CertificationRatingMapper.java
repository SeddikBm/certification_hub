package com.example.certificationHub.mapper;

import com.example.certificationHub.dto.request.RatingCreateRequest;
import com.example.certificationHub.dto.response.RatingResponse;
import com.example.certificationHub.entity.CertificationRating;
import org.springframework.stereotype.Component;

@Component
public class CertificationRatingMapper {

    public RatingResponse toResponse(CertificationRating rating) {
        if (rating == null) return null;

        String rawComment = rating.getComment();
        String cleanComment = rawComment;
        Integer difficulty = null;
        Integer materialsQuality = null;
        Integer usefulness = null;

        if (rawComment != null && rawComment.contains("\n---\n")) {
            String[] parts = rawComment.split("\n---\n", 2);
            cleanComment = parts[0].trim().isEmpty() ? null : parts[0].trim();
            String details = parts[1];

            for (String line : details.split("\n")) {
                line = line.trim();
                if (line.startsWith("Difficulté :")) {
                    try {
                        String val = line.replace("Difficulté :", "").replace("/5", "").trim();
                        difficulty = Integer.parseInt(val);
                    } catch (Exception ignored) {}
                } else if (line.startsWith("Qualité des supports :")) {
                    try {
                        String val = line.replace("Qualité des supports :", "").replace("/5", "").trim();
                        materialsQuality = Integer.parseInt(val);
                    } catch (Exception ignored) {}
                } else if (line.startsWith("Utilité :")) {
                    try {
                        String val = line.replace("Utilité :", "").replace("/5", "").trim();
                        usefulness = Integer.parseInt(val);
                    } catch (Exception ignored) {}
                }
            }
        }

        return RatingResponse.builder()
                .userId(rating.getUser() != null ? rating.getUser().getId() : null)
                .userFullName(rating.getUser() != null
                        ? rating.getUser().getFirstName() + " " + rating.getUser().getLastName()
                        : null)
                .certificationId(rating.getCertification() != null ? rating.getCertification().getId() : null)
                .rating(rating.getRating())
                .comment(cleanComment)
                .wouldRecommend(rating.getWouldRecommend())
                .materialsQuality(materialsQuality)
                .difficulty(difficulty)
                .usefulness(usefulness)
                .squadName(rating.getUser() != null && rating.getUser().getSquad() != null ? rating.getUser().getSquad().getName() : null)
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
