package dev.matheus.cadastroBolsistas.dto;

public record RedefinirSenhaRequest(
        String email,
        String codigo,
        String novaSenha,
        String confirmaSenha) {
}
