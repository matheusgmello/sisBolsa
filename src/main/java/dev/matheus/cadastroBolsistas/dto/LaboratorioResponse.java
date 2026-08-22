package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Laboratorio;

public record LaboratorioResponse(
        int id,
        String nome,
        String areaPesquisa,
        String status,
        int capacidade,
        Integer coordenadorId,
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
                l.getCoordenadorId() > 0 ? l.getCoordenadorId() : null,
                l.getCoordenador(), l.isAtivo(), totalBolsistas, percentual);
    }
}
