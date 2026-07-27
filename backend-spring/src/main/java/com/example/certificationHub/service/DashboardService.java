package com.example.certificationHub.service;

import com.example.certificationHub.dto.response.ChartDataResponse;
import com.example.certificationHub.dto.response.DashboardStatsResponse;
import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.ManagerAssignment;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.CertifDifficulty;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.enumeration.StatusTraining;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.CertificationSquadRepository;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import com.example.certificationHub.repository.SquadRepository;
import com.example.certificationHub.repository.TrainingRepository;
import com.example.certificationHub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CertificationRepository certificationRepository;
    private final TrainingRepository trainingRepository;
    private final UserRepository userRepository;
    private final SquadRepository squadRepository;
    private final CertificationSquadRepository certificationSquadRepository;
    private final AssignmentRepository assignmentRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(UUID currentUserId, String currentUserRole) {
        long totalCerts = certificationRepository.countByDeletedAtIsNull();
        long totalTrainings = trainingRepository.countByDeletedAtIsNull();
        long totalSquads = squadRepository.countByDeletedAtIsNull();

        String normalizedRole = currentUserRole != null ? currentUserRole.replace("ROLE_", "") : "";

        if ("CAREER_MANAGER".equals(normalizedRole)) {
            // Scoped stats for Career Manager's collaborators
            List<ManagerAssignment> managedAssignments = managerAssignmentRepository.findByManagerId(currentUserId);
            List<UUID> managedUserIds = managedAssignments.stream()
                    .filter(ma -> ma.getCollaborator() != null)
                    .map(ma -> ma.getCollaborator().getId())
                    .collect(Collectors.toList());

            List<Assignment> assignments = new ArrayList<>();
            for (UUID uid : managedUserIds) {
                assignments.addAll(assignmentRepository.findByUserId(uid));
            }

            long teamCertCount = assignments.stream().filter(a -> a.getItemType() == ItemType.CERTIFICATION).count();
            long teamTrainCount = assignments.stream().filter(a -> a.getItemType() == ItemType.TRAINING).count();

            long completedCount = assignments.stream().filter(a ->
                a.getStatusCertification() == StatusCertification.COMPLETED ||
                a.getStatusTraining() == StatusTraining.COMPLETED
            ).count();

            long pendingCount = assignments.stream().filter(a ->
                a.getStatusCertification() == StatusCertification.PENDING_APPROVAL ||
                a.getStatusTraining() == StatusTraining.PENDING_APPROVAL
            ).count();

            return DashboardStatsResponse.builder()
                    .totalCertifications(teamCertCount)
                    .totalTrainings(teamTrainCount)
                    .totalUsers(managedUserIds.size())
                    .totalSquads(totalSquads)
                    .totalAssignments(assignments.size())
                    .completedAssignments(completedCount)
                    .pendingAssignments(pendingCount)
                    .scopeName("Statistiques de vos Collaborateurs")
                    .certificationsByProvider(getScopedProviderCounts(assignments))
                    .certificationsBySquad(certificationSquadRepository.countCertificationsBySquad())
                    .certificationsByDifficulty(getScopedDifficultyCounts(assignments))
                    .build();
        } else if ("SQUAD_LEAD".equals(normalizedRole)) {
            // Scoped stats for Squad Lead's squad
            User squadLead = userRepository.findById(currentUserId).orElse(null);
            UUID squadId = (squadLead != null && squadLead.getSquad() != null) ? squadLead.getSquad().getId() : null;

            List<Assignment> assignments = new ArrayList<>();
            long squadUsersCount = 0;

            if (squadId != null) {
                List<User> squadMembers = userRepository.findAll().stream()
                        .filter(u -> u.getSquad() != null && squadId.equals(u.getSquad().getId()))
                        .collect(Collectors.toList());

                squadUsersCount = squadMembers.size();
                for (User member : squadMembers) {
                    assignments.addAll(assignmentRepository.findByUserId(member.getId()));
                }
            }

            long squadCertCount = assignments.stream().filter(a -> a.getItemType() == ItemType.CERTIFICATION).count();
            long squadTrainCount = assignments.stream().filter(a -> a.getItemType() == ItemType.TRAINING).count();

            long completedCount = assignments.stream().filter(a ->
                a.getStatusCertification() == StatusCertification.COMPLETED ||
                a.getStatusTraining() == StatusTraining.COMPLETED
            ).count();

            long pendingCount = assignments.stream().filter(a ->
                a.getStatusCertification() == StatusCertification.PENDING_APPROVAL ||
                a.getStatusTraining() == StatusTraining.PENDING_APPROVAL
            ).count();

            String squadName = (squadLead != null && squadLead.getSquad() != null) ? squadLead.getSquad().getName() : "Squad";

            return DashboardStatsResponse.builder()
                    .totalCertifications(squadCertCount)
                    .totalTrainings(squadTrainCount)
                    .totalUsers(squadUsersCount)
                    .totalSquads(totalSquads)
                    .totalAssignments(assignments.size())
                    .completedAssignments(completedCount)
                    .pendingAssignments(pendingCount)
                    .scopeName("Statistiques du Squad: " + squadName)
                    .certificationsByProvider(getScopedProviderCounts(assignments))
                    .certificationsBySquad(certificationSquadRepository.countCertificationsBySquad())
                    .certificationsByDifficulty(getScopedDifficultyCounts(assignments))
                    .build();
        }

        // Default / ADMIN / DIRECTOR / TRAINING_MANAGER: Global enterprise metrics
        List<Assignment> allAssignments = assignmentRepository.findAll();
        long completedCount = allAssignments.stream().filter(a ->
            a.getStatusCertification() == StatusCertification.COMPLETED ||
            a.getStatusTraining() == StatusTraining.COMPLETED
        ).count();

        long pendingCount = allAssignments.stream().filter(a ->
            a.getStatusCertification() == StatusCertification.PENDING_APPROVAL ||
            a.getStatusTraining() == StatusTraining.PENDING_APPROVAL
        ).count();

        return DashboardStatsResponse.builder()
                .totalCertifications(totalCerts)
                .totalTrainings(totalTrainings)
                .totalUsers(userRepository.countByDeletedAtIsNull())
                .totalSquads(totalSquads)
                .totalAssignments(allAssignments.size())
                .completedAssignments(completedCount)
                .pendingAssignments(pendingCount)
                .scopeName("Vue Globale Entreprise")
                .certificationsByProvider(certificationRepository.countCertificationsByProvider())
                .certificationsBySquad(certificationSquadRepository.countCertificationsBySquad())
                .certificationsByDifficulty(certificationRepository.countCertificationsByDifficulty())
                .build();
    }

    private List<ChartDataResponse> getScopedProviderCounts(List<Assignment> assignments) {
        Map<String, Long> counts = new HashMap<>();
        for (Assignment a : assignments) {
            if (a.getItemType() == ItemType.CERTIFICATION && a.getItemId() != null) {
                certificationRepository.findById(a.getItemId()).ifPresent(cert -> {
                    String p = cert.getProvider();
                    if (p != null && !p.isBlank()) {
                        counts.put(p, counts.getOrDefault(p, 0L) + 1);
                    }
                });
            }
        }
        return counts.entrySet().stream()
                .map(e -> new ChartDataResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private List<ChartDataResponse> getScopedDifficultyCounts(List<Assignment> assignments) {
        Map<String, Long> counts = new HashMap<>();
        for (Assignment a : assignments) {
            if (a.getItemType() == ItemType.CERTIFICATION && a.getItemId() != null) {
                certificationRepository.findById(a.getItemId()).ifPresent(cert -> {
                    CertifDifficulty d = cert.getDifficulty();
                    if (d != null) {
                        counts.put(d.name(), counts.getOrDefault(d.name(), 0L) + 1);
                    }
                });
            }
        }
        return counts.entrySet().stream()
                .map(e -> new ChartDataResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }
}
