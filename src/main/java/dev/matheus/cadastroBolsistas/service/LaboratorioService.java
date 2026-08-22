package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.repository.LaboratorioRepository;
import dev.matheus.cadastroBolsistas.repository.ProjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

/*
 * regras de negocio de laboratorios. podeGerenciar libera admin e o professor
 * que coordena o lab; temVaga compara ocupacao atual com a capacidade.
 */
@Service
public class LaboratorioService {

    @Autowired
    private LaboratorioRepository repository;

    @Autowired
    private ProjetoRepository projetoRepository;

    public boolean podeGerenciar(Usuario usuarioLogado, int labId) {
        if (usuarioLogado == null) return false;
        if (usuarioLogado.isAdmin()) return true;
        if (usuarioLogado.isProfessor()) {
            Laboratorio lab = repository.findById(labId).orElse(null);
            return lab != null && lab.getCoordenadorId() == usuarioLogado.getId();
        }
        return false;
    }

    public boolean cadastrar(Laboratorio lab) {
        lab.setAtivo(true);
        repository.save(lab);
        return true;
    }

    public ArrayList<Laboratorio> listarTodos() {
        return new ArrayList<>(repository.findByAtivoTrueOrderByNome());
    }

    public ArrayList<Laboratorio> listarPorCoordenador(int professorId) {
        return new ArrayList<>(repository.buscarPorCoordenador(professorId));
    }

    public Laboratorio buscarPorId(int id) {
        Laboratorio lab = repository.findById(id).orElse(null);
        if (lab != null) {
            lab.setProjetos(new ArrayList<>(projetoRepository.buscarPorLaboratorio(id)));
        }
        return lab;
    }

    public boolean atualizar(Laboratorio lab) {
        repository.save(lab);
        return true;
    }

    /* soft delete */
    @Transactional
    public boolean excluir(int id) {
        return repository.desativar(id) > 0;
    }

    public boolean temVaga(int labId) {
        Laboratorio lab = repository.findById(labId).orElse(null);
        if (lab == null) return false;
        return repository.contarBolsistasAtivos(labId) < lab.getCapacidade();
    }

    public int contarBolsistasNoLaboratorio(int labId) {
        return repository.contarBolsistasAtivos(labId);
    }
}
