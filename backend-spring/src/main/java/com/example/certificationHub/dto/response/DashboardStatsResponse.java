package com.example.certificationHub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalCertifications;
    private long totalTrainings;
    private long totalUsers;
    private long totalSquads;
    
    private List<ChartDataResponse> certificationsByProvider;
    private List<ChartDataResponse> certificationsBySquad;
    private List<ChartDataResponse> certificationsByDifficulty;
}
