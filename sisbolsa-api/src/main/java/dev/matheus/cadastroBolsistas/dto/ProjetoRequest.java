package dev.matheus.cadastroBolsistas.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "Dados para criação ou edição de um projeto de pesquisa.")
public record ProjetoRequest(
        @Schema(description = "Título / Nome do projeto de pesquisa", example = "Processamento de Linguagem Natural para Documentos Médicos", requiredMode = Schema.RequiredMode.REQUIRED)
        String nome,

        @Schema(description = "Descrição dos objetivos e escopo do projeto", example = "Desenvolvimento de modelos LLM para sumarização de prontuários clínicos.", requiredMode = Schema.RequiredMode.REQUIRED)
        String descricao,

        @Schema(description = "ID do laboratório ao qual o projeto pertence", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6", requiredMode = Schema.RequiredMode.REQUIRED)
        UUID laboratorioId,

        @Schema(description = "Link para o repositório externo (ex: GitHub, GitLab)", example = "https://github.com/lab-lsi/nlp-medico", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String linkRepositorio,

        @Schema(description = "Link para documentação ou artigo (ex: Overleaf, Docs)", example = "https://www.overleaf.com/read/exemplo123", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String linkDocumentacao) {
}
