package com.example.certificationHub.repository;

import com.example.certificationHub.entity.ManagerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ManagerAssignmentRepository extends JpaRepository<ManagerAssignment, ManagerAssignment.Id> {
    // Trouver tous les collaborateurs gérés par un Career Manager
    List<ManagerAssignment> findByManagerId(UUID managerId);
}