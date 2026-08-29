package dev.matheus.cadastroBolsistas.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitação de código de recuperação de senha.")
public record EsqueciSenhaRequest(
        @Schema(description = "E-mail cadastrado na conta", example = "admin@sisbolsa.com", requiredMode = Schema.RequiredMode.REQUIRED)
        String email) {
}
