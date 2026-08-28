package dev.matheus.cadastroBolsistas.dto;

import java.util.UUID;

public record LaboratorioRequest(
        String nome,
        String areaPesquisa,
        String status,
        Integer capacidade,
        UUID coordenadorId) {
}
