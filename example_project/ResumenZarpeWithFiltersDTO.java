package com.example.nominations.controller;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resumen de Zarpe")
public class ResumenZarpeWithFiltersDTO {
    @Schema(description = "Nombre del buque")
    private String vesselName;

    // getters setters
}
