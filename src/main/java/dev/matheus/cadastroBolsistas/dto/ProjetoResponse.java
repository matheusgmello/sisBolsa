package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Projeto;

public record ProjetoResponse(
        int id,
        String nome,
        String descricao,
        Integer laboratorioId,
        String nomeLaboratorio,
        boolean ativo) {

    public static ProjetoResponse de(Projeto p) {
        if (p == null) {
            return null;
        }
        return new ProjetoResponse(
                p.getId(), p.getNome(), p.getDescricao(),
                p.getLaboratorioId() > 0 ? p.getLaboratorioId() : null,
                p.getNomeLaboratorio(), p.isAtivo());
    }
}
