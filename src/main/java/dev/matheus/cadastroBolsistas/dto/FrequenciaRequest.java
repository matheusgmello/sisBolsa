package dev.matheus.cadastroBolsistas.dto;

import java.time.LocalDate;

/*
 * bolsistaId so e respeitado para admin e professor. bolsista comum sempre
 * registra para si mesmo, independente do que mandar aqui.
 */
public record FrequenciaRequest(
        Integer bolsistaId,
        LocalDate data,
        Double horasTrabalhadas,
        String descricao) {
}
