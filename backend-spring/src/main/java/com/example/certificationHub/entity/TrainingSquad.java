package com.example.certificationHub.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "training_squads")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingSquad {

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "training_id")
        private UUID trainingId;
        @Column(name = "squad_id")
        private UUID squadId;
    }

    @Builder.Default
    @EmbeddedId
    private Id id = new Id();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("trainingId")
    @JoinColumn(name = "training_id")
    private Training training;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("squadId")
    @JoinColumn(name = "squad_id")
    private Squad squad;

    private Short priority;
}
