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

        User user = userRepository.findById(event.getUserId()).orElse(null);
        if (user == null) return;

        String title = "";
        String message = "";
        NotificationType type = NotificationType.INFO;

        // Détermination du contenu selon l'événement
        switch (event.getEventType()) {
            case "CREATED":
                title = "Nouvelle demande";
                message = "Votre demande pour " + event.getItemName() + " a été soumise et est en attente d'approbation.";
                type = NotificationType.INFO;
                break;
            case "APPROVED":
                title = "Demande approuvée !";
                message = "Bonne nouvelle, votre demande pour " + event.getItemName() + " a été validée.";
                type = NotificationType.SUCCESS;
                break;
            case "REJECTED":
                title = "Demande refusée";
                message = "Votre demande pour " + event.getItemName() + " n'a pas pu être validée.";
                type = NotificationType.ERROR;
                break;
            case "CERTIFICATE_UPLOADED":
                title = "Certificat validé";
                message = "Votre certificat pour " + event.getItemName() + " a bien été enregistré. Félicitations !";
                type = NotificationType.SUCCESS;
                break;
            case "EXAM_SCHEDULED":
                title = "Examen planifié";
                message = "Votre examen pour " + event.getItemName() + " a été planifié. Préparez-vous bien !";
                type = NotificationType.INFO;
                break;
            case "DEADLINE_APPROACHING":
                title = "Attention : Deadline proche !";
                message = "La date de votre examen pour " + event.getItemName() + " approche à grands pas (J-3).";
                type = NotificationType.WARNING;
                break;
        }
            }

            // 1. Sauvegarde In-App (Base de données)
            Notification notification = Notification.builder()
                    .user(user)
                    .title(title)
                    .message(message)
                    .type(type)
                    .channel("BOTH") // On indique que ça part sur les deux canaux
                    .build();
            notificationRepository.save(notification);

            // 2. Délégation de l'envoi d'email à ton service dédié
            emailService.sendHtmlAssignmentEmail(event, title, message);
        }

}