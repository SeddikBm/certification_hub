package com.example.certificationHub.repository;

import com.example.certificationHub.entity.Certification;
import com.example.certificationHub.enumeration.CertifDifficulty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificationRepository extends JpaRepository<Certification, UUID> {
    Optional<Certification> findByCode(String code);

    boolean existsByCode(String code);

    // Exemple de filtre utile pour ton MVP (Recherche avancée)
    List<Certification> findByDifficulty(CertifDifficulty difficulty);
}