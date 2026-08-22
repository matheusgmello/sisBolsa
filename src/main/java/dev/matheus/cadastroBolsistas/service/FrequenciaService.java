package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Frequencia;
import dev.matheus.cadastroBolsistas.repository.FrequenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.ArrayList;

@Service
public class FrequenciaService {

    @Autowired
    private FrequenciaRepository repository;

    public boolean registrar(Frequencia f) throws SQLException {
        f.setAtivo(true);
        repository.save(f);
        return true;
    }

    public Frequencia buscarPorId(int id) throws SQLException {
        return repository.findByIdAndAtivoTrue(id).orElse(null);
    }

    public boolean atualizar(Frequencia f) throws SQLException {
        repository.save(f);
        return true;
    }

    public ArrayList<Frequencia> listarPorBolsista(int bolsistaId) throws SQLException {
        return new ArrayList<>(repository.buscarPorBolsista(bolsistaId));
    }

    public ArrayList<Frequencia> listarPorLaboratorio(int labId) throws SQLException {
        return new ArrayList<>(repository.buscarPorLaboratorio(labId));
    }

    public ArrayList<Frequencia> listarTodas() throws SQLException {
        return new ArrayList<>(repository.findByAtivoTrueOrderByDataDesc());
    }

    /*
     * o controller ainda pensa em limit/offset, entao a conversao para Pageable
     * acontece aqui. quando nao vem paginacao, devolve tudo.
     */
    public ArrayList<Frequencia> buscarFrequencias(Integer bolsistaId, Integer limit, Integer offset) throws SQLException {
        Integer filtro = (bolsistaId != null && bolsistaId > 0) ? bolsistaId : null;
        Pageable pageable = Pageable.unpaged();
        if (limit != null && limit > 0 && offset != null && offset >= 0) {
            pageable = PageRequest.of(offset / limit, limit);
        }
        return new ArrayList<>(repository.buscarFrequencias(filtro, pageable));
    }

    public int contarFrequencias(Integer bolsistaId) throws SQLException {
        return repository.contarFrequencias((bolsistaId != null && bolsistaId > 0) ? bolsistaId : null);
    }

    /* soft delete */
    @Transactional
    public boolean excluir(int id) throws SQLException {
        return repository.desativar(id) > 0;
    }
}
