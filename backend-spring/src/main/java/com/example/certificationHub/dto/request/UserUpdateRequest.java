package com.example.certificationHub.dto.request;

import java.util.UUID;

import com.example.certificationHub.enumeration.UserRole;
import com.example.certificationHub.enumeration.UserStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @NotBlank(message = "Le prénom est requis")
    private String firstName;

    @NotBlank(message = "Le nom est requis")
    private String lastName;

    @Email(message = "Format d'email invalide")
    private String email;

    private String phone;

    // Ces champs seront ignorés si l'utilisateur n'est pas ADMIN
    private UserRole role;
    private UUID squadId;
    private UserStatus status;
}