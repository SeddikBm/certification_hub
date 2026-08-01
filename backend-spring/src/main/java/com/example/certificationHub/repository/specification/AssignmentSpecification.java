package com.example.certificationHub.repository.specification;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.enumeration.StatusTraining;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AssignmentSpecification {

    public static Specification<Assignment> withSecurityAndFilters(
            UUID targetUserId, ItemType itemType, String status,
            UUID currentUserId, String currentUserRole, List<UUID> managedUserIds) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- 1. SÉCURITÉ (RLS) ---
            String role = currentUserRole != null ? currentUserRole.replace("ROLE_", "") : "";

            if ("COLLABORATOR".equals(role)) {
                // Collaborateur classique
                predicates.add(cb.equal(root.get("user").get("id"), currentUserId));
            } else if ("CAREER_MANAGER".equals(role)) {
                Predicate assignedByMe = cb.equal(root.get("assignedBy").get("id"), currentUserId);
                try {
                    Predicate targetedToMe = cb.equal(
                            cb.function("jsonb_extract_path_text", String.class, root.get("metadata"), cb.literal("targetManagerId")),
                            currentUserId.toString()
                    );
                    predicates.add(cb.or(assignedByMe, targetedToMe));
                } catch (Exception e) {
                    predicates.add(assignedByMe);
                }
            } else if ("SQUAD_LEAD".equals(role)) {
                List<UUID> allowedIds = new ArrayList<>(managedUserIds);
                if (!allowedIds.contains(currentUserId)) {
                    allowedIds.add(currentUserId);
                }
                Predicate userInManaged = root.get("user").get("id").in(allowedIds);
                Predicate assignedByMe = cb.equal(root.get("assignedBy").get("id"), currentUserId);
                predicates.add(cb.or(assignedByMe, userInManaged));
            } else if ("ADMIN".equals(role) || "DIRECTOR".equals(role) || "TRAINING_MANAGER".equals(role)) {
                // Admin, Director, and Training Manager have global access to ALL assignments
                // No security predicate added (unrestricted access)
            }

            // --- 2. FILTRES OPTIONNELS ---
            if (targetUserId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), targetUserId));
            }
            if (itemType != null) {
                predicates.add(cb.equal(root.get("itemType"), itemType));
            }
            if (status != null && !status.isBlank()) {
                List<Predicate> statusPredicates = new ArrayList<>();
                try {
                    StatusCertification sc = StatusCertification.valueOf(status.trim());
                    statusPredicates.add(cb.equal(root.get("statusCertification"), sc));
                } catch (IllegalArgumentException ignored) {}

                try {
                    StatusTraining st = StatusTraining.valueOf(status.trim());
                    statusPredicates.add(cb.equal(root.get("statusTraining"), st));
                } catch (IllegalArgumentException ignored) {}

                if (!statusPredicates.isEmpty()) {
                    predicates.add(cb.or(statusPredicates.toArray(new Predicate[0])));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}