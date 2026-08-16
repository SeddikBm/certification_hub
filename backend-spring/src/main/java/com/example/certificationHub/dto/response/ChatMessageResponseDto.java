package com.example.certificationHub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponseDto {

    private String response;

    @Builder.Default
    private List<String> suggestedActions = new ArrayList<>();

    @Builder.Default
    private List<SourceInfo> sources = new ArrayList<>();

    private long latencyMs;
    private String error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceInfo {
        private String type;
        private String title;
        private String url;
        private double score;
    }
}
