package dev.matheus.cadastroBolsistas.dto;

import java.time.LocalDate;
import java.util.UUID;

/*
 * bolsistaId so e respeitado para admin e professor. bolsista comum sempre
 * registra para si mesmo, independente do que mandar aqui.
 */
public record FrequenciaRequest(
        UUID bolsistaId,
        LocalDate data,
        Double horasTrabalhadas,
        String descricao,
        String linkComprovante) {
}
