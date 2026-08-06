package com.example.certificationHub.service;

import com.example.certificationHub.messaging.AssignmentEvent;
import com.example.certificationHub.messaging.WelcomeEmailEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:${spring.mail.username:moncompte8314@gmail.com}}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost}")
    private String frontendUrl;

    private static final String DEVOTEAM_LOGO_URL = "cid:devoteamLogo";

    private boolean isMailConfigured() {
        return mailPassword != null && !mailPassword.isBlank();
    }

    private void attachLogoInlineIfAvailable(MimeMessageHelper helper) {
        try {
            org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("static/image.png");
            if (resource.exists()) {
                helper.addInline("devoteamLogo", resource);
            } else {
                java.io.File file = new java.io.File("c:/Users/dell/Desktop/certificationHub/image.png");
                if (file.exists()) {
                    helper.addInline("devoteamLogo", new org.springframework.core.io.FileSystemResource(file));
                }
            }
        } catch (Exception e) {
            log.warn("Impossible d'attacher le logo inline : {}", e.getMessage());
        }
    }

    public void sendHtmlWelcomeEmail(WelcomeEmailEvent event) {
        if (!isMailConfigured()) {
            log.info("[DEV MODE] Email de bienvenue simulé pour {}", event.getEmail());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Context context = new Context();
            context.setVariable("firstName", event.getFirstName());
            context.setVariable("lastName", event.getLastName());
            context.setVariable("email", event.getEmail());
            context.setVariable("password", event.getRawPassword());
            context.setVariable("logoUrl", DEVOTEAM_LOGO_URL);
            context.setVariable("frontendUrl", frontendUrl != null ? frontendUrl : "http://localhost");


            String htmlContent = templateEngine.process("welcome-email", context);
            String plainText = "Bienvenue sur Devoteam CertificationHub !\n\nBonjour " + event.getFirstName() + " " + event.getLastName() + ",\n\nVotre compte a été créé avec succès.\nIdentifiant: " + event.getEmail() + "\nMot de passe temporaire: " + event.getRawPassword() + "\n\nCordialement,\nL'équipe Devoteam CertificationHub";

            message.setHeader("Precedence", "bulk");
            message.setHeader("Auto-Submitted", "auto-generated");
            message.setHeader("X-Auto-Response-Suppress", "OOF, AutoReply");

            helper.setFrom(new jakarta.mail.internet.InternetAddress(fromEmail, "Devoteam CertificationHub", "UTF-8"));
            helper.setReplyTo(fromEmail);
            helper.setTo(event.getEmail());
            helper.setSubject("Bienvenue sur Devoteam CertificationHub !");
            helper.setText(plainText, htmlContent);
            attachLogoInlineIfAvailable(helper);

            mailSender.send(message);
            log.info("Email de bienvenue envoyé avec succès à {}", event.getEmail());
        } catch (Exception e) {
            log.warn("Notification par email non délivrée à {} : {}", event.getEmail(), e.getMessage());
        }
    }

    public void sendHtmlAssignmentEmail(AssignmentEvent event, String recipientEmail, String emailTitle,
            String emailMessage, String actionUrl) {
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
            String fullName = event.getTargetUserFullName() != null ? event.getTargetUserFullName() : event.getUserFullName();
            context.setVariable("fullName", fullName);
            context.setVariable("collabName", event.getUserFullName());
            context.setVariable("itemName", event.getItemName());
            context.setVariable("title", emailTitle);
            context.setVariable("message", emailMessage);
            context.setVariable("actionUrl", actionUrl != null ? actionUrl : "/my-assignments");
            context.setVariable("eventType", event.getEventType());
            context.setVariable("notes", event.getNotes());
            context.setVariable("noteLabel", event.getNoteLabel() != null ? ("💬 " + event.getNoteLabel()) : "💬 Note / Motivation");
            context.setVariable("dateDetail", event.getDetails());
            context.setVariable("logoUrl", DEVOTEAM_LOGO_URL);
            context.setVariable("frontendUrl", frontendUrl != null ? frontendUrl : "http://localhost");


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
            String plainText = emailTitle + "\n\nBonjour " + (fullName != null ? fullName : "") + ",\n\n"
                    + emailMessage + "\n\nParcours: " + (event.getItemName() != null ? event.getItemName() : "")
                    + "\n\nCordialement,\nL'équipe Devoteam CertificationHub";

            message.setHeader("Precedence", "bulk");
            message.setHeader("Auto-Submitted", "auto-generated");
            message.setHeader("X-Auto-Response-Suppress", "OOF, AutoReply");

            helper.setFrom(new jakarta.mail.internet.InternetAddress(fromEmail, "Devoteam CertificationHub", "UTF-8"));
            helper.setReplyTo(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[Devoteam] " + emailTitle);
            helper.setText(plainText, htmlContent);
            attachLogoInlineIfAvailable(helper);

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
