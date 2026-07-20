package com.example.certificationHub.repository;

import com.example.certificationHub.entity.TrainingSquad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrainingSquadRepository extends JpaRepository<TrainingSquad, TrainingSquad.Id> {
    // Trouver toutes les formations pour un Squad donné
    List<TrainingSquad> findBySquadId(UUID squadId);

    void deleteByTrainingId(UUID trainId);

    List<TrainingSquad> findByTrainingId(UUID trainId);

}
