package com.example.certificationHub.service;

import com.example.certificationHub.messaging.AssignmentEvent;
import com.example.certificationHub.messaging.WelcomeEmailEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.password:}")
    private String mailPassword;

    private boolean isMailConfigured() {
        return mailPassword != null && !mailPassword.isBlank() && !mailPassword.contains("CHANGE_ME");
    }

    public void sendHtmlWelcomeEmail(WelcomeEmailEvent event) {
        if (!isMailConfigured()) {
            log.info("[DEV MODE] Email de bienvenue simulé pour {}", event.getEmail());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // true = on indique que c'est un message multipart (pour supporter le HTML)
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // 1. Préparer les variables pour Thymeleaf
            Context context = new Context();
            context.setVariable("firstName", event.getFirstName());
            context.setVariable("lastName", event.getLastName());
            context.setVariable("password", event.getRawPassword());

            // 2. Générer le HTML à partir du fichier "welcome-email.html"
            String htmlContent = templateEngine.process("welcome-email", context);

            // 3. Configurer l'email
            helper.setTo(event.getEmail());
            helper.setSubject("Bienvenue sur CertificationHub !");
            helper.setText(htmlContent, true); // true = c'est du HTML

            // 4. Envoyer
            mailSender.send(message);
            log.info("Email de bienvenue envoyé avec succès à {}", event.getEmail());
        } catch (Exception e) {
            log.warn("Notification par email non délivrée à {} (SMTP local non configuré) : {}", event.getEmail(), e.getMessage());
        }
    }

    public void sendHtmlAssignmentEmail(AssignmentEvent event, String recipientEmail, String emailTitle, String emailMessage, String actionUrl) {
        String toEmail = recipientEmail != null ? recipientEmail : event.getUserEmail();
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Destinataire manquant pour l'email : {}", emailTitle);
            return;
        }

        if (!isMailConfigured()) {
            log.info("[DEV MODE] Email simulé pour {} : [{}] - {}", toEmail, emailTitle, emailMessage);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Context context = new Context();
            context.setVariable("fullName", event.getTargetUserFullName() != null ? event.getTargetUserFullName() : event.getUserFullName());
            context.setVariable("collabName", event.getUserFullName());
            context.setVariable("itemName", event.getItemName());
            context.setVariable("title", emailTitle);
            context.setVariable("message", emailMessage);
            context.setVariable("actionUrl", actionUrl != null ? actionUrl : "/my-assignments");
            context.setVariable("eventType", event.getEventType());
            context.setVariable("notes", event.getNotes());
            context.setVariable("dateDetail", event.getDetails());

            String templateName = "assignment-email";
            String eventType = event.getEventType() != null ? event.getEventType().toUpperCase() : "";

            switch (eventType) {
                case "CREATED":
                    templateName = "assignment-created";
                    break;
                case "APPROVED":
                case "REJECTED":
                case "CANCELLED":
                    templateName = "assignment-status";
                    break;
                case "PLANNED":
                    templateName = "assignment-planned";
                    break;
                case "EXAM_SCHEDULED":
                    templateName = "exam-scheduled";
                    break;
                case "COMPLETED":
                    templateName = "assignment-completed";
                    break;
                case "FAILED":
                    templateName = "assignment-failed";
                    break;
                case "CERTIFICATE_UPLOADED":
                case "CERTIFICATE_STATUS_CHANGED":
                    templateName = "certificate-event";
                    break;
                case "DEADLINE_APPROACHING":
                    templateName = "deadline-reminder";
                    break;
                case "REVIEW_REPORTED":
                case "REPORT_CREATED":
                    templateName = "report-alert";
                    break;
                default:
                    templateName = "assignment-email";
                    break;
            }

            String htmlContent = templateEngine.process(templateName, context);

            helper.setTo(toEmail);
            helper.setSubject(emailTitle + " - Devoteam CertificationHub");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email [{}] envoyé avec succès à {}", templateName, toEmail);

        } catch (Exception e) {
            log.warn("Notification par email non délivrée à {} : {}", toEmail, e.getMessage());
        }
    }

    public void sendHtmlAssignmentEmail(AssignmentEvent event, String emailTitle, String emailMessage) {
        sendHtmlAssignmentEmail(event, event.getUserEmail(), emailTitle, emailMessage, "/my-assignments");
    }
}
