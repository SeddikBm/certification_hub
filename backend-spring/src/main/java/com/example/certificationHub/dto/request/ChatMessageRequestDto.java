package com.example.certificationHub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequestDto {

    @NotBlank(message = "Message cannot be blank")
    private String message;

    @Builder.Default
    private List<HistoryMessage> history = new ArrayList<>();

    private UUID certificationId;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryMessage {
        private String role; // "user" | "assistant" | "system"
        private String content;
    }
}
