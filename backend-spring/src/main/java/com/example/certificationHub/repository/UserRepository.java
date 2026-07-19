package com.example.certificationHub.repository;

import com.example.certificationHub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    // Essentiel pour Spring Security lors du login
    Optional<User> findByEmail(String email);

    // Essentiel pour la validation de ton DTO (vérifier si l'email est déjà pris)
    boolean existsByEmail(String email);

    // Utile pour afficher les membres d'un squad
    List<User> findBySquadId(UUID squadId);
}