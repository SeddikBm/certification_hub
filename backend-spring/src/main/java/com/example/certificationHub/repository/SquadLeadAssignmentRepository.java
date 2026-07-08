package com.example.certificationHub.repository;

import com.example.certificationHub.entity.SquadLeadAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SquadLeadAssignmentRepository extends JpaRepository<SquadLeadAssignment, SquadLeadAssignment.Id> {
    // Trouver toutes les assignations de Squad Leads pour un Squad donné
    List<SquadLeadAssignment> findBySquadId(UUID squadId);
}
