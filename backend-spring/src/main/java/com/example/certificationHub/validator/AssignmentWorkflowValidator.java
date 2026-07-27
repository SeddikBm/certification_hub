package com.example.certificationHub.validator;

import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.enumeration.StatusTraining;
import com.example.certificationHub.exception.ResourceConflictException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AssignmentWorkflowValidator {

    public void validateCertificationTransition(StatusCertification current, StatusCertification next) {
        if (current == next)
            return;

        boolean isValid = switch (current) {
            case PENDING_APPROVAL ->
                List.of(StatusCertification.APPROVED, StatusCertification.IN_PROGRESS, StatusCertification.CANCELLED).contains(next);
            case APPROVED -> 
                List.of(StatusCertification.PLANNED, StatusCertification.IN_PROGRESS, StatusCertification.CANCELLED).contains(next);
            case PLANNED -> 
                List.of(StatusCertification.IN_PROGRESS, StatusCertification.CANCELLED).contains(next);
            case IN_PROGRESS ->
                List.of(StatusCertification.EXAM_SCHEDULED, StatusCertification.COMPLETED, StatusCertification.CANCELLED).contains(next);
            case EXAM_SCHEDULED ->
                List.of(StatusCertification.COMPLETED, StatusCertification.FAILED, StatusCertification.CANCELLED).contains(next);
            case COMPLETED, FAILED, CANCELLED, EXPIRED -> false; // États terminaux
        };

        if (!isValid) {
            throw new ResourceConflictException(
                    "Transition de statut de certification invalide : " + current + " -> " + next);
        }
    }

    public void validateTrainingTransition(StatusTraining current, StatusTraining next) {
        if (current == next)
            return;

        boolean isValid = switch (current) {
            case PENDING_APPROVAL -> 
                List.of(StatusTraining.APPROVED, StatusTraining.IN_PROGRESS, StatusTraining.CANCELLED).contains(next);
            case APPROVED -> 
                List.of(StatusTraining.PLANNED, StatusTraining.IN_PROGRESS, StatusTraining.CANCELLED).contains(next);
            case PLANNED -> 
                List.of(StatusTraining.IN_PROGRESS, StatusTraining.CANCELLED).contains(next);
            case IN_PROGRESS -> 
                List.of(StatusTraining.COMPLETED, StatusTraining.CANCELLED).contains(next);
            case COMPLETED, CANCELLED -> false; // États terminaux
        };

        if (!isValid) {
            throw new ResourceConflictException(
                    "Transition de statut de formation invalide : " + current + " -> " + next);
        }
    }
}