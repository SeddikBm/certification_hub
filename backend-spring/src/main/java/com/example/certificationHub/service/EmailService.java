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

    public void sendHtmlAssignmentEmail(AssignmentEvent event, String emailTitle, String emailMessage) {
        if (!isMailConfigured()) {
            log.info("[DEV MODE] Email d'assignation simulé pour {} : {}", event.getUserEmail(), emailTitle);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // 1. Préparer les variables pour Thymeleaf
            Context context = new Context();
            context.setVariable("fullName", event.getUserFullName());
            context.setVariable("itemName", event.getItemName());
            context.setVariable("title", emailTitle);
            context.setVariable("message", emailMessage);

            // 2. Générer le HTML à partir du fichier "assignment-email.html"
            String htmlContent = templateEngine.process("assignment-email", context);

            // 3. Configurer l'email
            helper.setTo(event.getUserEmail());
            helper.setSubject(emailTitle + " - CertificationHub");
            helper.setText(htmlContent, true);

            // 4. Envoyer
            mailSender.send(message);
            log.info("Email d'assignation envoyé avec succès à {}", event.getUserEmail());

        } catch (Exception e) {
            log.warn("Notification par email non délivrée à {} (SMTP local non configuré) : {}", event.getUserEmail(), e.getMessage());
        }
    }
}
