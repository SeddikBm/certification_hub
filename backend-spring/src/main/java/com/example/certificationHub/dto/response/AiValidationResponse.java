package com.example.certificationHub.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Mappe la réponse JSON du moteur IA (FastAPI backend-ai) :
 * POST /api/v1/validate → ValidationResponse
 *
 * Exemple de réponse :
 * {
 *   "assignment_id": 42,
 *   "decision": "APPROVED" | "REJECTED" | "PENDING_REVIEW",
 *   "source": "WEB_VERIFIED" | "TEXT_ONLY" | "NONE",
 *   "scores": { "name_score": 0.96, "title_score": 1.0, "date_score": 1.0, "overall_score": 0.976 },
 *   "extracted": { "holder_name": "...", "certification_title": "...", "issue_date": "...", "issuer": "..." },
 *   "detected_urls": ["https://credly.com/..."],
 *   "reasons": ["..."],
 *   "requires_manual_review": false
 * }
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiValidationResponse {

    @JsonProperty("assignment_id")
    private Long assignmentId;

    /** APPROVED | REJECTED | PENDING_REVIEW */
    private String decision;

    /** WEB_VERIFIED | TEXT_ONLY | NONE */
    private String source;

    private AiScores scores;

    private AiExtracted extracted;

    @JsonProperty("detected_urls")
    private List<String> detectedUrls;

    private List<String> reasons;

    @JsonProperty("requires_manual_review")
    private boolean requiresManualReview;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiScores {
        @JsonProperty("name_score")
        private Double nameScore;

        @JsonProperty("title_score")
        private Double titleScore;

        @JsonProperty("date_score")
        private Double dateScore;

        @JsonProperty("overall_score")
        private Double overallScore;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiExtracted {
        @JsonProperty("holder_name")
        private String holderName;

        @JsonProperty("certification_title")
        private String certificationTitle;

        @JsonProperty("issue_date")
        private String issueDate;

        private String issuer;
    }
}
