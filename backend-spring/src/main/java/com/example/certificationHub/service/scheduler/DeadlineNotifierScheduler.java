package com.example.certificationHub.service.scheduler;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.messaging.AssignmentEvent;
import com.example.certificationHub.messaging.NotificationProducer;
import com.example.certificationHub.repository.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeadlineNotifierScheduler {

    private final AssignmentRepository assignmentRepository;
    private final NotificationProducer notificationProducer;

    // S'exécute tous les jours à 08h00 du matin
    @Scheduled(cron = "0 0 8 * * ?")
    public void notifyUpcomingDeadlines() {
        log.info("Vérification des deadlines d'examen proches...");

        Instant inThreeDays = Instant.now().plus(3, ChronoUnit.DAYS);
        Instant inFourDays = Instant.now().plus(4, ChronoUnit.DAYS);

        List<Assignment> upcomingExams = assignmentRepository.findByStatusCertificationAndExamAtBetween(
                StatusCertification.EXAM_SCHEDULED, inThreeDays, inFourDays);

        for (Assignment assignment : upcomingExams) {
            notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                    .userId(assignment.getUser().getId())
                    .userEmail(assignment.getUser().getEmail())
                    .userFullName(assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName())
                    .assignmentId(assignment.getId())
                    .itemName("votre certification")
                    .eventType("DEADLINE_APPROACHING")
                    .build());
        }
    }
}