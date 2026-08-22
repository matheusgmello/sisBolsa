package dev.matheus.cadastroBolsistas.dto;

import java.time.LocalDate;

/*
 * o que a api aceita para criar ou editar um usuario.
 * senha opcional na edicao: vazia significa "mantem a que ja esta la".
 */
public record BolsistaRequest(
        String nome,
        String email,
        String senha,
        LocalDate dataNascimento,
        String curso,
        String matricula,
        String cpf,
        String telefone,
        Integer laboratorioId,
        String tipoUsuario,
        String fotoUrl,
        String cargo,
        String bio) {
}
