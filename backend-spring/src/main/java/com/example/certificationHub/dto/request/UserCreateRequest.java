package com.example.certificationHub.dto.request;

import com.example.certificationHub.enumeration.UserRole;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UserCreateRequest {
    @NotBlank(message = "L'email est requis")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est requis")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$", message = "Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial")
    private String password;

    @NotBlank(message = "Le prénom est requis")
    private String firstName;

    @NotBlank(message = "Le nom est requis")
    private String lastName;

    @NotNull(message = "Le rôle est requis")
    private UserRole role;

    private UUID squadId;

    private String phone;

    @NotNull(message = "La date d'embauche est requise")
    private LocalDate hireDate;

    // Règle métier : Squad obligatoire pour un collaborateur
    @AssertTrue(message = "L'affectation à un Squad est obligatoire pour un collaborateur")
    private boolean isSquadValid() {
        if (this.role == UserRole.COLLABORATOR && this.squadId == null) {
            return false;
        }
        return true;
    }
}