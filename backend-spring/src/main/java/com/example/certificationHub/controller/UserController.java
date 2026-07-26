package com.example.certificationHub.controller;

import com.example.certificationHub.enumeration.UserRole;
import com.example.certificationHub.enumeration.UserStatus;
import com.example.certificationHub.dto.request.ChangePasswordRequest;
import com.example.certificationHub.dto.request.UserCreateRequest;
import com.example.certificationHub.dto.response.UserResponse;
import com.example.certificationHub.dto.request.UserUpdateRequest;
import com.example.certificationHub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public Page<UserResponse> getUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UUID squadId,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));
        String currentUserRole = jwt.getClaimAsString("role");

        return userService.getUsers(role, squadId, status, search, pageable, currentUserId, currentUserRole);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UserUpdateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));
        String currentUserRole = jwt.getClaimAsString("role");

        return userService.updateUser(id, request, currentUserId, currentUserRole);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
    }

    @PostMapping("/change-password")
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("user_id"));

        userService.changePassword(currentUserId, request);
    }
}