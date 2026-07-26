package com.example.certificationHub.controller;

import com.example.certificationHub.enumeration.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reference-data")
@Tag(name = "Reference Data", description = "Endpoints for fetching application enums and helper lists")
public class ReferenceDataController {

    @Operation(summary = "Get all enumerations", description = "Returns lists of possible values for all application enums")
    @GetMapping("/enums")
    public ResponseEntity<Map<String, Object[]>> getAllEnums() {
        Map<String, Object[]> enums = new HashMap<>();

        enums.put("certifDifficulty", CertifDifficulty.values());
        enums.put("certifPriority", CertifPriority.values());
        enums.put("certificateStatus", CertificateStatus.values());
        enums.put("itemType", ItemType.values());
        enums.put("notificationType", NotificationType.values());
        enums.put("statusCertification", StatusCertification.values());
        enums.put("statusTraining", StatusTraining.values());
        enums.put("trainingPriority", TrainingPriority.values());
        enums.put("trainingType", TrainingType.values());
        enums.put("userRole", UserRole.values());
        enums.put("userStatus", UserStatus.values());

        return ResponseEntity.ok(enums);
    }
}
