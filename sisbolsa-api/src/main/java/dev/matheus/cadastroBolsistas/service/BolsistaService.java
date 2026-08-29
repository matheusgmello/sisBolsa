package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.repository.BolsistaRepository;
import dev.matheus.cadastroBolsistas.repository.LaboratorioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Objects;
import java.util.UUID;

/*
 * regras de negocio de bolsistas com IDs em UUID.
 */
@Service
public class BolsistaService {

    @Autowired
    private BolsistaRepository repository;

    @Autowired
    private LaboratorioRepository laboratorioRepository;

    public boolean podeGerenciar(Usuario usuarioLogado, Bolsista b) {
        if (usuarioLogado == null || b == null) return false;
        if (usuarioLogado.isAdmin()) return true;
        if (usuarioLogado.isProfessor()) {
            if (b.getLaboratorioId() != null) {
                Laboratorio lab = laboratorioRepository.findById(b.getLaboratorioId()).orElse(null);
                return lab != null && Objects.equals(lab.getCoordenadorId(), usuarioLogado.getId());
            }
        }
        return false;
    }

    public boolean inserir(Bolsista b) {
        b.setAtivo(true);
        repository.save(b);
        return true;
    }

    public ArrayList<Bolsista> listarTodos() {
        return new ArrayList<>(repository.findByAtivoTrueOrderByNome());
    }

    public Bolsista buscarPorId(UUID id) {
        if (id == null) return null;
        return repository.findById(id).orElse(null);
    }

    public ArrayList<Bolsista> buscarPorNome(String nome) {
        return new ArrayList<>(repository.findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome(nome));
    }

    public ArrayList<Bolsista> buscarPorCurso(String curso) {
        return new ArrayList<>(repository.findByCursoContainingIgnoreCaseAndAtivoTrueOrderByNome(curso));
    }

    public ArrayList<Bolsista> buscarPorLaboratorio(UUID laboratorioId) {
        if (laboratorioId == null) return new ArrayList<>();
        return new ArrayList<>(repository.buscarPorLaboratorio(laboratorioId));
    }

    public ArrayList<Bolsista> buscarPorProjeto(UUID projetoId) {
        if (projetoId == null) return new ArrayList<>();
        return new ArrayList<>(repository.buscarPorProjeto(projetoId));
    }

    public boolean atualizar(Bolsista b) {
        repository.save(b);
        return true;
    }

    /* soft delete: marca ativo = false, nunca apaga a linha */
    @Transactional
    public boolean excluir(UUID id) {
        if (id == null) return false;
        return repository.desativar(id) > 0;
    }

    public ArrayList<Usuario> filtrarPorEscopo(ArrayList<Usuario> lista, Usuario usuarioLogado) {
        if (usuarioLogado == null) {
            return new ArrayList<>();
        }
        if (usuarioLogado.isAdmin()) {
            return lista;
        }
        if (usuarioLogado.isProfessor()) {
            ArrayList<Laboratorio> labsCoordenados =
                    new ArrayList<>(laboratorioRepository.buscarPorCoordenador(usuarioLogado.getId()));
            return somenteBolsistas(lista, b ->
                    labsCoordenados.stream().anyMatch(l -> Objects.equals(l.getId(), b.getLaboratorioId())));
        }
        if (usuarioLogado.isBolsista()) {
            UUID labId = ((Bolsista) usuarioLogado).getLaboratorioId();
            return somenteBolsistas(lista, b -> Objects.equals(b.getLaboratorioId(), labId));
        }
        return new ArrayList<>();
    }

    private ArrayList<Usuario> somenteBolsistas(ArrayList<Usuario> lista, java.util.function.Predicate<Bolsista> filtro) {
        ArrayList<Usuario> filtrados = new ArrayList<>();
        for (Usuario u : lista) {
            if (u instanceof Bolsista b && filtro.test(b)) {
                filtrados.add(b);
            }
        }
        return filtrados;
    }

    public int contarAdmins() {
        return repository.countByTipoUsuarioAndAtivoTrue("ADMIN");
    }
}
