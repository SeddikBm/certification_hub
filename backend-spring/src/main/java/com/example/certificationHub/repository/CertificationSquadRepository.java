package com.example.certificationHub.repository;

import com.example.certificationHub.entity.CertificationSquad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CertificationSquadRepository extends JpaRepository<CertificationSquad, CertificationSquad.Id> {
    // Trouver toutes les certifications pour un Squad donné
    List<CertificationSquad> findBySquadId(UUID squadId);
}
