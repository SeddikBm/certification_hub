package com.example.certificationHub.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String WELCOME_EMAIL_QUEUE = "welcome_email_queue";
    public static final String NOTIFICATION_QUEUE = "notification_queue";

    @Bean
    public Queue welcomeEmailQueue() {
        return new Queue(WELCOME_EMAIL_QUEUE, true); // durable = true
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    // Pour sérialiser automatiquement nos objets Java en JSON dans RabbitMQ
    @Bean
    public JacksonJsonMessageConverter messageConverter() {
        return new JacksonJsonMessageConverter();
    }
}