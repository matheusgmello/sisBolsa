package dev.matheus.cadastroBolsistas.dto;

import java.util.UUID;

public record ProjetoRequest(
        String nome,
        String descricao,
        UUID laboratorioId,
        String linkRepositorio,
        String linkDocumentacao) {
}
