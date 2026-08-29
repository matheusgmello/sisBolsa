package dev.matheus.cadastroBolsistas.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "Dados para criação ou atualização de um laboratório de pesquisa.")
public record LaboratorioRequest(
        @Schema(description = "Nome do laboratório", example = "Laboratório de Sistemas Inteligentes (LSI)", requiredMode = Schema.RequiredMode.REQUIRED)
        String nome,

        @Schema(description = "Área de pesquisa principal", example = "Inteligência Artificial e Robótica", requiredMode = Schema.RequiredMode.REQUIRED)
        String areaPesquisa,

        @Schema(description = "Status operacional", example = "Ativo", allowableValues = {"Ativo", "Em Manutenção", "Inativo"}, requiredMode = Schema.RequiredMode.REQUIRED)
        String status,

        @Schema(description = "Capacidade máxima de bolsistas e pesquisadores simultâneos", example = "10", requiredMode = Schema.RequiredMode.REQUIRED)
        Integer capacidade,

        @Schema(description = "ID do professor coordenador responsável", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        UUID coordenadorId) {
}
