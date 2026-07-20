package com.example.certificationHub.repository.specification;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.enumeration.ItemType;
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
            if (!"ADMIN".equals(currentUserRole)) {
                if ("CAREER_MANAGER".equals(currentUserRole)) {
                    List<UUID> allowedIds = new ArrayList<>(managedUserIds);
                    predicates.add(root.get("user").get("id").in(allowedIds));
                } else {
                    // Collaborateur classique
                    predicates.add(cb.equal(root.get("user").get("id"), currentUserId));
                }
            }

            // --- 2. FILTRES OPTIONNELS ---
            if (targetUserId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), targetUserId));
            }
            if (itemType != null) {
                predicates.add(cb.equal(root.get("itemType"), itemType));
            }
            if (status != null && !status.isBlank()) {
                // Recherche dans l'un ou l'autre des statuts polymorphiques
                Predicate certStatus = cb.equal(root.get("statusCertification"), cb.literal(status));
                Predicate trainStatus = cb.equal(root.get("statusTraining"), cb.literal(status));
                predicates.add(cb.or(certStatus, trainStatus));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}