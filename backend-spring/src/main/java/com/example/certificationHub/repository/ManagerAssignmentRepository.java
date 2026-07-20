package com.example.certificationHub.repository;

import com.example.certificationHub.dto.response.AssignedCollaboratorResponse;
import com.example.certificationHub.dto.response.CareerManagerHierarchyResponse;
import com.example.certificationHub.entity.ManagerAssignment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ManagerAssignmentRepository extends JpaRepository<ManagerAssignment, ManagerAssignment.Id> {
        // Trouver tous les collaborateurs gérés par un Career Manager
        List<ManagerAssignment> findByManagerId(UUID managerId);

        @Query("SELECT new CareerManagerHierarchyResponse(" +

                        "u.id, u.firstName, u.lastName, u.email, COUNT(ma.collaborator.id)) " +

                        "FROM User u LEFT JOIN ManagerAssignment ma ON u.id = ma.manager.id " +

                        "WHERE u.role = 'CAREER_MANAGER' AND u.status = 'ACTIVE' " +

                        "GROUP BY u.id, u.firstName, u.lastName, u.email")

        Page<CareerManagerHierarchyResponse> getHierarchyOverview(Pageable pageable);

        // 2. Récupérer la liste détaillée des collaborateurs pour un manager spécifique
        // (pour la modale)

        @Query("SELECT new AssignedCollaboratorResponse(" +

                        "c.id, c.firstName, c.lastName, c.email, s.name) " +

                        "FROM ManagerAssignment ma " +

                        "JOIN ma.collaborator c " +

                        "LEFT JOIN c.squad s " +

                        "WHERE ma.manager.id = :managerId")

        List<AssignedCollaboratorResponse> getCollaboratorsByManagerId(@Param("managerId") UUID managerId);

}
