package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository repository;

    public boolean inserir(Professor p) {
        repository.save(p);
        return true;
    }

    public ArrayList<Professor> listarTodos() {
        return new ArrayList<>(repository.findByAtivoTrueOrderByNome());
    }

    public ArrayList<Professor> buscarPorNome(String nome) {
        return new ArrayList<>(repository.findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome(nome));
    }

    public Professor buscarPorId(int id) {
        return repository.findById(id).orElse(null);
    }

    public boolean atualizar(Professor p) {
        repository.save(p);
        return true;
    }

    /* soft delete */
    @Transactional
    public boolean excluir(int id) {
        return repository.desativar(id) > 0;
    }
}
