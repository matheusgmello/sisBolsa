package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Projeto;

import java.util.UUID;

public record ProjetoResponse(
        UUID id,
        String nome,
        String descricao,
        UUID laboratorioId,
        String nomeLaboratorio,
        boolean ativo,
        int totalMembros,
        String linkRepositorio,
        String linkDocumentacao) {

    public static ProjetoResponse de(Projeto p) {
        return de(p, 0);
    }

    public static ProjetoResponse de(Projeto p, int totalMembros) {
        if (p == null) {
            return null;
        }
        return new ProjetoResponse(
                p.getId(), p.getNome(), p.getDescricao(),
                p.getLaboratorioId(),
                p.getNomeLaboratorio(), p.isAtivo(), totalMembros,
                p.getLinkRepositorio(), p.getLinkDocumentacao());
    }
}
