package com.example.certificationHub.repository;

import com.example.certificationHub.entity.Certification;
import com.example.certificationHub.enumeration.CertifDifficulty;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// JpaSpecificationExecutor permet de passer des filtres dynamiques
public interface CertificationRepository
        extends JpaRepository<Certification, UUID>, JpaSpecificationExecutor<Certification> {

    // On ignore les certifications supprimées logiciellement
    Optional<Certification> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByCodeAndDeletedAtIsNull(String code);
}