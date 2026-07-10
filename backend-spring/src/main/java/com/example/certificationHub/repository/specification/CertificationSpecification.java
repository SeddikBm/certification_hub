package com.example.certificationHub.repository.specification;

import com.example.certificationHub.entity.Certification;
import com.example.certificationHub.enumeration.CertifDifficulty;
import com.example.certificationHub.enumeration.CertifPriority;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

public class CertificationSpecification {

    public static Specification<Certification> withDynamicFilters(String provider, CertifDifficulty difficulty,
            CertifPriority priority, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Toujours ignorer les soft-deleted
            predicates.add(cb.isNull(root.get("deletedAt")));

            // 2. Filtres exacts
            if (provider != null && !provider.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("provider")), provider.toLowerCase()));
            }
            if (difficulty != null) {
                predicates.add(cb.equal(root.get("difficulty"), difficulty));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            // 3. Recherche Full-Text (sur code ou nom)
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), searchPattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                predicates.add(cb.or(codeMatch, nameMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}