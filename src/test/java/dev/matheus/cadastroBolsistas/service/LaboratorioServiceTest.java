package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.model.Usuario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import dev.matheus.cadastroBolsistas.repository.LaboratorioRepository;
import dev.matheus.cadastroBolsistas.repository.ProjetoRepository;

import java.sql.SQLException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LaboratorioServiceTest {

    @Mock
    private LaboratorioRepository repository;

    @Mock
    private ProjetoRepository projetoRepository;

    @InjectMocks
    private LaboratorioService laboratorioService;

    @Test
    void podeGerenciar_adminSempreRetornaTrue() throws SQLException {
        // Usuario admin (isAdmin()=true)
        Professor admin = new Professor();
        admin.setTipoUsuario("ADMIN");

        assertTrue(laboratorioService.podeGerenciar(admin, 999));
        // o repositorio NUNCA deve ser consultado para admin
        verifyNoInteractions(repository);
    }

    @Test
    void podeGerenciar_professorCoordenadorRetornaTrue() throws SQLException {
        // Professor com id=10
        Professor professor = new Professor();
        professor.setId(10);
        professor.setTipoUsuario("PROFESSOR");

        Laboratorio lab = new Laboratorio();
        lab.setId(5);
        lab.setCoordenadorId(10);

        when(repository.findById(5)).thenReturn(Optional.of(lab));

        assertTrue(laboratorioService.podeGerenciar(professor, 5));
        verify(repository).findById(5);
    }

    @Test
    void podeGerenciar_professorNaoCoordenadorRetornaFalse() throws SQLException {
        // Professor com id=10
        Professor professor = new Professor();
        professor.setId(10);
        professor.setTipoUsuario("PROFESSOR");

        Laboratorio lab = new Laboratorio();
        lab.setId(5);
        lab.setCoordenadorId(99);

        when(repository.findById(5)).thenReturn(Optional.of(lab));

        assertFalse(laboratorioService.podeGerenciar(professor, 5));
        verify(repository).findById(5);
    }

    @Test
    void podeGerenciar_professorLabInexistenteRetornaFalse() throws SQLException {
        Professor professor = new Professor();
        professor.setId(10);
        professor.setTipoUsuario("PROFESSOR");

        when(repository.findById(5)).thenReturn(Optional.empty());

        assertFalse(laboratorioService.podeGerenciar(professor, 5));
        verify(repository).findById(5);
    }

    @Test
    void podeGerenciar_bolsistaRetornaFalse() throws SQLException {
        Bolsista bolsista = new Bolsista();
        bolsista.setTipoUsuario("BOLSISTA");

        assertFalse(laboratorioService.podeGerenciar(bolsista, 5));
        verifyNoInteractions(repository);
    }

    @Test
    void podeGerenciar_usuarioNullRetornaFalse() throws SQLException {
        assertFalse(laboratorioService.podeGerenciar(null, 5));
        verifyNoInteractions(repository);
    }

    @Test
    void temVaga_retornaTrueQuandoLabTemEspaco() throws SQLException {
        Laboratorio lab = new Laboratorio();
        lab.setId(1);
        lab.setCapacidade(10);

        when(repository.findById(1)).thenReturn(Optional.of(lab));
        when(repository.contarBolsistasAtivos(1)).thenReturn(5);

        assertTrue(laboratorioService.temVaga(1));
        verify(repository).findById(1);
        verify(repository).contarBolsistasAtivos(1);
    }

    @Test
    void temVaga_retornaFalseQuandoLabEstaLotado() throws SQLException {
        Laboratorio lab = new Laboratorio();
        lab.setId(1);
        lab.setCapacidade(10);

        when(repository.findById(1)).thenReturn(Optional.of(lab));
        when(repository.contarBolsistasAtivos(1)).thenReturn(10);

        assertFalse(laboratorioService.temVaga(1));
        verify(repository).findById(1);
        verify(repository).contarBolsistasAtivos(1);
    }

    @Test
    void temVaga_retornaFalseQuandoLabNaoExiste() throws SQLException {
        when(repository.findById(1)).thenReturn(Optional.empty());

        assertFalse(laboratorioService.temVaga(1));
        verify(repository).findById(1);
        verify(repository, never()).contarBolsistasAtivos(anyInt());
    }
}
