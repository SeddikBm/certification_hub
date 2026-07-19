package com.example.certificationHub.service;

import com.example.certificationHub.messaging.WelcomeEmailEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

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

        } catch (MessagingException e) {
            throw new RuntimeException("Échec de l'envoi de l'email", e);
        }
    }
}