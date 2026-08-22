package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.repository.RelatorioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

/*
 * dados agregados da tela de relatorios. so admin chega aqui.
 */
@Service
public class RelatorioService {

    @Autowired
    private RelatorioRepository repository;

    public List<RelatorioRepository.HorasBolsista> getHorasBolsistasMesCorrente() throws SQLException {
        return repository.horasBolsistasMesCorrente();
    }

    public List<RelatorioRepository.ProjetosPorLaboratorio> getProjetosAtivosPorLaboratorio() throws SQLException {
        return repository.projetosAtivosPorLaboratorio();
    }

    public List<RelatorioRepository.BolsistasPorCargo> getBolsistasPorCargo() throws SQLException {
        return repository.bolsistasPorCargo();
    }

    public List<RelatorioRepository.OcupacaoLaboratorio> getLaboratoriosOcupacao() throws SQLException {
        return repository.laboratoriosOcupacao();
    }
}
