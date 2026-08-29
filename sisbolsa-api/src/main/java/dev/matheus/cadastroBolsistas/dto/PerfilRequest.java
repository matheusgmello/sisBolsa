package dev.matheus.cadastroBolsistas.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/*
 * atualizacao do proprio perfil. os tres campos de senha so importam juntos:
 * trocar a senha exige a atual, a nova e a confirmacao.
 */
@Schema(description = "Dados para atualização de perfil e alteração opcional de senha.")
public record PerfilRequest(
        @Schema(description = "Nome completo", example = "Maria Silva", requiredMode = Schema.RequiredMode.REQUIRED)
        String nome,

        @Schema(description = "E-mail de acesso", example = "maria.silva@sisbolsa.com", requiredMode = Schema.RequiredMode.REQUIRED)
        String email,

        @Schema(description = "URL pública da foto de perfil", example = "https://images.unsplash.com/photo-1494790108377-be9c29b29330", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String fotoUrl,

        @Schema(description = "Biografia ou resumo acadêmico", example = "Pesquisadora em Inteligência Artificial e Processamento de Linguagem Natural.", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String bio,

        @Schema(description = "Senha atual (obrigatória apenas se desejar trocar a senha)", example = "12345678", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String senhaAtual,

        @Schema(description = "Nova senha desejada (mínimo 6 caracteres)", example = "NovaSenha@2026", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String senha,

        @Schema(description = "Confirmação da nova senha", example = "NovaSenha@2026", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String confirmaSenha) {
}
