package com.example.certificationHub.repository;

import com.example.certificationHub.entity.CertificationSquad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CertificationSquadRepository extends JpaRepository<CertificationSquad, CertificationSquad.Id> {
    // Trouver toutes les certifications pour un Squad donné
    List<CertificationSquad> findBySquadId(UUID squadId);
    List<CertificationSquad> findByCertificationId(UUID certificationId);
    void deleteByCertificationId(UUID certificationId);

    @org.springframework.data.jpa.repository.Query("SELECT new com.example.certificationHub.dto.response.ChartDataResponse(cs.squad.name, COUNT(cs)) FROM CertificationSquad cs GROUP BY cs.squad.name")
    java.util.List<com.example.certificationHub.dto.response.ChartDataResponse> countCertificationsBySquad();
}

