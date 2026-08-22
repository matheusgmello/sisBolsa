package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Projeto;
import dev.matheus.cadastroBolsistas.repository.ProjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
 * regras de negocio de projetos, incluindo o vinculo n:n com bolsistas
 * (tabela bolsista_projeto).
 */
@Service
public class ProjetoService {

    @Autowired
    private ProjetoRepository repository;

    public boolean cadastrar(Projeto p) {
        p.setAtivo(true);
        repository.save(p);
        return true;
    }

    public ArrayList<Projeto> listarTodos() {
        return buscarProjetos(null, null);
    }

    public ArrayList<Projeto> buscarProjetos(String buscaNome, Integer labId) {
        String nome = buscaNome != null ? buscaNome.trim() : "";
        Integer lab = (labId != null && labId > 0) ? labId : null;
        return new ArrayList<>(repository.buscarProjetos(nome, lab));
    }

    public ArrayList<Projeto> listarPorLaboratorio(int labId) {
        return new ArrayList<>(repository.buscarPorLaboratorio(labId));
    }

    public Projeto buscarPorId(int id) {
        return repository.findById(id).orElse(null);
    }

    public boolean atualizar(Projeto p) {
        repository.save(p);
        return true;
    }

    /* soft delete */
    @Transactional
    public boolean excluir(int id) {
        return repository.desativar(id) > 0;
    }

    @Transactional
    public boolean vincularBolsista(int bolsistaId, int projetoId) {
        repository.vincularBolsista(bolsistaId, projetoId);
        return true;
    }

    @Transactional
    public boolean desvincularBolsista(int bolsistaId, int projetoId) {
        repository.desvincularBolsista(bolsistaId, projetoId);
        return true;
    }

    @Transactional
    public boolean desvincularBolsistaDeTodosProjetos(int bolsistaId) {
        repository.desvincularBolsistaDeTodosProjetos(bolsistaId);
        return true;
    }

    public ArrayList<Projeto> listarPorBolsista(int bolsistaId) {
        return new ArrayList<>(repository.buscarPorBolsista(bolsistaId));
    }

    /*
     * monta o mapa bolsista -> projetos do laboratorio inteiro em duas queries:
     * uma para os vinculos e outra para carregar os projetos de uma vez.
     * o dao antigo resolvia isso com um join manual so para fugir do n+1.
     */
    public Map<Integer, ArrayList<Projeto>> getProjetosDosBolsistasDoLaboratorio(int labId) {
        List<Object[]> vinculos = repository.buscarVinculosDoLaboratorio(labId);
        if (vinculos.isEmpty()) {
            return new HashMap<>();
        }

        List<Integer> projetoIds = vinculos.stream()
                .map(v -> ((Number) v[1]).intValue())
                .distinct()
                .toList();

        Map<Integer, Projeto> porId = new HashMap<>();
        for (Projeto p : repository.findAllById(projetoIds)) {
            porId.put(p.getId(), p);
        }

        Map<Integer, ArrayList<Projeto>> mapa = new HashMap<>();
        for (Object[] vinculo : vinculos) {
            int bolsistaId = ((Number) vinculo[0]).intValue();
            Projeto projeto = porId.get(((Number) vinculo[1]).intValue());
            if (projeto != null) {
                mapa.computeIfAbsent(bolsistaId, k -> new ArrayList<>()).add(projeto);
            }
        }
        return mapa;
    }
}
