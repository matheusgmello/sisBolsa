package dev.matheus.cadastroBolsistas.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dados para redefinição de senha com código temporário.")
public record RedefinirSenhaRequest(
        @Schema(description = "E-mail da conta", example = "admin@sisbolsa.com", requiredMode = Schema.RequiredMode.REQUIRED)
        String email,

        @Schema(description = "Código numérico de 6 dígitos recebido", example = "749201", requiredMode = Schema.RequiredMode.REQUIRED)
        String codigo,

        @Schema(description = "Nova senha (mínimo 6 caracteres)", example = "NovaSenha@2026", requiredMode = Schema.RequiredMode.REQUIRED)
        String novaSenha,

        @Schema(description = "Confirmação da nova senha", example = "NovaSenha@2026", requiredMode = Schema.RequiredMode.REQUIRED)
        String confirmaSenha) {
}
