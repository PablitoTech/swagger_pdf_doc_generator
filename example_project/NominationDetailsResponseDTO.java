package com.example.nominations.controller;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta con detalles de nominación")
public class NominationDetailsResponseDTO {
    @Schema(description = "ID de detalle")
    private Long id;

    // Getters setters
}
