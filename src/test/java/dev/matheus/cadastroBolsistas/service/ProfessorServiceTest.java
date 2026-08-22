package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.repository.ProfessorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfessorServiceTest {

    @Mock
    private ProfessorRepository repository;

    @InjectMocks
    private ProfessorService professorService;

    @Test
    void inserir_salvaNoRepositorio() throws SQLException {
        Professor p = new Professor();
        p.setNome("Prof Roberto");

        assertTrue(professorService.inserir(p));
        verify(repository).save(p);
    }

    @Test
    void listarTodos_retornaListaDoRepositorio() throws SQLException {
        when(repository.findByAtivoTrueOrderByNome())
                .thenReturn(List.of(new Professor(), new Professor()));

        ArrayList<Professor> resultado = professorService.listarTodos();

        assertEquals(2, resultado.size());
        verify(repository).findByAtivoTrueOrderByNome();
    }

    @Test
    void listarTodos_semProfessores_retornaListaVazia() throws SQLException {
        when(repository.findByAtivoTrueOrderByNome()).thenReturn(List.of());

        assertTrue(professorService.listarTodos().isEmpty());
    }

    @Test
    void buscarPorId_professorExistente_retornaObjeto() throws SQLException {
        Professor p = new Professor();
        p.setId(1);
        p.setNome("Prof Roberto");
        when(repository.findById(1)).thenReturn(Optional.of(p));

        Professor resultado = professorService.buscarPorId(1);

        assertNotNull(resultado);
        assertEquals(1, resultado.getId());
        assertEquals("Prof Roberto", resultado.getNome());
        verify(repository).findById(1);
    }

    @Test
    void buscarPorId_professorInexistente_retornaNull() throws SQLException {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertNull(professorService.buscarPorId(99));
        verify(repository).findById(99);
    }

    @Test
    void atualizar_salvaNoRepositorio() throws SQLException {
        Professor p = new Professor();
        p.setId(1);

        assertTrue(professorService.atualizar(p));
        verify(repository).save(p);
    }

    @Test
    void excluir_fazSoftDeleteEmVezDeApagarALinha() throws SQLException {
        when(repository.desativar(5)).thenReturn(1);

        assertTrue(professorService.excluir(5));
        verify(repository).desativar(5);
        verify(repository, never()).deleteById(anyInt());
    }

    @Test
    void excluir_quandoNadaFoiAtualizado_retornaFalse() throws SQLException {
        when(repository.desativar(99)).thenReturn(0);

        assertFalse(professorService.excluir(99));
    }

    @Test
    void buscarPorNome_retornaListaFiltrada() throws SQLException {
        Professor p = new Professor();
        p.setNome("Roberto Mendes");
        when(repository.findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome("Roberto"))
                .thenReturn(List.of(p));

        ArrayList<Professor> resultado = professorService.buscarPorNome("Roberto");

        assertEquals(1, resultado.size());
        assertEquals("Roberto Mendes", resultado.get(0).getNome());
    }

    @Test
    void buscarPorNome_semResultados_retornaListaVazia() throws SQLException {
        when(repository.findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome("Inexistente"))
                .thenReturn(List.of());

        assertTrue(professorService.buscarPorNome("Inexistente").isEmpty());
    }
}
