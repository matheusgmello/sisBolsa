package dev.matheus.cadastroBolsistas.dto;

/*
 * atualizacao do proprio perfil. os tres campos de senha so importam juntos:
 * trocar a senha exige a atual, a nova e a confirmacao.
 */
public record PerfilRequest(
        String nome,
        String email,
        String fotoUrl,
        String bio,
        String senhaAtual,
        String senha,
        String confirmaSenha) {
}
