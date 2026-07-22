package com.example.certificationHub.service;

import com.example.certificationHub.dto.response.DashboardStatsResponse;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.CertificationSquadRepository;
import com.example.certificationHub.repository.SquadRepository;
import com.example.certificationHub.repository.TrainingRepository;
import com.example.certificationHub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CertificationRepository certificationRepository;
    private final TrainingRepository trainingRepository;
    private final UserRepository userRepository;
    private final SquadRepository squadRepository;
    private final CertificationSquadRepository certificationSquadRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        return DashboardStatsResponse.builder()
                .totalCertifications(certificationRepository.count())
                .totalTrainings(trainingRepository.count())
                .totalUsers(userRepository.count())
                .totalSquads(squadRepository.count())
                .certificationsByProvider(certificationRepository.countCertificationsByProvider())
                .certificationsBySquad(certificationSquadRepository.countCertificationsBySquad())
                .certificationsByDifficulty(certificationRepository.countCertificationsByDifficulty())
                .build();
    }
}
