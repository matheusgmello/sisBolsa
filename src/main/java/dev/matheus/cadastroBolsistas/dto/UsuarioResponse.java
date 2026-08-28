package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Usuario;

import java.time.LocalDate;
import java.util.UUID;

/*
 * representacao publica de um usuario com IDs em UUID.
 */
public record UsuarioResponse(
        UUID id,
        String nome,
        String email,
        String tipoUsuario,
        String fotoUrl,
        String bio,
        boolean ativo,
        String curso,
        String matricula,
        String cpf,
        String telefone,
        LocalDate dataNascimento,
        UUID laboratorioId,
        String nomeLaboratorio,
        String cargo) {

    public static UsuarioResponse de(Usuario u) {
        if (u == null) {
            return null;
        }
        if (u instanceof Bolsista b) {
            return new UsuarioResponse(
                    b.getId(), b.getNome(), b.getEmail(), b.getTipoUsuario(), b.getFotoUrl(), b.getBio(),
                    b.isAtivo(), b.getCurso(), b.getMatricula(), b.getCpf(), b.getTelefone(),
                    b.getDataNascimento(),
                    b.getLaboratorioId(),
                    b.getNomeLaboratorio(),
                    b.getCargo() != null ? b.getCargo().name() : null);
        }
        return new UsuarioResponse(
                u.getId(), u.getNome(), u.getEmail(), u.getTipoUsuario(), u.getFotoUrl(), u.getBio(),
                u.isAtivo(), null, null, null, null, null, null, u.getNomeLaboratorio(), null);
    }
}
