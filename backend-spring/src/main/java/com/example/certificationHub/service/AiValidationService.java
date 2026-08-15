package com.example.certificationHub.service;

import com.example.certificationHub.dto.response.AiValidationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDate;

/**
 * Appelle le moteur de validation IA (FastAPI backend-ai) via WebClient.
 *
 * Endpoint ciblé : POST /api/v1/validate (multipart/form-data)
 * Champs : file, assignment_id, expected_name, expected_certification_title,
 * expected_not_before
 *
 * Logique de comparaison dans l'IA :
 * - Nom : fuzzy (token_sort_ratio via rapidfuzz) — tolère les variations OCR
 * - Titre : comparaison stricte après normalisation (accent/casse/ponctuation)
 * - Date : comparaison exacte avec la date de complétion de l'assignment
 */
@Slf4j
@Service
public class AiValidationService {

    private final WebClient webClient;
    private final boolean enabled;

    public AiValidationService(
            @Value("${app.ai-validation.url:http://localhost:8000}") String aiBaseUrl,
            @Value("${app.ai-validation.api-key:change-me}") String apiKey,
            @Value("${app.ai-validation.enabled:true}") boolean enabled,
            WebClient.Builder webClientBuilder) {

        this.enabled = enabled;
        this.webClient = webClientBuilder
                .baseUrl(aiBaseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Envoie le fichier PDF + les infos attendues au moteur IA et retourne le
     * résultat.
     *
     * @param fileBytes       contenu binaire du PDF
     * @param fileName        nom du fichier (ex: "certificat.pdf")
     * @param assignmentId    ID de l'assignation Spring Boot (long pour
     *                        compatibilité FastAPI)
     * @param expectedName    nom complet du collaborateur (prénom + nom)
     * @param expectedTitle   titre exact de la certification (ex: "AZ-204")
     * @param completedAtDate date de complétion de l'assignment = date attendue sur
     *                        le certificat
     * @return AiValidationResponse ou null en cas d'erreur réseau/service
     */
    public AiValidationResponse validate(
            byte[] fileBytes,
            String fileName,
            long assignmentId,
            String expectedName,
            String expectedTitle,
            LocalDate completedAtDate) {

        if (!enabled) {
            log.info("[AI] Validation désactivée (AI_VALIDATION_ENABLED=false). Skipping.");
            return null;
        }

        log.info("[AI] Envoi de la validation au moteur IA — assignment={} name={} title={} date={}",
                assignmentId, expectedName, expectedTitle, completedAtDate);

        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();

            // Fichier (PDF ou Image) - Content-Type dynamique selon l'extension
            String lowerName = fileName != null ? fileName.toLowerCase() : "";
            MediaType fileMediaType = MediaType.APPLICATION_PDF;
            if (lowerName.endsWith(".png")) {
                fileMediaType = MediaType.IMAGE_PNG;
            } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
                fileMediaType = MediaType.IMAGE_JPEG;
            } else if (lowerName.endsWith(".webp")) {
                fileMediaType = MediaType.parseMediaType("image/webp");
            }

            builder.part("file", new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return fileName != null ? fileName : "certificate.pdf";
                }
            }).contentType(fileMediaType);

            // Champs de formulaire
            builder.part("assignment_id", String.valueOf(assignmentId));
            builder.part("expected_name", expectedName != null ? expectedName : "");
            builder.part("expected_certification_title", expectedTitle != null ? expectedTitle : "");
            if (completedAtDate != null) {
                builder.part("expected_date", completedAtDate.toString()); // YYYY-MM-DD
            }


            AiValidationResponse response = webClient.post()
                    .uri("/api/v1/validate")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(body -> new RuntimeException(
                                            "[AI] Erreur HTTP " + clientResponse.statusCode() + ": " + body)))
                    .bodyToMono(AiValidationResponse.class)
                    .timeout(Duration.ofSeconds(120)) // PaddleOCR peut être lent au premier appel
                    .block();

            if (response != null) {
                log.info("[AI] Résultat reçu — decision={} source={} nameScore={} overallScore={}",
                        response.getDecision(),
                        response.getSource(),
                        response.getScores() != null ? response.getScores().getNameScore() : "N/A",
                        response.getScores() != null ? response.getScores().getOverallScore() : "N/A");
            }

            return response;

        } catch (Exception ex) {
            log.error("[AI] Erreur lors de l'appel au moteur de validation IA (assignment={}): {}",
                    assignmentId, ex.getMessage());
            return null; // Dégradation gracieuse : le certificat restera PENDING_VALIDATION
        }
    }
}
