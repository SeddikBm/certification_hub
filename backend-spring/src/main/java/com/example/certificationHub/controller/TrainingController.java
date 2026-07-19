package com.example.certificationHub.controller;

import com.example.certificationHub.enumeration.TrainingPriority;
import com.example.certificationHub.enumeration.TrainingType;
import com.example.certificationHub.dto.request.TrainingRequest;
import com.example.certificationHub.dto.response.TrainingResponse;
import com.example.certificationHub.service.TrainingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/trainings")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;

    @GetMapping
    public Page<TrainingResponse> getAllTrainings(
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) TrainingType type,
            @RequestParam(required = false) TrainingPriority priority,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return trainingService.getTrainings(provider, type, priority, search, pageable);
    }

    @GetMapping("/{id}")
    public TrainingResponse getTrainingById(@PathVariable UUID id) {
        return trainingService.getTrainingDetails(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingResponse createTraining(@Valid @RequestBody TrainingRequest request) {
        return trainingService.createTraining(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    public TrainingResponse updateTraining(@PathVariable UUID id, @Valid @RequestBody TrainingRequest request) {
        return trainingService.updateTraining(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTraining(@PathVariable UUID id) {
        trainingService.deleteTraining(id);
    }
}