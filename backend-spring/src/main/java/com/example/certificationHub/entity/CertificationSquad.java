package com.example.certificationHub.entity;

import jakarta.persistence.*;

import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "certification_squads")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificationSquad {

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "certification_id")
        private UUID certificationId;
        @Column(name = "squad_id")
        private UUID squadId;
    }

    @Builder.Default
    @EmbeddedId
    private Id id = new Id();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("certificationId")
    @JoinColumn(name = "certification_id")
    private Certification certification;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("squadId")
    @JoinColumn(name = "squad_id")
    private Squad squad;

    private Short priority;
}