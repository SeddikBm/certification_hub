package com.example.certificationHub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor // Important pour la requête JPQL
public class CareerManagerHierarchyResponse {
    private UUID managerId;
    private String firstName;
    private String lastName;
    private String email;
    private long collaboratorCount; // Le nombre total pour la colonne du tableau
}