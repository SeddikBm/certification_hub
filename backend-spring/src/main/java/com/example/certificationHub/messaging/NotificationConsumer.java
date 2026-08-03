package com.example.certificationHub.messaging;

import com.example.certificationHub.config.RabbitMQConfig;
import com.example.certificationHub.entity.Notification;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.NotificationType;
import com.example.certificationHub.repository.NotificationRepository;
import com.example.certificationHub.repository.UserRepository;
import com.example.certificationHub.service.EmailService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final EmailService emailService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.WELCOME_EMAIL_QUEUE)
    public void consumeWelcomeEmailEvent(WelcomeEmailEvent event) {
        // Dès qu'un message arrive dans la file, on déclenche l'envoi
        emailService.sendHtmlWelcomeEmail(event);
    }

    
    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    @Transactional
    public void processAssignmentEvent(AssignmentEvent event) {
        log.info("Événement reçu : {} pour {}", event.getEventType(), event.getUserFullName());

        UUID recipientId = event.getTargetUserId() != null ? event.getTargetUserId() : event.getUserId();
        User targetUser = userRepository.findById(recipientId).orElse(null);
        if (targetUser == null) {
            targetUser = userRepository.findById(event.getUserId()).orElse(null);
        }
        if (targetUser == null) return;

        String title = "Notification CertificationHub";
        String message = "Événement concernant " + event.getItemName();
        NotificationType type = NotificationType.INFO;
        String actionUrl = event.getActionUrl() != null ? event.getActionUrl() : "/my-assignments";

        switch (event.getEventType()) {
            case "CREATED":
                if (event.getTargetUserId() != null && !event.getTargetUserId().equals(event.getUserId())) {
                    title = "Nouvelle demande d'assignation";
                    message = event.getUserFullName() + " a soumis une demande d'assignation pour " + event.getItemName() + ".";
                    actionUrl = "/manage-assignments";
                } else {
                    title = "Nouvelle assignation reçue";
                    String itemLabel = "TRAINING".equalsIgnoreCase(event.getItemType()) ? "La formation " : "La certification ";
                    message = itemLabel + event.getItemName() + " vous a été attribuée par votre responsable.";
                    actionUrl = "/my-assignments";
                }
                type = NotificationType.INFO;
                break;
            case "APPROVED":
                title = "Demande approuvée !";
                message = "Bonne nouvelle, votre demande pour " + event.getItemName() + " a été validée avec succès.";
                type = NotificationType.SUCCESS;
                actionUrl = "/my-assignments";
                break;
            case "REJECTED":
                title = "Demande refusée / annulée";
                message = "Votre demande d'assignation pour " + event.getItemName() + " n'a pas été retenue.";
                type = NotificationType.ERROR;
                actionUrl = "/my-assignments";
                break;
            case "CERTIFICATE_UPLOADED":
                if (event.getTargetUserId() != null && !event.getTargetUserId().equals(event.getUserId())) {
                    title = "Nouveau certificat à valider";
                    message = event.getUserFullName() + " a déposé son certificat PDF pour " + event.getItemName() + ".";
                    actionUrl = "/manage-assignments";
                } else {
                    title = "Certificat téléversé";
                    message = "Votre certificat PDF pour " + event.getItemName() + " a été bien transmis.";
                    actionUrl = "/my-assignments";
                }
                type = NotificationType.INFO;
                break;
            case "CERTIFICATE_STATUS_CHANGED":
                title = "Statut du certificat mis à jour";
                message = "Le statut de votre certificat pour " + event.getItemName() + " a été mis à jour par votre responsable.";
                type = NotificationType.SUCCESS;
                actionUrl = "/my-assignments";
                break;
            case "PLANNED":
                title = "Date de début planifiée";
                message = event.getUserFullName() + " a fixé la date de démarrage pour " + event.getItemName() + (event.getDetails() != null ? " au " + event.getDetails() : "") + ".";
                type = NotificationType.INFO;
                actionUrl = event.getTargetUserId() != null && !event.getTargetUserId().equals(event.getUserId()) ? "/manage-assignments" : "/my-assignments";
                break;
            case "EXAM_SCHEDULED":
                title = "Examen programmé";
                message = "L'examen pour " + event.getItemName() + " a été planifié" + (event.getDetails() != null ? " pour le " + event.getDetails() : "") + ".";
                type = NotificationType.INFO;
                actionUrl = event.getTargetUserId() != null && !event.getTargetUserId().equals(event.getUserId()) ? "/manage-assignments" : "/my-assignments";
                break;
            case "COMPLETED":
                title = "Félicitations ! Parcours Réussi";
                message = "Le parcours pour " + event.getItemName() + " a été accompli et validé avec succès. Bravo !";
                type = NotificationType.SUCCESS;
                actionUrl = "/my-assignments";
                break;
            case "FAILED":
                title = "Résultat d'examen : Échec";
                message = "L'examen pour " + event.getItemName() + " n'a pas été validé.";
                type = NotificationType.ERROR;
                actionUrl = "/my-assignments";
                break;
            case "DEADLINE_APPROACHING":
                title = "Rappel : Date cible proche (J-7)";
                message = "Attention, la date cible pour " + event.getItemName() + " approche dans 7 jours et aucun examen n'est encore planifié.";
                type = NotificationType.WARNING;
                actionUrl = "/my-assignments";
                break;
            case "EXPIRED":
                title = "Parcours expiré";
                message = "La date cible pour " + event.getItemName() + " est dépassée. Le statut a été mis à jour.";
                type = NotificationType.ERROR;
                actionUrl = "/my-assignments";
                break;
            case "REVIEW_REPORTED":
            case "REPORT_CREATED":
                title = "Signalement d'avis soumis";
                message = "Un signalement d'avis abusif a été émis par " + event.getUserFullName() + " sur " + event.getItemName() + ".";
                type = NotificationType.WARNING;
                actionUrl = "/certifications";
                break;
        }



        // 1. Sauvegarde de la Notification In-App
        Notification notification = Notification.builder()
                .user(targetUser)
                .title(title)
                .message(message)
                .type(type)
                .channel("BOTH")
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // 2. Envoi d'email asynchrone sécurisé avec Devoteam Branding
        String targetEmail = event.getTargetUserEmail() != null ? event.getTargetUserEmail() : targetUser.getEmail();
        emailService.sendHtmlAssignmentEmail(event, targetEmail, title, message, actionUrl);
    }

}