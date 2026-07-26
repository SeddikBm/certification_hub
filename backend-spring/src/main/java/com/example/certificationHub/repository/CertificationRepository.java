package com.example.certificationHub.repository;

import com.example.certificationHub.entity.Certification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

// JpaSpecificationExecutor permet de passer des filtres dynamiques
public interface CertificationRepository
        extends JpaRepository<Certification, UUID>, JpaSpecificationExecutor<Certification> {

    // On ignore les certifications supprimées logiciellement
    Optional<Certification> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    @org.springframework.data.jpa.repository.Query("SELECT new com.example.certificationHub.dto.response.ChartDataResponse(c.provider, COUNT(c)) FROM Certification c WHERE c.deletedAt IS NULL GROUP BY c.provider")
    java.util.List<com.example.certificationHub.dto.response.ChartDataResponse> countCertificationsByProvider();

    @org.springframework.data.jpa.repository.Query("SELECT new com.example.certificationHub.dto.response.ChartDataResponse(CAST(c.difficulty AS string), COUNT(c)) FROM Certification c WHERE c.deletedAt IS NULL GROUP BY c.difficulty")
    java.util.List<com.example.certificationHub.dto.response.ChartDataResponse> countCertificationsByDifficulty();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT c.provider FROM Certification c WHERE c.deletedAt IS NULL AND c.provider IS NOT NULL")
    java.util.List<String> findDistinctProviders();

    long countByDeletedAtIsNull();
}