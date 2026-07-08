package com.example.certificationHub.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.certificationHub.entity.Squad;

public interface SquadRepository extends JpaRepository<Squad, UUID> {
    Optional<Squad> findByName(String name);

    boolean existsByName(String name);
}