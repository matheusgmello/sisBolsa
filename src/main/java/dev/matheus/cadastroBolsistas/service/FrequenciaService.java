package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Frequencia;
import dev.matheus.cadastroBolsistas.repository.FrequenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FrequenciaService {

    @Autowired
    private FrequenciaRepository repository;

    public boolean registrar(Frequencia f) {
        f.setAtivo(true);
        repository.save(f);
        return true;
    }

    public Frequencia buscarPorId(UUID id) {
        if (id == null) return null;
        return repository.findByIdAndAtivoTrue(id).orElse(null);
    }

    public boolean atualizar(Frequencia f) {
        repository.save(f);
        return true;
    }

    public ArrayList<Frequencia> listarPorBolsista(UUID bolsistaId) {
        if (bolsistaId == null) return new ArrayList<>();
        return new ArrayList<>(repository.buscarPorBolsista(bolsistaId));
    }

    public ArrayList<Frequencia> listarPorLaboratorio(UUID labId) {
        if (labId == null) return new ArrayList<>();
        return new ArrayList<>(repository.buscarPorLaboratorio(labId));
    }

    public ArrayList<Frequencia> listarTodas() {
        return new ArrayList<>(repository.findByAtivoTrueOrderByDataDesc());
    }

    public ArrayList<Frequencia> buscarFrequencias(UUID bolsistaId, Integer limit, Integer offset) {
        Pageable pageable = Pageable.unpaged();
        if (limit != null && limit > 0 && offset != null && offset >= 0) {
            pageable = PageRequest.of(offset / limit, limit);
        }
        return new ArrayList<>(repository.buscarFrequencias(bolsistaId, pageable));
    }

    public ArrayList<Frequencia> buscarPorBolsistas(List<UUID> ids, Integer limit, Integer offset) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        Pageable pageable = Pageable.unpaged();
        if (limit != null && limit > 0 && offset != null && offset >= 0) {
            pageable = PageRequest.of(offset / limit, limit);
        }
        return new ArrayList<>(repository.buscarPorBolsistas(ids, pageable));
    }

    public int contarPorBolsistas(List<UUID> ids) {
        return (ids == null || ids.isEmpty()) ? 0 : repository.contarPorBolsistas(ids);
    }

    public int contarFrequencias(UUID bolsistaId) {
        return repository.contarFrequencias(bolsistaId);
    }

    /* soft delete */
    @Transactional
    public boolean excluir(UUID id) {
        if (id == null) return false;
        return repository.desativar(id) > 0;
    }
}
