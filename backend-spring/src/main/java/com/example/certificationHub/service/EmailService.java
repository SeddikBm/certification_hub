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

    public void sendHtmlWelcomeEmail(WelcomeEmailEvent event) {
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
        } catch (MessagingException e) {
            log.error("Échec de l'envoi de l'email de bienvenue à {}", event.getEmail(), e);
            throw new RuntimeException("Échec de l'envoi de l'email de bienvenue", e);
        }
    }

    public void sendHtmlAssignmentEmail(AssignmentEvent event, String emailTitle, String emailMessage) {
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

        } catch (MessagingException e) {
            log.error("Échec de l'envoi de l'email à {}", event.getUserEmail(), e);
            // On lance une RuntimeException pour que RabbitMQ sache que ça a échoué et
            // fasse un Retry
            throw new RuntimeException("Échec de l'envoi de l'email d'assignation", e);
        }
    }
}
