package com.example.certificationHub.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class RatingResponse {
    private UUID userId;
    private String userFullName;
    private UUID certificationId;
    private Short rating;
    private String comment;
    private Boolean wouldRecommend;
    private Integer materialsQuality;
    private Integer difficulty;
    private Integer usefulness;
    private String squadName;
    private Boolean isReported;
}