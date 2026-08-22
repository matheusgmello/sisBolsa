package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.model.Usuario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import dev.matheus.cadastroBolsistas.repository.BolsistaRepository;
import dev.matheus.cadastroBolsistas.repository.LaboratorioRepository;

import java.sql.SQLException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BolsistaServiceTest {

    @Mock
    private BolsistaRepository repository;

    @Mock
    private LaboratorioRepository laboratorioRepository;

    @InjectMocks
    private BolsistaService bolsistaService;

    @Test
    void podeGerenciar_adminSempreRetornaTrue() throws SQLException {
        Professor admin = new Professor();
        admin.setTipoUsuario("ADMIN");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(5);

        assertTrue(bolsistaService.podeGerenciar(admin, bolsista));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_professorCoordenadorDaboLaboratorio() throws SQLException {
        Professor professor = new Professor();
        professor.setId(10);
        professor.setTipoUsuario("PROFESSOR");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(5);
        bolsista.setLaboratorioId(3);

        Laboratorio lab = new Laboratorio();
        lab.setId(3);
        lab.setCoordenadorId(10);

        when(laboratorioRepository.findById(3)).thenReturn(Optional.of(lab));

        assertTrue(bolsistaService.podeGerenciar(professor, bolsista));
        verify(laboratorioRepository).findById(3);
    }

    @Test
    void podeGerenciar_professorDeOutroLaboratorio() throws SQLException {
        Professor professor = new Professor();
        professor.setId(10);
        professor.setTipoUsuario("PROFESSOR");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(5);
        bolsista.setLaboratorioId(3);

        Laboratorio lab = new Laboratorio();
        lab.setId(3);
        lab.setCoordenadorId(99);

        when(laboratorioRepository.findById(3)).thenReturn(Optional.of(lab));

        assertFalse(bolsistaService.podeGerenciar(professor, bolsista));
        verify(laboratorioRepository).findById(3);
    }

    @Test
    void podeGerenciar_professorEBolsistaSemLaboratorio() throws SQLException {
        Professor professor = new Professor();
        professor.setId(10);
        professor.setTipoUsuario("PROFESSOR");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(5);
        bolsista.setLaboratorioId(0);

        assertFalse(bolsistaService.podeGerenciar(professor, bolsista));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_bolsistaRetornaFalse() throws SQLException {
        Bolsista bolsistaLogado = new Bolsista();
        bolsistaLogado.setTipoUsuario("BOLSISTA");

        Bolsista bolsistaAlvo = new Bolsista();
        bolsistaAlvo.setId(5);

        assertFalse(bolsistaService.podeGerenciar(bolsistaLogado, bolsistaAlvo));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_usuarioNullRetornaFalse() throws SQLException {
        Bolsista bolsista = new Bolsista();
        bolsista.setId(5);

        assertFalse(bolsistaService.podeGerenciar(null, bolsista));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_bolsistaAlvoNullRetornaFalse() throws SQLException {
        Professor professor = new Professor();
        professor.setTipoUsuario("PROFESSOR");

        assertFalse(bolsistaService.podeGerenciar(professor, null));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void inserir_setaAtivoTrueAntesDeSalvar() throws SQLException {
        Bolsista bolsista = new Bolsista();
        bolsista.setAtivo(false);

        boolean result = bolsistaService.inserir(bolsista);

        assertTrue(result);
        ArgumentCaptor<Bolsista> captor = ArgumentCaptor.forClass(Bolsista.class);
        verify(repository).save(captor.capture());
        
        Bolsista capturado = captor.getValue();
        assertTrue(capturado.isAtivo());
    }
}
