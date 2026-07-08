package com.example.certificationHub.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "certification_ratings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificationRating {

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "user_id")
        private UUID userId;
        @Column(name = "certification_id")
        private UUID certificationId;
    }

    @Builder.Default
    @EmbeddedId
    private Id id = new Id();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("certificationId")
    @JoinColumn(name = "certification_id")
    private Certification certification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    @NotNull(message = "Le rating est obligatoire")
    @Min(value = 1, message = "Le rating minimale est 1")
    @Max(value = 5, message = "Le rating maximale est 5")
    private Short rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "would_recommend", nullable = false)
    @Builder.Default
    private Boolean wouldRecommend = true;
}