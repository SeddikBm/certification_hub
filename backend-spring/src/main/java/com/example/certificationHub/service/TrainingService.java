package com.example.certificationHub.service;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.Squad;
import com.example.certificationHub.entity.Training;
import com.example.certificationHub.entity.TrainingSquad;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.StatusTraining;
import com.example.certificationHub.enumeration.TrainingPriority;
import com.example.certificationHub.enumeration.TrainingType;
import com.example.certificationHub.dto.request.TrainingRequest;
import com.example.certificationHub.dto.response.TrainingResponse;
import com.example.certificationHub.exception.ResourceConflictException;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.mapper.TrainingMapper;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.SquadRepository;
import com.example.certificationHub.repository.TrainingRepository;
import com.example.certificationHub.repository.TrainingSquadRepository;
import com.example.certificationHub.repository.specification.TrainingSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TrainingSquadRepository trainingSquadRepository;
    private final SquadRepository squadRepository;
    private final AssignmentRepository assignmentRepository;
    private final TrainingMapper trainingMapper;

    @Transactional(readOnly = true)
    public Page<TrainingResponse> getTrainings(String provider, TrainingType type, TrainingPriority priority,
            String search, Pageable pageable) {
        return trainingRepository
                .findAll(TrainingSpecification.withDynamicFilters(provider, type, priority, search), pageable)
                .map(trainingMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public TrainingResponse getTrainingDetails(UUID id) {
        Training training = trainingRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formation introuvable"));

        List<TrainingSquad> squads = trainingSquadRepository.findByTrainingId(id);
        return trainingMapper.toDetailedResponse(training, squads);
    }

    @Transactional
    public TrainingResponse createTraining(TrainingRequest request) {
        if (trainingRepository.existsByTitleAndDeletedAtIsNull(request.getTitle())) {
            throw new ResourceConflictException("Une formation avec ce titre existe déjà");
        }

        Training training = trainingMapper.toEntity(request);
        Training savedTraining = trainingRepository.save(training);
        assignToSquads(savedTraining, request.getSquads());

        return trainingMapper.toResponse(savedTraining);
    }

    @Transactional
    public TrainingResponse updateTraining(UUID id, TrainingRequest request) {
        Training training = trainingRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formation introuvable"));

        if (!training.getTitle().equals(request.getTitle())
                && trainingRepository.existsByTitleAndDeletedAtIsNull(request.getTitle())) {
            throw new ResourceConflictException("Ce nouveau titre de formation existe déjà");
        }

        trainingMapper.updateEntity(training, request);
        trainingSquadRepository.deleteByTrainingId(id);
        assignToSquads(training, request.getSquads());

        return trainingMapper.toResponse(trainingRepository.save(training));
    }

    @Transactional
    public void deleteTraining(UUID id) {
        Training training = trainingRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formation introuvable"));

        // États actifs pour une formation : PENDING_APPROVAL, APPROVED, PLANNED,
        // IN_PROGRESS
        List<Assignment> activeAssignments = assignmentRepository.findByItemTypeAndItemId(ItemType.TRAINING, id)
                .stream()
                .filter(a -> List
                        .of(StatusTraining.PENDING_APPROVAL, StatusTraining.APPROVED, StatusTraining.PLANNED,
                                StatusTraining.IN_PROGRESS)
                        .contains(a.getStatusTraining()))
                .toList();

        if (!activeAssignments.isEmpty()) {
            throw new ResourceConflictException(
                    "Impossible de supprimer : des collaborateurs sont actuellement assignés à cette formation.");
        }

        training.setDeletedAt(Instant.now());
        trainingRepository.save(training);
    }

    private void assignToSquads(Training training, List<TrainingRequest.SquadPriorityDto> squadDtos) {
        for (var dto : squadDtos) {
            Squad squad = squadRepository.findById(dto.getSquadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Squad ID " + dto.getSquadId() + " introuvable"));

            TrainingSquad ts = new TrainingSquad();
            ts.getId().setTrainingId(training.getId());
            ts.getId().setSquadId(squad.getId());
            ts.setTraining(training);
            ts.setSquad(squad);
            ts.setPriority(dto.getPriority());

            trainingSquadRepository.save(ts);
        }
    }
}