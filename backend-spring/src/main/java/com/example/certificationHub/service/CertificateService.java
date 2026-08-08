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
import com.example.certificationHub.repository.UserRepository;
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
import java.time.Instant;
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
    private final UserRepository userRepository;
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
        // 1. Validation format (PDF ou Image) et taille max (5MB)
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        boolean isValidFormat = contentType.equals("application/pdf")
                || contentType.startsWith("image/");
        if (!isValidFormat) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seuls les fichiers au format PDF et Image (PNG, JPG, JPEG) sont autorisés.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La taille du fichier ne doit pas dépasser 5 Mo.");
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

        // Si completedAt n'est pas renseigné, enregistrer la date de complétion
        if (assignment.getCompletedAt() == null) {
            assignment.setCompletedAt(Instant.now());
            assignmentRepository.save(assignment);
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

        // 5. Notification d'upload au manager responsable
        String itemName = resolveItemTitle(assignment);
        if (itemName == null || itemName.isBlank()) itemName = "votre parcours";
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

            // Date = completedAt uniquement de l'assignment
            LocalDate completedAtDate = null;
            if (assignment.getCompletedAt() != null) {
                completedAtDate = assignment.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate();
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
        if (assignment == null || assignment.getItemId() == null || assignment.getItemType() == null) return "";
        if (assignment.getItemType() == ItemType.CERTIFICATION) {
            return certificationRepository.findById(assignment.getItemId())
                    .map(c -> c.getName()).orElse("");
        } else if (assignment.getItemType() == ItemType.TRAINING) {
            return trainingRepository.findById(assignment.getItemId())
                    .map(t -> t.getTitle()).orElse("");
        }
        return "";
    }

    /**
     * Résout le Manager / Career Manager responsable d'une assignation :
     * 1. Priorité 1 : Le CM/Admin qui a créé l'assignation (`assignedBy`), s'il s'agit d'un tiers.
     * 2. Priorité 2 : Le CM sélectionné par le collaborateur dans les métadonnées (`targetManagerId`).
     * 3. Priorité 3 : Fallback vers le manager rattaché au collaborateur dans `manager_assignments`.
     */
    private User resolveManager(Assignment assignment) {
        if (assignment == null || assignment.getUser() == null) {
            return null;
        }

        // 1. Priorité 1 : Le manager qui a créé/attribué l'assignation (assignedBy)
        if (assignment.getAssignedBy() != null
                && !assignment.getAssignedBy().getId().equals(assignment.getUser().getId())) {
            return assignment.getAssignedBy();
        }

        // 2. Priorité 2 : Le CM explicitement sélectionné dans les métadonnées (targetManagerId)
        if (assignment.getMetadata() != null && assignment.getMetadata().containsKey("targetManagerId")) {
            try {
                Object tmObj = assignment.getMetadata().get("targetManagerId");
                if (tmObj != null && !tmObj.toString().isBlank()) {
                    UUID tmId = UUID.fromString(tmObj.toString());
                    User tm = userRepository.findById(tmId).orElse(null);
                    if (tm != null) {
                        return tm;
                    }
                }
            } catch (Exception ignored) {}
        }

        // 3. Priorité 3 : Fallback vers le manager assigné dans manager_assignments
        return managerAssignmentRepository.findFirstByCollaboratorId(assignment.getUser().getId())
                .map(ManagerAssignment::getManager)
                .orElse(null);
    }


    private void sendUploadNotification(Assignment assignment, User targetManager, String itemName) {
        if (notificationProducer == null || assignment == null) return;
        try {
            User collab = assignment.getUser();
            User recipient = targetManager != null ? targetManager : collab;

            notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                    .userId(collab.getId())
                    .userEmail(collab.getEmail())
                    .userFullName((collab.getFirstName() != null ? collab.getFirstName() : "") + " " + (collab.getLastName() != null ? collab.getLastName() : ""))
                    .targetUserId(recipient.getId())
                    .targetUserEmail(recipient.getEmail())
                    .targetUserFullName((recipient.getFirstName() != null ? recipient.getFirstName() : "") + " " + (recipient.getLastName() != null ? recipient.getLastName() : ""))
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
            User targetManager = resolveManager(assignment);
            User recipient = targetManager != null ? targetManager : collab;

            String eventType = switch (aiResult.getDecision()) {
                case "APPROVED" -> "CERTIFICATE_VALIDATED";
                case "REJECTED" -> "CERTIFICATE_REJECTED";
                default         -> "CERTIFICATE_PENDING_REVIEW";
            };

            String itemName = resolveItemTitle(assignment);
            if (itemName == null || itemName.isBlank()) itemName = cert.getFileName();

            String detailsMsg = null;
            if ("REJECTED".equalsIgnoreCase(aiResult.getDecision()) && aiResult.getReasons() != null && !aiResult.getReasons().isEmpty()) {
                detailsMsg = String.join(" ; ", aiResult.getReasons());
            }

            notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                    .userId(collab.getId())
                    .userEmail(collab.getEmail())
                    .userFullName((collab.getFirstName() != null ? collab.getFirstName() : "") + " " + (collab.getLastName() != null ? collab.getLastName() : ""))
                    .targetUserId(recipient.getId())
                    .targetUserEmail(recipient.getEmail())
                    .targetUserFullName((recipient.getFirstName() != null ? recipient.getFirstName() : "") + " " + (recipient.getLastName() != null ? recipient.getLastName() : ""))
                    .assignmentId(assignment.getId())
                    .itemName(itemName)
                    .eventType(eventType)
                    .details(detailsMsg)
                    .actionUrl("/manage-assignments")
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

    public boolean isAuthorizedToManageAssignment(Assignment assignment, UUID currentUserId) {
        if (assignment == null || currentUserId == null) return false;

        // 1. Assigné directement par cet utilisateur (Admin, TM ou CM qui a créé l'assignation)
        if (assignment.getAssignedBy() != null && assignment.getAssignedBy().getId().equals(currentUserId)) {
            return true;
        }

        // 2. CM cible sélectionné lors d'une auto-demande par le collaborateur
        if (assignment.getMetadata() != null && assignment.getMetadata().containsKey("targetManagerId")) {
            try {
                Object tmObj = assignment.getMetadata().get("targetManagerId");
                if (tmObj != null && currentUserId.toString().equalsIgnoreCase(tmObj.toString())) {
                    return true;
                }
            } catch (Exception ignored) {}
        }

        // 3. CM du collaborateur dans manager_assignments
        if (assignment.getUser() != null) {
            boolean isDirectManager = managerAssignmentRepository.existsById(
                    new ManagerAssignment.Id(currentUserId, assignment.getUser().getId()));
            if (isDirectManager) return true;
        }

        return false;
    }

    private Certificate findCertificate(UUID idOrAssignmentId) {
        Certificate cert = certificateRepository.findById(idOrAssignmentId).orElse(null);
        if (cert == null) {
            List<Certificate> certs = certificateRepository.findByAssignmentId(idOrAssignmentId);
            if (certs != null && !certs.isEmpty()) {
                cert = certs.get(certs.size() - 1);
            }
        }
        if (cert == null) {
            throw new ResourceNotFoundException("Certificat introuvable pour l'identifiant fourni.");
        }
        return cert;
    }

    // ─── Download / Preview / Status update ──────────────────────────────────

    @Transactional(readOnly = true)
    public Resource downloadCertificate(UUID certificateId, UUID currentUserId, String currentUserRole) {
        Certificate certificate = findCertificate(certificateId);

        boolean isOwner = certificate.getUser() != null && certificate.getUser().getId().equals(currentUserId);
        boolean isAuthorizedManager = isAuthorizedToManageAssignment(certificate.getAssignment(), currentUserId);
        boolean isAdminOrTM = "ADMIN".equalsIgnoreCase(currentUserRole) || "TRAINING_MANAGER".equalsIgnoreCase(currentUserRole);

        if (!isOwner && !isAuthorizedManager && !isAdminOrTM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Accès refusé : Vous ne gérez pas cette assignation et ne pouvez pas consulter ou télécharger ce certificat.");
        }

        try {
            String rawPath = certificate.getStoragePath();
            String cleanFileName = rawPath;
            if (cleanFileName != null) {
                int lastSlash = Math.max(cleanFileName.lastIndexOf('/'), cleanFileName.lastIndexOf('\\'));
                if (lastSlash >= 0) {
                    cleanFileName = cleanFileName.substring(lastSlash + 1);
                }
            }

            Path[] candidatePaths = new Path[] {
                this.fileStorageLocation.resolve(cleanFileName).toAbsolutePath().normalize(),
                Paths.get("./uploads/certificates").resolve(cleanFileName).toAbsolutePath().normalize(),
                Paths.get("uploads/certificates").resolve(cleanFileName).toAbsolutePath().normalize(),
                Paths.get("/app/uploads/certificates").resolve(cleanFileName).toAbsolutePath().normalize(),
                Paths.get(rawPath).toAbsolutePath().normalize()
            };

            Path validPath = null;
            for (Path path : candidatePaths) {
                if (Files.exists(path) && Files.isReadable(path)) {
                    validPath = path;
                    break;
                }
            }


            if (validPath == null) {
                log.error("[DOWNLOAD] Fichier introuvable sur le disque pour le certificat {}: path={}", certificateId, certificate.getStoragePath());
                throw new ResourceNotFoundException("Fichier introuvable sur le disque.");
            }

            Resource resource = new UrlResource(validPath.toUri());
            if (resource.exists() && resource.isReadable()) return resource;
            throw new ResourceNotFoundException("Fichier introuvable sur le disque ou corrompu.");
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Erreur de chemin d'accès au fichier.", ex);
        }
    }

    @Transactional
    public Certificate updateCertificateStatus(UUID certificateId, CertificateStatus newStatus,
                                                UUID currentUserId, String currentUserRole) {
        Certificate certificate = findCertificate(certificateId);

        boolean isAuthorizedManager = isAuthorizedToManageAssignment(certificate.getAssignment(), currentUserId);
        boolean isAdminOrTM = "ADMIN".equalsIgnoreCase(currentUserRole) || "TRAINING_MANAGER".equalsIgnoreCase(currentUserRole);

        if (!isAuthorizedManager && !isAdminOrTM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Accès refusé : Seul le manager responsable (ou Admin/TM) peut modifier le statut de ce certificat.");
        }


        certificate.setStatus(newStatus);

        // Quand le statut est modifié manuellement par un responsable, on passe source = 'MANUAL'
        // afin que l'icône IA disparaisse de l'interface
        Map<String, Object> details = certificate.getValidationDetails();
        if (details == null) {
            details = new HashMap<>();
        } else {
            details = new HashMap<>(details);
        }
        details.put("source", "MANUAL");
        details.put("decision", newStatus.name());
        certificate.setValidationDetails(details);

        Certificate updated = certificateRepository.save(certificate);

        try {
            if (notificationProducer != null && certificate.getAssignment() != null) {
                User collab = certificate.getUser();
                String itemTitle = resolveItemTitle(certificate.getAssignment());
                notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                        .userId(collab.getId()).userEmail(collab.getEmail())
                        .userFullName(collab.getFirstName() + " " + collab.getLastName())
                        .targetUserId(collab.getId()).targetUserEmail(collab.getEmail())
                        .targetUserFullName(collab.getFirstName() + " " + collab.getLastName())
                        .assignmentId(certificate.getAssignment().getId())
                        .itemName(!itemTitle.isBlank() ? itemTitle : certificate.getFileName())
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