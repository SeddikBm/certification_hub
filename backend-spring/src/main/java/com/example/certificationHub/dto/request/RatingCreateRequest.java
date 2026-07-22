package com.example.certificationHub.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RatingCreateRequest {
    @NotNull(message = "La note est obligatoire")
    @Min(value = 1, message = "La note minimum est 1")
    @Max(value = 5, message = "La note maximum est 5")
    private Short rating;

    private String comment;

    @NotNull(message = "La recommandation est obligatoire")
    private Boolean wouldRecommend;

    // Champs supplémentaires demandés par le frontend
    @Min(1)
    @Max(5)
    private Integer materialsQuality;

    @Min(1)
    @Max(5)
    private Integer difficulty;

    @Min(1)
    @Max(5)
    private Integer usefulness;
}