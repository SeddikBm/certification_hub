package com.example.certificationHub.mapper;

import com.example.certificationHub.entity.Training;
import com.example.certificationHub.entity.TrainingSquad;
import com.example.certificationHub.dto.request.TrainingRequest;
import com.example.certificationHub.dto.response.TrainingResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class TrainingMapper {

    public TrainingResponse toResponse(Training training) {
        if (training == null)
            return null;

        Map<String, Object> meta = training.getMetadata();
        String description = meta != null && meta.containsKey("description") ? meta.get("description").toString()
                : null;
        String language = meta != null && meta.containsKey("language") ? meta.get("language").toString() : null;

        return TrainingResponse.builder()
                .id(training.getId())
                .title(training.getTitle())
                .type(training.getType() != null ? training.getType().name() : null)
                .provider(training.getProvider())
                .priority(training.getPriority() != null ? training.getPriority().name() : null)
                .description(description)
                .language(language)
                .durationHours(training.getDurationHours())
                .costUsd(training.getCostUsd())
                .url(training.getUrl())
                .metadata(training.getMetadata())
                .build();
    }

    public TrainingResponse toDetailedResponse(Training training, List<TrainingSquad> squads) {
        TrainingResponse response = toResponse(training);

        if (squads != null) {
            List<TrainingResponse.SquadShortDto> squadDtos = squads.stream()
                    .map(ts -> TrainingResponse.SquadShortDto.builder()
                            .id(ts.getSquad().getId())
                            .name(ts.getSquad().getName())
                            .priority(ts.getPriority())
                            .build())
                    .toList();
            response.setAssociatedSquads(squadDtos);
        }
        return response;
    }

    public Training toEntity(TrainingRequest request) {
        if (request == null)
            return null;

        Training training = Training.builder()
                .title(request.getTitle())
                .type(request.getType())
                .provider(request.getProvider())
                .priority(request.getPriority())
                .durationHours(request.getDurationHours())
                .costUsd(request.getCostUsd())
                .url(request.getUrl())
                .metadata(buildMetadata(request))
                .build();
        return training;
    }

    public void updateEntity(Training training, TrainingRequest request) {
        if (request == null || training == null)
            return;

        training.setTitle(request.getTitle());
        training.setType(request.getType());
        training.setProvider(request.getProvider());
        training.setPriority(request.getPriority());
        training.setDurationHours(request.getDurationHours());
        training.setCostUsd(request.getCostUsd());
        training.setUrl(request.getUrl());
        training.setMetadata(buildMetadata(request));
    }

    // Gère l'injection de description et language dans JSONB
    private Map<String, Object> buildMetadata(TrainingRequest request) {
        Map<String, Object> meta = request.getMetadata() != null ? new HashMap<>(request.getMetadata())
                : new HashMap<>();
        if (request.getDescription() != null)
            meta.put("description", request.getDescription());
        if (request.getLanguage() != null)
            meta.put("language", request.getLanguage());
        return meta;
    }
}