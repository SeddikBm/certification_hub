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
        log.info("Vérification des deadlines et dates cibles à J-7...");

        Instant now = Instant.now();
        Instant inSevenDaysStart = now.plus(7, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);
        Instant inSevenDaysEnd = inSevenDaysStart.plus(1, ChronoUnit.DAYS);

        // 1. Examens programmés dans 7 jours
        List<Assignment> upcomingExams = assignmentRepository.findByStatusCertificationAndExamAtBetween(
                StatusCertification.EXAM_SCHEDULED, inSevenDaysStart, inSevenDaysEnd);

        for (Assignment assignment : upcomingExams) {
            String itemName = assignment.getItemType().name();
            notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                    .userId(assignment.getUser().getId())
                    .userEmail(assignment.getUser().getEmail())
                    .userFullName(assignment.getUser().getFirstName() + " " + assignment.getUser().getLastName())
                    .assignmentId(assignment.getId())
                    .itemName(itemName)
                    .eventType("DEADLINE_APPROACHING")
                    .actionUrl("/my-assignments")
                    .build());
        }

        // 2. Assignations dont la date cible est dans les 7 prochains jours ET sans examen encore planifié
        List<Assignment> allActive = assignmentRepository.findAll();
        for (Assignment a : allActive) {
            // Ignorer si déjà terminé, ou si un examen a DEJA été planifié (examAt != null ou status == EXAM_SCHEDULED)
            if (a.getCompletedAt() != null) continue;
            if (a.getExamAt() != null) continue;
            if (a.getStatusCertification() == StatusCertification.EXAM_SCHEDULED) continue;

            if (a.getMetadata() != null && a.getMetadata().containsKey("targetDate")) {
                try {
                    Instant targetDate = Instant.parse(a.getMetadata().get("targetDate").toString());
                    // Si la date cible entre dans les 7 prochains jours
                    if (targetDate.isAfter(now) && targetDate.isBefore(inSevenDaysEnd)) {
                        String itemName = a.getItemType().name();
                        notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                                .userId(a.getUser().getId())
                                .userEmail(a.getUser().getEmail())
                                .userFullName(a.getUser().getFirstName() + " " + a.getUser().getLastName())
                                .assignmentId(a.getId())
                                .itemName(itemName)
                                .eventType("DEADLINE_APPROACHING")
                                .actionUrl("/my-assignments")
                                .build());
                    }
                } catch (Exception ignored) {}
            }
        }
    }
}