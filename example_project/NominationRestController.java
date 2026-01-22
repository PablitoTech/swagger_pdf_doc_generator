package com.example.nominations.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@SecurityRequirement(name = "token")
@RestController
@RequestMapping("/api/v1/nominations")
public class NominationRestController {

    @Schema(name = "findDetailNom", description = "Obtiene los detalles de las nominaciones", example = "1,2,3")
    @PostMapping("/nom-detail")
    public ResponseEntity<NominationDetailsResponseDTO> findDetailNom(@RequestBody NominationIdsRequestDTO request) {
        return ResponseEntity.ok(new NominationDetailsResponseDTO());
    }

    @Operation(summary = "API para encontrar resumen de zarpe con filtros")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resumen de zarpe encontrado correctamente", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = ResumenZarpeWithFiltersDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Error en el procesamiento de la solicitud", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden. Cuando el usuario (application) no tiene los permisos adecuados para esta operación", content = @Content),
            @ApiResponse(responseCode = "404", description = "Not found", content = @Content) })
    @PostMapping("/find-resumen-with-filters")
    public ResponseEntity<List<ResumenZarpeWithFiltersDTO>> findResumenZarpeWithFilters(@RequestBody ZarpeWithFiltersRequestDTO request) {
        return ResponseEntity.ok(List.of(new ResumenZarpeWithFiltersDTO()));
    }
}
