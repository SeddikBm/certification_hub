package com.example.certificationHub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "squad_lead_assignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SquadLeadAssignment {

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "lead_id")
        private UUID leadId;
        @Column(name = "squad_id")
        private UUID squadId;
    }

    @Builder.Default
    @EmbeddedId
    private Id id = new Id();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("leadId")
    @JoinColumn(name = "lead_id")
    private User lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("squadId")
    @JoinColumn(name = "squad_id")
    private Squad squad;
}