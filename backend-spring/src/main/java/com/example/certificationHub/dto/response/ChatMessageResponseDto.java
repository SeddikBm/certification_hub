package com.example.certificationHub.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatMessageResponseDto {

    @JsonAlias({"answer", "response"})
    private String response;

    @Builder.Default
    @JsonAlias({"suggested_actions", "suggestedActions"})
    private List<String> suggestedActions = new ArrayList<>();

    @Builder.Default
    @JsonAlias({"retrieved_chunks", "sources"})
    private List<SourceInfo> sources = new ArrayList<>();

    @Builder.Default
    @JsonAlias({"latency_ms", "latencyMs"})
    private Long latencyMs = 0L;

    private String error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SourceInfo {
        private String type;

        @JsonAlias({"certification_title", "title"})
        private String title;

        @JsonAlias({"source_url", "url"})
        private String url;

        @Builder.Default
        private Double score = 0.0;
    }
}
