package com.example.certificationHub.dto.response;

import java.time.LocalDate;
import java.util.UUID;

import com.example.certificationHub.enumeration.UserRole;
import com.example.certificationHub.enumeration.UserStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private UserStatus status;
    private String phone;
    private LocalDate hireDate;
    private UUID squadId;
    private String squadName;
}