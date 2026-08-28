package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Professor;
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
import java.util.UUID;

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
        admin.setId(UUID.randomUUID());
        admin.setTipoUsuario("ADMIN");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(UUID.randomUUID());

        assertTrue(bolsistaService.podeGerenciar(admin, bolsista));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_professorCoordenadorDaboLaboratorio() throws SQLException {
        UUID profId = UUID.randomUUID();
        UUID labId = UUID.randomUUID();

        Professor professor = new Professor();
        professor.setId(profId);
        professor.setTipoUsuario("PROFESSOR");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(UUID.randomUUID());
        bolsista.setLaboratorioId(labId);

        Laboratorio lab = new Laboratorio();
        lab.setId(labId);
        lab.setCoordenadorId(profId);

        when(laboratorioRepository.findById(labId)).thenReturn(Optional.of(lab));

        assertTrue(bolsistaService.podeGerenciar(professor, bolsista));
        verify(laboratorioRepository).findById(labId);
    }

    @Test
    void podeGerenciar_professorDeOutroLaboratorio() throws SQLException {
        UUID profId = UUID.randomUUID();
        UUID labId = UUID.randomUUID();

        Professor professor = new Professor();
        professor.setId(profId);
        professor.setTipoUsuario("PROFESSOR");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(UUID.randomUUID());
        bolsista.setLaboratorioId(labId);

        Laboratorio lab = new Laboratorio();
        lab.setId(labId);
        lab.setCoordenadorId(UUID.randomUUID());

        when(laboratorioRepository.findById(labId)).thenReturn(Optional.of(lab));

        assertFalse(bolsistaService.podeGerenciar(professor, bolsista));
        verify(laboratorioRepository).findById(labId);
    }

    @Test
    void podeGerenciar_professorEBolsistaSemLaboratorio() throws SQLException {
        Professor professor = new Professor();
        professor.setId(UUID.randomUUID());
        professor.setTipoUsuario("PROFESSOR");

        Bolsista bolsista = new Bolsista();
        bolsista.setId(UUID.randomUUID());
        bolsista.setLaboratorioId(null);

        assertFalse(bolsistaService.podeGerenciar(professor, bolsista));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_bolsistaRetornaFalse() throws SQLException {
        Bolsista bolsistaLogado = new Bolsista();
        bolsistaLogado.setId(UUID.randomUUID());
        bolsistaLogado.setTipoUsuario("BOLSISTA");

        Bolsista bolsistaAlvo = new Bolsista();
        bolsistaAlvo.setId(UUID.randomUUID());

        assertFalse(bolsistaService.podeGerenciar(bolsistaLogado, bolsistaAlvo));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_usuarioNullRetornaFalse() throws SQLException {
        Bolsista bolsista = new Bolsista();
        bolsista.setId(UUID.randomUUID());

        assertFalse(bolsistaService.podeGerenciar(null, bolsista));
        verifyNoInteractions(laboratorioRepository);
    }

    @Test
    void podeGerenciar_bolsistaAlvoNullRetornaFalse() throws SQLException {
        Professor professor = new Professor();
        professor.setId(UUID.randomUUID());
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
