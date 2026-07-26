package com.example.certificationHub.mapper;

import com.example.certificationHub.entity.User;
import com.example.certificationHub.dto.request.UserCreateRequest;
import com.example.certificationHub.dto.request.UserUpdateRequest;
import com.example.certificationHub.dto.response.UserResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Component
public class UserMapper {

    // --- SENS ENTITÉ -> DTO ---
    public UserResponse toResponse(User user) {
        if (user == null)
            return null;

        Map<String, Object> meta = user.getMetadata();
        String phone = meta != null && meta.containsKey("phone") ? meta.get("phone").toString() : null;

        String hireDateStr = meta != null && meta.containsKey("hireDate") ? meta.get("hireDate").toString() : null;
        LocalDate hireDate = hireDateStr != null ? LocalDate.parse(hireDateStr) : null;

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .status(user.getStatus())
                .phone(phone)
                .hireDate(hireDate)
                .squadId(user.getSquad() != null ? user.getSquad().getId() : null)
                .squadName(user.getSquad() != null ? user.getSquad().getName() : null)
                .build();
    }

    // --- SENS DTO -> ENTITÉ (POST) ---
    public User toEntity(UserCreateRequest request) {
        if (request == null)
            return null;

        Map<String, Object> metadata = new HashMap<>();
        if (request.getPhone() != null) {
            metadata.put("phone", request.getPhone());
        }
        if (request.getHireDate() != null) {
            metadata.put("hireDate", request.getHireDate().toString());
        }

        return User.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .metadata(metadata)
                .build();
    }

    // --- MISE À JOUR (PUT) ---
    public void updateEntity(User user, UserUpdateRequest request) {
        if (request == null || user == null)
            return;

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        Map<String, Object> meta = user.getMetadata() != null ? new HashMap<>(user.getMetadata()) : new HashMap<>();

        // Mise à jour du téléphone
        if (request.getPhone() != null) {
            meta.put("phone", request.getPhone());
        } else {
            meta.remove("phone");
        }

        // Mise à jour de la date d'embauche
        if (request.getHireDate() != null) {
            meta.put("hireDate", request.getHireDate().toString());
        } else {
            meta.remove("hireDate");
        }

        user.setMetadata(meta);
    }
}