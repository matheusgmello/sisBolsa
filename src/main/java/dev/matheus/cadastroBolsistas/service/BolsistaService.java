package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.repository.BolsistaRepository;
import dev.matheus.cadastroBolsistas.repository.LaboratorioRepository;
import dev.matheus.cadastroBolsistas.repository.ProjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

/*
 * regras de negocio de bolsistas. concentra podeGerenciar e o filtro de escopo
 * para nenhuma camada acima repetir checagem de permissao.
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
            if (b.getLaboratorioId() > 0) {
                Laboratorio lab = laboratorioRepository.findById(b.getLaboratorioId()).orElse(null);
                return lab != null && lab.getCoordenadorId() == usuarioLogado.getId();
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

    public Bolsista buscarPorId(int id) {
        return repository.findById(id).orElse(null);
    }

    public ArrayList<Bolsista> buscarPorNome(String nome) {
        return new ArrayList<>(repository.findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome(nome));
    }

    public ArrayList<Bolsista> buscarPorCurso(String curso) {
        return new ArrayList<>(repository.findByCursoContainingIgnoreCaseAndAtivoTrueOrderByNome(curso));
    }

    public ArrayList<Bolsista> buscarPorLaboratorio(int laboratorioId) {
        return new ArrayList<>(repository.buscarPorLaboratorio(laboratorioId));
    }

    public ArrayList<Bolsista> buscarPorProjeto(int projetoId) {
        return new ArrayList<>(repository.buscarPorProjeto(projetoId));
    }

    public boolean atualizar(Bolsista b) {
        repository.save(b);
        return true;
    }

    /* soft delete: marca ativo = false, nunca apaga a linha */
    @Transactional
    public boolean excluir(int id) {
        return repository.desativar(id) > 0;
    }

    /*
     * corta a lista para o que o usuario logado tem direito de ver:
     * admin ve tudo, professor ve os bolsistas dos labs que coordena e bolsista
     * ve so os colegas do proprio lab. professor nao aparece para nao-admin.
     *
     * mora aqui, e nao no controller, porque a api rest e as jsp precisam da
     * mesma regra - regra de permissao duplicada e como buraco de seguranca nasce.
     */
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
                    labsCoordenados.stream().anyMatch(l -> l.getId() == b.getLaboratorioId()));
        }
        if (usuarioLogado.isBolsista()) {
            int labId = ((Bolsista) usuarioLogado).getLaboratorioId();
            return somenteBolsistas(lista, b -> b.getLaboratorioId() == labId);
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
