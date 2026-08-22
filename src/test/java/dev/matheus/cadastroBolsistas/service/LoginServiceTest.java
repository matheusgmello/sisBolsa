package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.repository.BolsistaRepository;
import dev.matheus.cadastroBolsistas.repository.ProfessorRepository;
import dev.matheus.cadastroBolsistas.util.SecurityUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

    @Mock
    private BolsistaRepository bolsistaRepository;

    @Mock
    private ProfessorRepository professorRepository;

    @InjectMocks
    private LoginService loginService;

    @Test
    void autenticar_retornaBolsistaQuandoCredenciaisValidas() {
        String email = "bolsista@teste.com";
        String senha = "teste123";
        String hashSenha = SecurityUtil.hashSenha(senha);

        Bolsista mockBolsista = new Bolsista();
        mockBolsista.setEmail(email);

        when(bolsistaRepository.findByEmailAndSenhaAndAtivoTrue(email, hashSenha))
                .thenReturn(Optional.of(mockBolsista));

        Usuario resultado = loginService.autenticar(email, senha);

        assertNotNull(resultado);
        assertEquals(email, resultado.getEmail());
        verify(bolsistaRepository).findByEmailAndSenhaAndAtivoTrue(email, hashSenha);
        verifyNoInteractions(professorRepository);
    }

    @Test
    void autenticar_tentaProfessorQuandoBolsistaNaoEncontrado() {
        String email = "professor@teste.com";
        String senha = "teste123";
        String hashSenha = SecurityUtil.hashSenha(senha);

        Professor mockProfessor = new Professor();
        mockProfessor.setEmail(email);

        when(bolsistaRepository.findByEmailAndSenhaAndAtivoTrue(email, hashSenha))
                .thenReturn(Optional.empty());
        when(professorRepository.findByEmailAndSenhaAndAtivoTrue(email, hashSenha))
                .thenReturn(Optional.of(mockProfessor));

        Usuario resultado = loginService.autenticar(email, senha);

        assertNotNull(resultado);
        assertEquals(email, resultado.getEmail());
        verify(bolsistaRepository).findByEmailAndSenhaAndAtivoTrue(email, hashSenha);
        verify(professorRepository).findByEmailAndSenhaAndAtivoTrue(email, hashSenha);
    }

    @Test
    void autenticar_retornaNullQuandoNenhumRepositorioEncontra() {
        String email = "inexistente@teste.com";
        String senha = "teste123";
        String hashSenha = SecurityUtil.hashSenha(senha);

        when(bolsistaRepository.findByEmailAndSenhaAndAtivoTrue(email, hashSenha))
                .thenReturn(Optional.empty());
        when(professorRepository.findByEmailAndSenhaAndAtivoTrue(email, hashSenha))
                .thenReturn(Optional.empty());

        assertNull(loginService.autenticar(email, senha));
        verify(bolsistaRepository).findByEmailAndSenhaAndAtivoTrue(email, hashSenha);
        verify(professorRepository).findByEmailAndSenhaAndAtivoTrue(email, hashSenha);
    }

    @Test
    void autenticar_hasheiaSenhaAntesDeConsultarORepositorio() {
        String email = "bolsista@teste.com";
        String senha = "teste123";
        String hashSenha = SecurityUtil.hashSenha(senha);

        when(bolsistaRepository.findByEmailAndSenhaAndAtivoTrue(email, hashSenha))
                .thenReturn(Optional.empty());
        when(professorRepository.findByEmailAndSenhaAndAtivoTrue(email, hashSenha))
                .thenReturn(Optional.empty());

        loginService.autenticar(email, senha);

        // a senha em texto puro nunca pode chegar no banco
        verify(bolsistaRepository).findByEmailAndSenhaAndAtivoTrue(email, hashSenha);
        verify(bolsistaRepository, never()).findByEmailAndSenhaAndAtivoTrue(email, senha);
    }
}
