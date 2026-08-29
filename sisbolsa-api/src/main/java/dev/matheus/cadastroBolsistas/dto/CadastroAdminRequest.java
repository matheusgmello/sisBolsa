package dev.matheus.cadastroBolsistas.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dados para cadastro inicial de administrador (limitado a 3 no sistema).")
public record CadastroAdminRequest(
        @Schema(description = "Nome completo do administrador", example = "Administrador do Sistema", requiredMode = Schema.RequiredMode.REQUIRED)
        String nome,

        @Schema(description = "E-mail de acesso institucional", example = "admin@sisbolsa.com", requiredMode = Schema.RequiredMode.REQUIRED)
        String email,

        @Schema(description = "Senha de acesso (mínimo 6 caracteres)", example = "12345678", requiredMode = Schema.RequiredMode.REQUIRED)
        String senha,

        @Schema(description = "Confirmação da senha", example = "12345678", requiredMode = Schema.RequiredMode.REQUIRED)
        String confirmaSenha) {
}
