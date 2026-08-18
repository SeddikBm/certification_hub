package com.example.certificationHub.service;

import com.example.certificationHub.dto.request.ChatMessageRequestDto;
import com.example.certificationHub.dto.response.ChatMessageResponseDto;
import com.example.certificationHub.dto.response.UserResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class ChatService {

    private final WebClient webClient;
    private final boolean enabled;
    private final UserService userService;

    public ChatService(
            @Value("${app.ai-validation.url:http://localhost:8000}") String aiBaseUrl,
            @Value("${app.ai-validation.api-key:certifhub-internal-key-2026}") String apiKey,
            @Value("${app.ai-validation.enabled:true}") boolean enabled,
            WebClient.Builder webClientBuilder,
            UserService userService) {

        this.enabled = enabled;
        this.userService = userService;
        this.webClient = webClientBuilder
                .baseUrl(aiBaseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public ChatMessageResponseDto processChat(ChatMessageRequestDto request, UUID currentUserId, String userRole) {
        if (!enabled) {
            log.warn("[CHAT] Le service IA est désactivé.");
            return ChatMessageResponseDto.builder()
                    .response("L'assistant IA est temporairement indisponible. Veuillez réessayer plus tard.")
                    .suggestedActions(List.of("Consulter le catalogue des certifications"))
                    .build();
        }

        UserResponse user = null;
        try {
            user = userService.getUserById(currentUserId);
        } catch (Exception e) {
            log.warn("[CHAT] Impossible de récupérer les informations de l'utilisateur {}: {}", currentUserId, e.getMessage());
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("history", request.getHistory());
        payload.put("user_id", currentUserId.toString());
        payload.put("user_role", userRole != null ? userRole : (user != null && user.getRole() != null ? user.getRole().name() : "COLLABORATOR"));
        
        if (user != null) {
            if (user.getSquadId() != null) {
                payload.put("squad_id", user.getSquadId().toString());
            }
            String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " " + 
                               (user.getLastName() != null ? user.getLastName() : "")).trim();
            if (!fullName.isBlank()) {
                payload.put("user_name", fullName);
            }
        }

        if (request.getCertificationId() != null) {
            payload.put("certification_id", request.getCertificationId().toString());
        }

        try {
            log.info("[CHAT] Envoi requête IA pour utilisateur {} (squad={})", currentUserId, payload.get("squad_id"));
            ChatMessageResponseDto result = webClient.post()
                    .uri("/api/v1/chat")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(ChatMessageResponseDto.class)
                    .timeout(Duration.ofSeconds(60))
                    .block();

            if (result != null) {
                if (result.getResponse() == null || result.getResponse().isBlank()) {
                    result.setResponse("Voici les informations trouvées pour votre demande.");
                }
                if (result.getSuggestedActions() == null || result.getSuggestedActions().isEmpty()) {
                    result.setSuggestedActions(List.of("Quel est le format de l'examen PSM I ?", "Quelles certifications prioritaires pour ma squad ?"));
                }
                if (result.getSources() == null) {
                    result.setSources(List.of());
                }
                if (result.getLatencyMs() == null) {
                    result.setLatencyMs(0L);
                }
                return result;
            }

            throw new IllegalStateException("Réponse vide reçue du moteur IA");
        } catch (Exception e) {
            log.error("[CHAT] Erreur lors de l'appel au moteur IA backend-ai: {}", e.getMessage(), e);
            return ChatMessageResponseDto.builder()
                    .response("Désolé, une erreur est survenue lors de la communication avec le moteur d'assistance IA. Veuillez réessayer dans quelques instants.")
                    .error(e.getMessage())
                    .suggestedActions(List.of("Quel est le format de l'examen PSM I ?", "Quelles certifs pour ma squad ?"))
                    .build();
        }
    }
}
