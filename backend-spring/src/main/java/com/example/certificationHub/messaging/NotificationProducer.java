package com.example.certificationHub.messaging;

import com.example.certificationHub.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendWelcomeEmail(WelcomeEmailEvent event) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.WELCOME_EMAIL_QUEUE, event);
    }
}