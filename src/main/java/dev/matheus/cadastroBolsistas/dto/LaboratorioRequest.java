package dev.matheus.cadastroBolsistas.dto;

public record LaboratorioRequest(
        String nome,
        String areaPesquisa,
        String status,
        Integer capacidade,
        Integer coordenadorId) {
}
