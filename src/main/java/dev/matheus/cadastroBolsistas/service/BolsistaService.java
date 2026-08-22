package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.repository.BolsistaRepository;
import dev.matheus.cadastroBolsistas.repository.LaboratorioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.ArrayList;

/*
 * regras de negocio de bolsistas. concentra o podeGerenciar para os controllers
 * nao repetirem a checagem de permissao.
 *
 * ponytail: o "throws SQLException" das assinaturas nao serve mais para nada -
 * jpa lanca unchecked. fica so ate a etapa 4, quando os controllers viram REST
 * e o catch (SQLException) deles some junto.
 */
@Service
public class BolsistaService {

    @Autowired
    private BolsistaRepository repository;

    @Autowired
    private LaboratorioRepository laboratorioRepository;

    public boolean podeGerenciar(Usuario usuarioLogado, Bolsista b) throws SQLException {
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

    public boolean inserir(Bolsista b) throws SQLException {
        b.setAtivo(true);
        repository.save(b);
        return true;
    }

    public ArrayList<Bolsista> listarTodos() throws SQLException {
        return new ArrayList<>(repository.findByAtivoTrueOrderByNome());
    }

    public Bolsista buscarPorId(int id) throws SQLException {
        return repository.findById(id).orElse(null);
    }

    public ArrayList<Bolsista> buscarPorNome(String nome) throws SQLException {
        return new ArrayList<>(repository.findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome(nome));
    }

    public ArrayList<Bolsista> buscarPorCurso(String curso) throws SQLException {
        return new ArrayList<>(repository.findByCursoContainingIgnoreCaseAndAtivoTrueOrderByNome(curso));
    }

    public ArrayList<Bolsista> buscarPorLaboratorio(int laboratorioId) throws SQLException {
        return new ArrayList<>(repository.buscarPorLaboratorio(laboratorioId));
    }

    public ArrayList<Bolsista> buscarPorProjeto(int projetoId) throws SQLException {
        return new ArrayList<>(repository.buscarPorProjeto(projetoId));
    }

    public boolean atualizar(Bolsista b) throws SQLException {
        repository.save(b);
        return true;
    }

    /* soft delete: marca ativo = false, nunca apaga a linha */
    @Transactional
    public boolean excluir(int id) throws SQLException {
        return repository.desativar(id) > 0;
    }

    public int contarAdmins() throws SQLException {
        return repository.countByTipoUsuarioAndAtivoTrue("ADMIN");
    }
}
