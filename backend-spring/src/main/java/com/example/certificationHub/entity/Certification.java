package com.example.certificationHub.entity;

import com.example.certificationHub.enumeration.CertifDifficulty;
import com.example.certificationHub.enumeration.CertifPriority;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "certifications")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 100)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String provider;

    @Enumerated(EnumType.STRING)
    private CertifDifficulty difficulty;

    @Enumerated(EnumType.STRING)
    private CertifPriority priority;

    @Column(name = "exam_cost_usd")
    private BigDecimal examCostUsd;

    @Column(name = "training_cost_usd")
    private BigDecimal trainingCostUsd;

    @Column(name = "validity_months")
    private Integer validityMonths;

    @Column(name = "official_url", columnDefinition = "TEXT")
    private String officialUrl;

    @Column(name = "exam_provider_url", columnDefinition = "TEXT")
    private String examProviderUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;
}
