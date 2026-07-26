package com.example.certificationHub.repository.specification;

import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.UserRole;
import com.example.certificationHub.enumeration.UserStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserSpecification {

    public static Specification<User> withSecurityAndFilters(
            UserRole role, UUID squadId, UserStatus status, String search,
            UUID currentUserId, String currentUserRole,
            List<UUID> managedUserIds, List<UUID> leadSquadIds) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- 1. SÉCURITÉ (RLS APPLICATIVE) ---
            if (!"ADMIN".equals(currentUserRole)) {
                if ("CAREER_MANAGER".equals(currentUserRole)) {
                    List<UUID> allowedIds = new ArrayList<>(managedUserIds);
                    allowedIds.add(currentUserId);
                    predicates.add(root.get("id").in(allowedIds));
                } else if ("SQUAD_LEAD".equals(currentUserRole) && !leadSquadIds.isEmpty()) {
                    Predicate isSelf = cb.equal(root.get("id"), currentUserId);
                    Predicate isInLeadSquads = root.get("squad").get("id").in(leadSquadIds);
                    predicates.add(cb.or(isSelf, isInLeadSquads));
                } else {
                    predicates.add(cb.equal(root.get("id"), currentUserId));
                }
            }

            // --- 2. FILTRES CLASSIQUES ---
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (squadId != null) {
                predicates.add(cb.equal(root.get("squad").get("id"), squadId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("firstName")), pattern),
                        cb.like(cb.lower(root.get("lastName")), pattern)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}