package com.example.certificationHub.messaging;

import com.example.certificationHub.config.RabbitMQConfig;
import com.example.certificationHub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.WELCOME_EMAIL_QUEUE)
    public void consumeWelcomeEmailEvent(WelcomeEmailEvent event) {
        // Dès qu'un message arrive dans la file, on déclenche l'envoi
        emailService.sendHtmlWelcomeEmail(event);
    }
}