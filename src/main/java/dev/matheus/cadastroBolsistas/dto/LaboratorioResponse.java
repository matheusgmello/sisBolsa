package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Laboratorio;

import java.util.UUID;

public record LaboratorioResponse(
        UUID id,
        String nome,
        String areaPesquisa,
        String status,
        int capacidade,
        UUID coordenadorId,
        String coordenador,
        boolean ativo,
        int totalBolsistas,
        double percentualOcupacao) {

    public static LaboratorioResponse de(Laboratorio l, int totalBolsistas) {
        if (l == null) {
            return null;
        }
        double percentual = l.getCapacidade() > 0
                ? (totalBolsistas / (double) l.getCapacidade()) * 100.0
                : 0.0;
        return new LaboratorioResponse(
                l.getId(), l.getNome(), l.getAreaPesquisa(), l.getStatus(), l.getCapacidade(),
                l.getCoordenadorId(),
                l.getCoordenador(), l.isAtivo(), totalBolsistas, percentual);
    }
}
