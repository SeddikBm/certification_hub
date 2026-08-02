package com.example.certificationHub.service;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.Certificate;
import com.example.certificationHub.entity.ManagerAssignment;
import com.example.certificationHub.enumeration.CertificateStatus;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.messaging.AssignmentEvent;
import com.example.certificationHub.messaging.NotificationProducer;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.CertificateRepository;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);

    private final NotificationProducer notificationProducer;
    private final CertificateRepository certificateRepository;
    private final AssignmentRepository assignmentRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;

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
        // 1. Validation du type PDF et de la taille maximale (5MB)
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

        // 3. Traitement du fichier physique (Stockage Local)
        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName != null && originalFileName.contains(".")
                ? originalFileName.substring(originalFileName.lastIndexOf("."))
                : ".pdf";

        // Sécurisation du nom de fichier pour éviter l'écrasement
        String storedFileName = UUID.randomUUID().toString() + fileExtension;
        Path targetLocation = this.fileStorageLocation.resolve(storedFileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier sur le disque.", ex);
        }

        // 4. Création de l'entité en base
        Certificate certificate = Certificate.builder()
                .assignment(assignment)
                .user(assignment.getUser())
                .fileName(originalFileName)
                .fileSize((int) file.getSize())
                .storagePath(targetLocation.toString())
                .status(CertificateStatus.PENDING_VALIDATION)
                .build();

        String itemName = assignment.getItemType().name().equals("CERTIFICATION") ? "votre certification"
                : "votre formation";

        // On importe NotificationProducer
        notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                .userId(assignment.getUser().getId())
                .userEmail(assignment.getUser().getEmail())
                .userFullName(assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName())
                .assignmentId(assignment.getId())
                .itemName(itemName)
                .eventType("CERTIFICATE_UPLOADED")
                .build());

        return certificateRepository.save(certificate);

    }

    @Transactional(readOnly = true)
    public Resource downloadCertificate(UUID certificateId, UUID currentUserId, String currentUserRole) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificat introuvable"));

        // 1. Sécurité (RLS) : Propriétaire, Manager, Admin ou Training Manager
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

        // 2. Lecture du fichier sur le disque
        try {
            Path filePath = Paths.get(certificate.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Fichier introuvable sur le disque ou corrompu.");
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Erreur de chemin d'accès au fichier.", ex);
        }
    }

    @Transactional
    public Certificate updateCertificateStatus(UUID certificateId, CertificateStatus newStatus, UUID currentUserId, String currentUserRole) {
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
            // Permit if user is ADMIN, TRAINING_MANAGER or CAREER_MANAGER
            if (!List.of("ADMIN", "TRAINING_MANAGER", "CAREER_MANAGER").contains(cleanRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Seul le Career Manager responsable, un Admin ou Training Manager peut modifier le statut du certificat.");
            }
        }

        certificate.setStatus(newStatus);
        Certificate updated = certificateRepository.save(certificate);

        // Event RabbitMQ (avec Try-Catch pour éviter de faire échouer la transaction si RabbitMQ est indisponible)
        try {
            if (notificationProducer != null && certificate.getAssignment() != null) {
                notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                        .userId(certificate.getUser().getId())
                        .userEmail(certificate.getUser().getEmail())
                        .userFullName(certificate.getUser().getFirstName() + " " + certificate.getUser().getLastName())
                        .assignmentId(certificate.getAssignment().getId())
                        .itemName(certificate.getFileName())
                        .eventType("CERTIFICATE_STATUS_CHANGED")
                        .build());
            }
        } catch (Exception e) {
            log.warn("Impossible d'envoyer l'événement RabbitMQ pour le changement de statut du certificat: {}", e.getMessage());
        }

        return updated;
    }
}