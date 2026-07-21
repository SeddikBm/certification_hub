package com.example.certificationHub.repository;

import com.example.certificationHub.entity.CertificationRating;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificationRatingRepository extends JpaRepository<CertificationRating, CertificationRating.Id> {
    // Récupérer tous les avis pour une certification donnée
    List<CertificationRating> findByCertificationId(UUID certificationId);

    // Récupérer un avis spécifique par utilisateur et certification
    Optional<CertificationRating> findByUserIdAndCertificationId(UUID userId, UUID certificationId);

    // Récupérer les avis d'une certification pour l'affichage (Pageable)
    Page<CertificationRating> findByCertificationId(UUID certificationId, Pageable pageable);

    // Calculer la moyenne des notes pour une certification
    @Query("SELECT AVG(r.rating) FROM CertificationRating r WHERE r.certification.id = :certId")
    Double getAverageRating(@Param("certId") UUID certId);

    // Compter le nombre total d'avis
    long countByCertificationId(UUID certificationId);
}
