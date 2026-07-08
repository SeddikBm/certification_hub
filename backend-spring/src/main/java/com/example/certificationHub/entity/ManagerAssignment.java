package com.example.certificationHub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "manager_assignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerAssignment {

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "manager_id")
        private UUID managerId;
        @Column(name = "collaborator_id")
        private UUID collaboratorId;
    }

    @Builder.Default
    @EmbeddedId
    private Id id = new Id();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("managerId")
    @JoinColumn(name = "manager_id")
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("collaboratorId")
    @JoinColumn(name = "collaborator_id")
    private User collaborator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id")
    private User assignedBy;
}