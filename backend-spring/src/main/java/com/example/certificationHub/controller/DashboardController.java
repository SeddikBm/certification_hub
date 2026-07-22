package com.example.certificationHub.controller;

import com.example.certificationHub.dto.response.DashboardStatsResponse;
import com.example.certificationHub.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINING_MANAGER')")
    public DashboardStatsResponse getDashboardStats() {
        return dashboardService.getStats();
    }
}
