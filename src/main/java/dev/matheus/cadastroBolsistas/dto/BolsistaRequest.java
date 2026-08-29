package dev.matheus.cadastroBolsistas.dto;

import java.time.LocalDate;
import java.util.UUID;

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
        UUID laboratorioId,
        String tipoUsuario,
        String fotoUrl,
        String cargo,
        String modalidadeBolsa,
        Double valorBolsa,
        LocalDate dataInicioBolsa,
        LocalDate dataFimBolsa,
        String bio) {
}
