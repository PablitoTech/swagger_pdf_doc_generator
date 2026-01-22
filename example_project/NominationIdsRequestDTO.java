package com.example.nominations.controller;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "DTO de solicitud de IDs de nominación")
public class NominationIdsRequestDTO {
    @Schema(description = "Lista de IDs", example = "[1, 2]")
    private List<Long> idNoms;

    public List<Long> getIdNoms() { return idNoms; }
    public void setIdNoms(List<Long> idNoms) { this.idNoms = idNoms; }
}
