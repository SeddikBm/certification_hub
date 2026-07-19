package com.example.certificationHub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignedCollaboratorResponse {
    private UUID collaboratorId;
    private String firstName;
    private String lastName;
    private String email;
    private String squadName; // Toujours utile d'afficher l'équipe dans la modale
}