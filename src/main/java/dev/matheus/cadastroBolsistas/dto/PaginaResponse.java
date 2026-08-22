package dev.matheus.cadastroBolsistas.dto;

import java.util.List;

public record PaginaResponse<T>(List<T> itens, int pagina, int totalPaginas, int totalItens) {
}
