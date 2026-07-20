package com.example.certificationHub.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WelcomeEmailEvent {
    private String email;
    private String firstName;
    private String lastName;
    private String rawPassword;
}
