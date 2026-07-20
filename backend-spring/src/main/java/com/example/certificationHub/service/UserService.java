package com.example.certificationHub.service;

import com.example.certificationHub.entity.Assignment;
import com.example.certificationHub.entity.Squad;
import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.StatusCertification;
import com.example.certificationHub.enumeration.StatusTraining;
import com.example.certificationHub.enumeration.UserStatus;
import com.example.certificationHub.dto.request.ChangePasswordRequest;
import com.example.certificationHub.dto.request.UserCreateRequest;
import com.example.certificationHub.dto.request.UserUpdateRequest;
import com.example.certificationHub.dto.response.UserResponse;
import com.example.certificationHub.exception.ResourceConflictException;
import com.example.certificationHub.exception.ResourceNotFoundException;
import com.example.certificationHub.mapper.UserMapper;
import com.example.certificationHub.messaging.NotificationProducer;
import com.example.certificationHub.messaging.WelcomeEmailEvent;
import com.example.certificationHub.repository.AssignmentRepository;
import com.example.certificationHub.repository.ManagerAssignmentRepository;
import com.example.certificationHub.repository.SquadRepository;
import com.example.certificationHub.repository.UserRepository;
import com.example.certificationHub.security.repository.RefreshTokenRepository;
import com.example.certificationHub.repository.specification.UserSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SquadRepository squadRepository;
    private final ManagerAssignmentRepository managerAssignmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final NotificationProducer notificationProducer;

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String role, UUID squadId, UserStatus status, String search, Pageable pageable,
            UUID currentUserId, String currentUserRole) {

        List<UUID> managedUserIds = new ArrayList<>();
        List<UUID> leadSquadIds = new ArrayList<>();

        if ("CAREER_MANAGER".equals(currentUserRole)) {
            managedUserIds = managerAssignmentRepository.findByManagerId(currentUserId).stream()
                    .map(ma -> ma.getCollaborator().getId())
                    .toList();
        } else if ("SQUAD_LEAD".equals(currentUserRole)) {
            // Le Lead récupère son propre profil pour connaître son Squad
            User currentLead = userRepository.findById(currentUserId).orElseThrow();
            if (currentLead.getSquad() != null) {
                leadSquadIds.add(currentLead.getSquad().getId());
            }
        }

        return userRepository.findAll(
                UserSpecification.withSecurityAndFilters(role, squadId, status, search, currentUserId, currentUserRole,
                        managedUserIds, leadSquadIds),
                pageable).map(userMapper::toResponse);
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("L'email est déjà utilisé");
        }

        Squad squad = null;
        if (request.getSquadId() != null) {
            squad = squadRepository.findById(request.getSquadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Squad introuvable"));
        }

        User user = userMapper.toEntity(request);

        // Hashage du mot de passe saisi par l'admin dans le form
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setSquad(squad);

        User savedUser = userRepository.save(user);

        notificationProducer.sendWelcomeEmail(WelcomeEmailEvent.builder()
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .rawPassword(request.getPassword()) // À envoyer par mail (optionnel selon politique sécu)
                .build());

        return userMapper.toResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(UUID targetUserId, UserUpdateRequest request, UUID currentUserId,
            String currentUserRole) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        boolean isAdmin = "ADMIN".equals(currentUserRole);
        boolean isSelf = targetUserId.equals(currentUserId);

        if (!isAdmin && !isSelf) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez modifier que votre propre profil");
        }

        // Modification de l'email (si fourni, différent, et non utilisé)
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceConflictException("Cet email est déjà utilisé par un autre utilisateur");
            }
            user.setEmail(request.getEmail());
        }

        // Application du reste via le mapper
        userMapper.updateEntity(user, request);

        // Mise à jour des privilèges (UNIQUEMENT pour l'admin)
        if (isAdmin) {
            if (request.getRole() != null)
                user.setRole(request.getRole());
            if (request.getStatus() != null)
                user.setStatus(request.getStatus());

            if (request.getSquadId() != null) {
                Squad squad = squadRepository.findById(request.getSquadId())
                        .orElseThrow(() -> new ResourceNotFoundException("Squad introuvable"));
                user.setSquad(squad);
            } else {
                user.setSquad(null);
            }
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // Vérification de toutes les assignations nécessitant une action
        List<Assignment> activeAssignments = assignmentRepository.findByUserId(targetUserId).stream()
                .filter(a -> List.of(StatusCertification.PENDING_APPROVAL, StatusCertification.APPROVED,
                        StatusCertification.PLANNED, StatusCertification.IN_PROGRESS,
                        StatusCertification.EXAM_SCHEDULED)
                        .contains(a.getStatusCertification())
                        || List.of(StatusTraining.PENDING_APPROVAL, StatusTraining.APPROVED, StatusTraining.PLANNED,
                                StatusTraining.IN_PROGRESS).contains(a.getStatusTraining()))
                .toList();

        if (!activeAssignments.isEmpty()) {
            throw new ResourceConflictException(
                    "Impossible de désactiver : l'utilisateur a des assignations actives (en cours, planifiées ou en attente d'approbation).");
        }

        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(targetUserId);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'ancien mot de passe est incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(userId);
    }
}