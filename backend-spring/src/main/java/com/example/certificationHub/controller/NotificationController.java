package com.example.certificationHub.controller;

import com.example.certificationHub.dto.response.NotificationResponse;
import com.example.certificationHub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // GET /api/v1/notifications (Mes notifications non lues pour le dropdown)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<NotificationResponse> getMyNotifications(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));

        return notificationService.getMyNotifications(currentUserId);
    }

    // PUT /api/v1/notifications/:id/read (Clic sur la notification)
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(@PathVariable UUID id, Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));

        notificationService.markAsRead(id, currentUserId);
    }
}