package com.example.certificationHub.repository;

import com.example.certificationHub.entity.Training;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

public interface TrainingRepository extends JpaRepository<Training, UUID>, JpaSpecificationExecutor<Training> {
    // Les formations n'ont pas de "code" unique dans ton modèle, on peut chercher
    // par titre

    boolean existsByTitleAndDeletedAtIsNull(String title);

    Optional<Training> findByIdAndDeletedAtIsNull(UUID id);

}