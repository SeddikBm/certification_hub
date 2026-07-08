package com.example.certificationHub.entity;

import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.enumeration.StatusTraining;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "assignments")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Assignment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    private ItemType itemType;

    @Column(name = "item_id", nullable = false)
    private UUID itemId; // Référence soit une Certification, soit un Training

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id")
    private User assignedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_certification")
    private StatusCertification statusCertification;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_training")
    private StatusTraining statusTraining;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "exam_at")
    private Instant examAt;

    @Column(name = "training_progress_percentage")
    private Short trainingProgressPercentage;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;
}