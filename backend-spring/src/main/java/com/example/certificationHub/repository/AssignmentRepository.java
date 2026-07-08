package com.example.certificationHub.repository;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.enumeration.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    // Récupérer toutes les assignations d'un collaborateur
    List<Assignment> findByUserId(UUID userId);

    // Récupérer toutes les assignations (users) pour une certification ou formation
    // spécifique
    List<Assignment> findByItemTypeAndItemId(ItemType itemType, UUID itemId);
}