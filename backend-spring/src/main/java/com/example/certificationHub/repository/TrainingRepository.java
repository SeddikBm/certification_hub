package com.example.certificationHub.repository;

import com.example.certificationHub.entity.Training;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TrainingRepository extends JpaRepository<Training, UUID> {
    // Les formations n'ont pas de "code" unique dans ton modèle, on peut chercher
    // par titre
    boolean existsByTitle(String title);
}