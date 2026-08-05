package com.example.certificationHub.service;

import com.example.certificationHub.dto.response.AiValidationResponse;
import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.Certificate;
import com.example.certificationHub.entity.ManagerAssignment;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.CertificateStatus;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.messaging.AssignmentEvent;
import com.example.certificationHub.messaging.NotificationProducer;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.CertificateRepository;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import com.example.certificationHub.repository.TrainingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateService {

    private final NotificationProducer notificationProducer;
    private final CertificateRepository certificateRepository;
    private final AssignmentRepository assignmentRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;
    private final CertificationRepository certificationRepository;
    private final TrainingRepository trainingRepository;
    private final AiValidationService aiValidationService;

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Impossible de créer le répertoire de stockage des certificats.", ex);
        }
    }

    @Transactional
    public Certificate uploadCertificate(UUID assignmentId, MultipartFile file, UUID currentUserId) {
        // 1. Validation type PDF et taille max (5MB)
        if (file.getContentType() == null || !file.getContentType().equalsIgnoreCase("application/pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seuls les fichiers au format PDF sont autorisés.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La taille du fichier PDF ne doit pas dépasser 5 Mo.");
        }

        // 2. Récupération de l'assignation et validation de propriété
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignation introuvable"));

        if (!assignment.getUser().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous ne pouvez uploader un certificat que pour vos propres assignations.");
        }

        // 3. Sauvegarde du fichier sur le disque
        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName != null && originalFileName.contains(".")
                ? originalFileName.substring(originalFileName.lastIndexOf("."))
                : ".pdf";
        String storedFileName = UUID.randomUUID().toString() + fileExtension;
        Path targetLocation = this.fileStorageLocation.resolve(storedFileName);

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier sur le disque.", ex);
        }

        // 4. Création du Certificate en PENDING_VALIDATION (immédiat)
        Certificate certificate = Certificate.builder()
                .assignment(assignment)
                .user(assignment.getUser())
                .fileName(originalFileName)
                .fileSize((int) file.getSize())
                .storagePath(targetLocation.toString())
                .status(CertificateStatus.PENDING_VALIDATION)
                .build();

        Certificate saved = certificateRepository.save(certificate);

        // 5. Notification d'upload au manager
        String itemName = assignment.getItemType() != null && assignment.getItemType().name().equals("CERTIFICATION")
                ? "votre certification" : "votre formation";
        User targetManager = resolveManager(assignment);
        sendUploadNotification(assignment, targetManager, itemName);

        // 6. Déclencher la validation IA de façon asynchrone
        // Le collaborateur voit PENDING_VALIDATION immédiatement, puis le résultat après que l'IA réponde
        triggerAiValidationAsync(saved.getId(), fileBytes, originalFileName, assignment);

        return saved;
    }

    /**
     * Validation IA asynchrone : s'exécute dans un thread séparé via @Async.
     * Met à jour le statut du certificat une fois que le moteur IA a répondu.
     */
    @Async
    @Transactional
    public void triggerAiValidationAsync(UUID certificateId, byte[] fileBytes, String fileName, Assignment assignment) {
        log.info("[AI-ASYNC] Démarrage validation IA pour certificat={}", certificateId);

        try {
            User user = assignment.getUser();
            String expectedName = ((user.getFirstName() != null ? user.getFirstName() : "")
                    + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();

            String expectedTitle = resolveItemTitle(assignment);

            // Date = completedAt de l'assignment (date exacte qui doit apparaître sur le certificat)
            LocalDate completedAtDate = null;
            if (assignment.getCompletedAt() != null) {
                completedAtDate = assignment.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate();
            } else if (assignment.getAssignedAt() != null) {
                completedAtDate = assignment.getAssignedAt().atZone(ZoneOffset.UTC).toLocalDate();
            }

            // Appel au moteur IA (ce thread est déjà asynchrone)
            long assignmentLongId = assignment.getId().getLeastSignificantBits() & Long.MAX_VALUE;
            AiValidationResponse aiResult = aiValidationService.validate(
                    fileBytes, fileName, assignmentLongId,
                    expectedName, expectedTitle, completedAtDate
            );

            Certificate cert = certificateRepository.findById(certificateId).orElse(null);
            if (cert == null) {
                log.warn("[AI-ASYNC] Certificat {} introuvable post-validation", certificateId);
                return;
            }

            if (aiResult == null) {
                log.warn("[AI-ASYNC] Moteur IA indisponible → certificat {} reste PENDING_VALIDATION", certificateId);
                storeValidationDetails(cert, "PENDING_REVIEW", "NONE", null,
                        List.of("Moteur de validation IA indisponible. Revue manuelle par le Career Manager requise."), null);
                certificateRepository.save(cert);
                return;
            }

            // Mapper décision IA → CertificateStatus
            CertificateStatus newStatus = switch (aiResult.getDecision()) {
                case "APPROVED"  -> CertificateStatus.VALID;
                case "REJECTED"  -> CertificateStatus.REJECTED;
                default          -> CertificateStatus.PENDING_VALIDATION; // PENDING_REVIEW = revue manuelle CM
            };

            cert.setStatus(newStatus);
            storeValidationDetails(cert, aiResult.getDecision(), aiResult.getSource(),
                    aiResult.getScores(), aiResult.getReasons(), aiResult.getExtracted());
            certificateRepository.save(cert);

            log.info("[AI-ASYNC] Certificat {} → status={} (IA decision={})", certificateId, newStatus, aiResult.getDecision());

            sendValidationResultNotification(cert, aiResult, assignment);

        } catch (Exception ex) {
            log.error("[AI-ASYNC] Erreur validation IA certificat {}: {}", certificateId, ex.getMessage(), ex);
        }
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private String resolveItemTitle(Assignment assignment) {
        if (assignment.getItemId() == null || assignment.getItemType() == null) return "";
        if (assignment.getItemType() == ItemType.CERTIFICATION) {
            return certificationRepository.findById(assignment.getItemId())
                    .map(c -> c.getName()).orElse("");
        } else if (assignment.getItemType() == ItemType.TRAINING) {
            return trainingRepository.findById(assignment.getItemId())
                    .map(t -> t.getTitle()).orElse("");
        }
        return "";
    }

    private User resolveManager(Assignment assignment) {
        if (assignment.getAssignedBy() != null
                && !assignment.getAssignedBy().getId().equals(assignment.getUser().getId())) {
            return assignment.getAssignedBy();
        }
        return managerAssignmentRepository.findFirstByCollaboratorId(assignment.getUser().getId())
                .map(ManagerAssignment::getManager).orElse(null);
    }

    private void sendUploadNotification(Assignment assignment, User targetManager, String itemName) {
        if (notificationProducer == null) return;
        try {
            notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                    .userId(assignment.getUser().getId())
                    .userEmail(assignment.getUser().getEmail())
                    .userFullName(assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName())
                    .targetUserId(targetManager != null ? targetManager.getId() : assignment.getUser().getId())
                    .targetUserEmail(targetManager != null ? targetManager.getEmail() : assignment.getUser().getEmail())
                    .targetUserFullName(targetManager != null
                            ? (targetManager.getFirstName() + " " + targetManager.getLastName()) : "")
                    .assignmentId(assignment.getId())
                    .itemName(itemName)
                    .eventType("CERTIFICATE_UPLOADED")
                    .actionUrl("/manage-assignments")
                    .build());
        } catch (Exception e) {
            log.warn("[NOTIF] Upload notification failed: {}", e.getMessage());
        }
    }

    private void sendValidationResultNotification(Certificate cert, AiValidationResponse aiResult, Assignment assignment) {
        if (notificationProducer == null || assignment == null) return;
        try {
            User collab = cert.getUser();
            String eventType = switch (aiResult.getDecision()) {
                case "APPROVED" -> "CERTIFICATE_VALIDATED";
                case "REJECTED" -> "CERTIFICATE_REJECTED";
                default         -> "CERTIFICATE_PENDING_REVIEW";
            };
            notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                    .userId(collab.getId()).userEmail(collab.getEmail())
                    .userFullName(collab.getFirstName() + " " + collab.getLastName())
                    .targetUserId(collab.getId()).targetUserEmail(collab.getEmail())
                    .targetUserFullName(collab.getFirstName() + " " + collab.getLastName())
                    .assignmentId(assignment.getId()).itemName(cert.getFileName())
                    .eventType(eventType).actionUrl("/my-assignments")
                    .build());
        } catch (Exception e) {
            log.warn("[NOTIF] Validation result notification failed: {}", e.getMessage());
        }
    }

    private void storeValidationDetails(Certificate cert, String decision, String source,
                                         AiValidationResponse.AiScores scores, List<String> reasons,
                                         AiValidationResponse.AiExtracted extracted) {
        Map<String, Object> details = new HashMap<>();
        details.put("decision", decision);
        details.put("source", source);
        details.put("reasons", reasons);

        if (scores != null) {
            details.put("scores", Map.of(
                    "name_score", scores.getNameScore(),
                    "title_score", scores.getTitleScore(),
                    "date_score", scores.getDateScore(),
                    "overall_score", scores.getOverallScore()
            ));
        }
        if (extracted != null) {
            details.put("extracted", Map.of(
                    "holder_name", extracted.getHolderName() != null ? extracted.getHolderName() : "",
                    "certification_title", extracted.getCertificationTitle() != null ? extracted.getCertificationTitle() : "",
                    "issue_date", extracted.getIssueDate() != null ? extracted.getIssueDate() : "",
                    "issuer", extracted.getIssuer() != null ? extracted.getIssuer() : ""
            ));
        }
        cert.setValidationDetails(details);
    }

    // ─── Download / Preview / Status update ──────────────────────────────────

    @Transactional(readOnly = true)
    public Resource downloadCertificate(UUID certificateId, UUID currentUserId, String currentUserRole) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificat introuvable"));

        boolean isAdminOrTm = List.of("ADMIN", "TRAINING_MANAGER").contains(currentUserRole);
        boolean isOwner = certificate.getUser().getId().equals(currentUserId);
        boolean isManager = false;

        if ("CAREER_MANAGER".equals(currentUserRole)) {
            isManager = managerAssignmentRepository.existsById(
                    new ManagerAssignment.Id(currentUserId, certificate.getUser().getId()));
        }

        if (!isAdminOrTm && !isOwner && !isManager) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'avez pas l'autorisation de télécharger ce certificat.");
        }

        try {
            Path filePath = Paths.get(certificate.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) return resource;
            throw new ResourceNotFoundException("Fichier introuvable sur le disque ou corrompu.");
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Erreur de chemin d'accès au fichier.", ex);
        }
    }

    @Transactional
    public Certificate updateCertificateStatus(UUID certificateId, CertificateStatus newStatus,
                                                UUID currentUserId, String currentUserRole) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificat introuvable"));

        String cleanRole = currentUserRole != null ? currentUserRole.replace("ROLE_", "").trim() : "";

        boolean isAdminOrTm = List.of("ADMIN", "TRAINING_MANAGER").contains(cleanRole);
        boolean isManager = false;

        if ("CAREER_MANAGER".equals(cleanRole)) {
            boolean isGlobalManager = managerAssignmentRepository.existsById(
                    new ManagerAssignment.Id(currentUserId, certificate.getUser().getId()));
            boolean isAssignedBy = certificate.getAssignment() != null
                    && certificate.getAssignment().getAssignedBy() != null
                    && certificate.getAssignment().getAssignedBy().getId().equals(currentUserId);
            isManager = isGlobalManager || isAssignedBy;
        }

        if (!isAdminOrTm && !isManager) {
            if (!List.of("ADMIN", "TRAINING_MANAGER", "CAREER_MANAGER").contains(cleanRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Seul le Career Manager responsable, un Admin ou Training Manager peut modifier le statut du certificat.");
            }
        }

        certificate.setStatus(newStatus);
        Certificate updated = certificateRepository.save(certificate);

        try {
            if (notificationProducer != null && certificate.getAssignment() != null) {
                User collab = certificate.getUser();
                notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                        .userId(collab.getId()).userEmail(collab.getEmail())
                        .userFullName(collab.getFirstName() + " " + collab.getLastName())
                        .targetUserId(collab.getId()).targetUserEmail(collab.getEmail())
                        .targetUserFullName(collab.getFirstName() + " " + collab.getLastName())
                        .assignmentId(certificate.getAssignment().getId())
                        .itemName(certificate.getFileName())
                        .eventType("CERTIFICATE_STATUS_CHANGED")
                        .actionUrl("/my-assignments")
                        .build());
            }
        } catch (Exception e) {
            log.warn("RabbitMQ notification for status change failed: {}", e.getMessage());
        }

        return updated;
    }
}