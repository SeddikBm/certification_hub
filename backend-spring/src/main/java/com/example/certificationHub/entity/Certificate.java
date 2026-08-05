package com.example.certificationHub.entity;

import com.example.certificationHub.enumeration.CertificateStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "certificates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Integer fileSize;

    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String storagePath;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private CertificateStatus status;

    /**
     * Résultats de la validation IA (FastAPI backend-ai).
     * Stocke: decision, scores {name, title, date, overall}, reasons[], source, extracted {holder_name, ...}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_details", columnDefinition = "jsonb")
    private Map<String, Object> validationDetails;
}