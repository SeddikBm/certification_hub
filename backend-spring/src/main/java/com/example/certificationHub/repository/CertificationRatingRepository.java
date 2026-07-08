package com.example.certificationHub.repository;

import com.example.certificationHub.entity.CertificationRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificationRatingRepository extends JpaRepository<CertificationRating, CertificationRating.Id> {
    // Récupérer tous les avis pour une certification donnée
    List<CertificationRating> findByCertificationId(UUID certificationId);

    // Récupérer un avis spécifique par utilisateur et certification
    Optional<CertificationRating> findByUserIdAndCertificationId(UUID userId, UUID certificationId);
}
