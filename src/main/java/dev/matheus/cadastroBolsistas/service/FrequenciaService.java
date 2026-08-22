package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Frequencia;
import dev.matheus.cadastroBolsistas.repository.FrequenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
public class FrequenciaService {

    @Autowired
    private FrequenciaRepository repository;

    public boolean registrar(Frequencia f) {
        f.setAtivo(true);
        repository.save(f);
        return true;
    }

    public Frequencia buscarPorId(int id) {
        return repository.findByIdAndAtivoTrue(id).orElse(null);
    }

    public boolean atualizar(Frequencia f) {
        repository.save(f);
        return true;
    }

    public ArrayList<Frequencia> listarPorBolsista(int bolsistaId) {
        return new ArrayList<>(repository.buscarPorBolsista(bolsistaId));
    }

    public ArrayList<Frequencia> listarPorLaboratorio(int labId) {
        return new ArrayList<>(repository.buscarPorLaboratorio(labId));
    }

    public ArrayList<Frequencia> listarTodas() {
        return new ArrayList<>(repository.findByAtivoTrueOrderByDataDesc());
    }

    /*
     * o controller ainda pensa em limit/offset, entao a conversao para Pageable
     * acontece aqui. quando nao vem paginacao, devolve tudo.
     */
    public ArrayList<Frequencia> buscarFrequencias(Integer bolsistaId, Integer limit, Integer offset) {
        Integer filtro = (bolsistaId != null && bolsistaId > 0) ? bolsistaId : null;
        Pageable pageable = Pageable.unpaged();
        if (limit != null && limit > 0 && offset != null && offset >= 0) {
            pageable = PageRequest.of(offset / limit, limit);
        }
        return new ArrayList<>(repository.buscarFrequencias(filtro, pageable));
    }

    public int contarFrequencias(Integer bolsistaId) {
        return repository.contarFrequencias((bolsistaId != null && bolsistaId > 0) ? bolsistaId : null);
    }

    /* soft delete */
    @Transactional
    public boolean excluir(int id) {
        return repository.desativar(id) > 0;
    }
}
