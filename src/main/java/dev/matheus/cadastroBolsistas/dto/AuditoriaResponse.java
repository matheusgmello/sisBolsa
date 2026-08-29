package dev.matheus.cadastroBolsistas.dto;

import dev.matheus.cadastroBolsistas.model.Auditoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditoriaResponse(
        UUID id,
        UUID usuarioId,
        String usuarioNome,
        String acao,
        String entidade,
        String detalhes,
        String ipOrigem,
        LocalDateTime dataHora) {

    public static AuditoriaResponse de(Auditoria a) {
        if (a == null) return null;
        return new AuditoriaResponse(
                a.getId(),
                a.getUsuarioId(),
                a.getUsuarioNome(),
                a.getAcao(),
                a.getEntidade(),
                a.getDetalhes(),
                a.getIpOrigem(),
                a.getDataHora());
    }
}
