package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Projeto;

import java.util.UUID;

public record ProjetoResponse(
        UUID id,
        String nome,
        String descricao,
        UUID laboratorioId,
        String nomeLaboratorio,
        boolean ativo) {

    public static ProjetoResponse de(Projeto p) {
        if (p == null) {
            return null;
        }
        return new ProjetoResponse(
                p.getId(), p.getNome(), p.getDescricao(),
                p.getLaboratorioId(),
                p.getNomeLaboratorio(), p.isAtivo());
    }
}
