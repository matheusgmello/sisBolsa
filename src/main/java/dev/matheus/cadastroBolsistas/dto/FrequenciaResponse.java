package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Frequencia;

import java.time.LocalDate;
import java.util.UUID;

public record FrequenciaResponse(
        UUID id,
        UUID bolsistaId,
        String nomeBolsista,
        LocalDate data,
        double horasTrabalhadas,
        String descricao,
        boolean ativo) {

    public static FrequenciaResponse de(Frequencia f) {
        if (f == null) {
            return null;
        }
        return new FrequenciaResponse(
                f.getId(), f.getBolsistaId(), f.getNomeBolsista(),
                f.getData(), f.getHorasTrabalhadas(), f.getDescricao(), f.isAtivo());
    }
}
