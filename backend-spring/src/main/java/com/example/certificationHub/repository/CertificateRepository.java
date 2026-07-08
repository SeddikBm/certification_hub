package com.example.certificationHub.repository;

import com.example.certificationHub.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    List<Certificate> findByUserId(UUID userId);

    List<Certificate> findByAssignmentId(UUID assignmentId);
}