package com.example.certificationHub.service;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.Certification;
import com.example.certificationHub.entity.CertificationRating;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.ItemType;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.dto.request.RatingCreateRequest;
import com.example.certificationHub.dto.response.RatingResponse;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.mapper.CertificationRatingMapper;
import com.example.certificationHub.messaging.AssignmentEvent;
import com.example.certificationHub.messaging.NotificationProducer;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.CertificationRatingRepository;
import com.example.certificationHub.repository.CertificationRepository;
import com.example.certificationHub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificationRatingService {

    private final CertificationRatingRepository ratingRepository;
    private final CertificationRepository certificationRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CertificationRatingMapper ratingMapper;
    private final NotificationProducer notificationProducer; // Pour la modération

    @Transactional(readOnly = true)
    public Page<RatingResponse> getRatings(UUID certId, Pageable pageable) {
        if (!certificationRepository.existsById(certId)) {
            throw new ResourceNotFoundException("Certification introuvable");
        }
        return ratingRepository.findByCertificationId(certId, pageable).map(ratingMapper::toResponse);
    }

    @Transactional
    public RatingResponse addRating(UUID certId, RatingCreateRequest request, UUID currentUserId) {
        User user = userRepository.findById(currentUserId).orElseThrow();
        Certification cert = certificationRepository.findById(certId)
                .orElseThrow(() -> new ResourceNotFoundException("Certification introuvable"));

        // 1. VÉRIFICATION : L'utilisateur a-t-il complété cette certification ?
        List<Assignment> assignments = assignmentRepository.findByUserIdAndItemIdAndItemTypeAndStatusCertification(
                currentUserId, certId, ItemType.CERTIFICATION, StatusCertification.COMPLETED);

        if (assignments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous devez avoir complété cette certification pour laisser un avis.");
        }
        Assignment completedAssignment = assignments.get(0);

        // 2. CRÉATION OU MISE À JOUR DE LA NOTE
        CertificationRating.Id ratingId = new CertificationRating.Id(currentUserId, certId);

        CertificationRating rating = CertificationRating.builder()
                .id(ratingId)
                .user(user)
                .certification(cert)
                .assignment(completedAssignment)
                .rating(request.getRating())
                .wouldRecommend(request.getWouldRecommend() != null ? request.getWouldRecommend() : true)
                .comment(ratingMapper.formatCommentWithDetails(request))
                .build();

        CertificationRating savedRating = ratingRepository.save(rating);

        // 3. MISE À JOUR DE LA MOYENNE DANS LES MÉTADONNÉES DE LA CERTIFICATION
        updateCertificationStatistics(cert);

        return ratingMapper.toResponse(savedRating);
    }

    private void updateCertificationStatistics(Certification cert) {
        Double avg = ratingRepository.getAverageRating(cert.getId());
        Long count = ratingRepository.countByCertificationId(cert.getId());

        Map<String, Object> meta = cert.getMetadata() != null ? new HashMap<>(cert.getMetadata()) : new HashMap<>();

        // Arrondir à 1 décimale
        double roundedAvg = Math.round((avg != null ? avg : 0.0) * 10.0) / 10.0;

        meta.put("averageRating", roundedAvg);
        meta.put("ratingCount", count);

        cert.setMetadata(meta);
        certificationRepository.save(cert);
    }

    @Transactional
    public void reportInappropriateRating(UUID certId, UUID authorId, UUID reporterId) {
        CertificationRating.Id ratingId = new CertificationRating.Id(authorId, certId);
        if (!ratingRepository.existsById(ratingId)) {
            throw new ResourceNotFoundException("Avis introuvable");
        }

        Certification cert = certificationRepository.findById(certId).orElseThrow();
        User reporter = userRepository.findById(reporterId).orElseThrow();

        // On envoie une notification aux ADMINS pour modération via RabbitMQ
        notificationProducer.sendAssignmentEvent(AssignmentEvent.builder()
                .userId(reporterId) // Optionnel : l'admin cible
                .userEmail("admin@certificationhub.com")
                .userFullName("Administrateur")
                .itemName(cert.getName())
                .eventType("REVIEW_REPORTED")
                .build());
    }
}