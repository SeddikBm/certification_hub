package com.example.certificationHub.service;

import com.example.certificationHub.entity.Notification;
import com.example.certificationHub.dto.response.NotificationResponse;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.mapper.NotificationMapper;
import com.example.certificationHub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(UUID userId) {
        // Ramène les notifications non lues, les plus récentes en premier
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable"));

        // Sécurité stricte : Je ne peux marquer comme lue que MA notification
        if (!notification.getUser().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

}