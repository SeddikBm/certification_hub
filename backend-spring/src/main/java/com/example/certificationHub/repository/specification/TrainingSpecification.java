package com.example.certificationHub.repository.specification;

import com.example.certificationHub.entity.Training;
import com.example.certificationHub.enumeration.TrainingPriority;
import com.example.certificationHub.enumeration.TrainingType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

public class TrainingSpecification {

    public static Specification<Training> withDynamicFilters(String provider, TrainingType type,
            TrainingPriority priority, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Toujours ignorer les soft-deleted
            predicates.add(cb.isNull(root.get("deletedAt")));

            // 2. Filtres exacts
            if (provider != null && !provider.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("provider")), provider.toLowerCase()));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            // 3. Recherche Full-Text (sur titre)
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), searchPattern);
                Predicate providerMatch = cb.like(cb.lower(root.get("provider")), searchPattern);
                predicates.add(cb.or(titleMatch, providerMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
