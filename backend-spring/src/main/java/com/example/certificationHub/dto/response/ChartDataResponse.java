package com.example.certificationHub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataResponse {
    private String label;
    private Long value;
    private Long certificationsCount;
    private Long trainingsCount;

    public ChartDataResponse(String label, Long value) {
        this.label = label;
        this.value = value;
    }
}
