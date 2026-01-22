package com.example.nominations.controller;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Filtros para búsqueda de zarpes")
public class ZarpeWithFiltersRequestDTO {
    @Schema(description = "Fecha inicio", example = "2024-01-01")
    private String startDate;

    // getters setters
}
