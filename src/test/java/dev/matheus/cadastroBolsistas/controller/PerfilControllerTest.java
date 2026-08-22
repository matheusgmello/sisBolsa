package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.ProfessorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import dev.matheus.cadastroBolsistas.security.JwtCookieFilter;
import dev.matheus.cadastroBolsistas.security.SecurityConfig;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * o SecurityConfig fica de fora: o teste exercita a logica do controller, nao a
 * protecao de rota. o PasswordEncoder entra de verdade porque as validacoes de
 * senha dependem do bcrypt.
 */
@WebMvcTest(controllers = PerfilController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtCookieFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
class PerfilControllerTest {

    @TestConfiguration
    static class EncoderDeTeste {
        @Bean
        PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
        }
    }

    @Autowired
    private PasswordEncoder passwordEncoder;


    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BolsistaService bolsistaService;

    @MockitoBean
    private ProfessorService professorService;

    private Bolsista bolsistaLogado;
    private Professor professorLogado;

    private static final String SENHA_ORIGINAL = "senha123";
    private String HASH_ORIGINAL;

    @BeforeEach
    void setUp() throws Exception {
        HASH_ORIGINAL = passwordEncoder.encode(SENHA_ORIGINAL);

        bolsistaLogado = new Bolsista();
        bolsistaLogado.setId(1);
        bolsistaLogado.setNome("Joao Silva");
        bolsistaLogado.setEmail("joao@teste.com");
        bolsistaLogado.setSenha(HASH_ORIGINAL);
        bolsistaLogado.setTipoUsuario("BOLSISTA");

        professorLogado = new Professor();
        professorLogado.setId(2);
        professorLogado.setNome("Prof Roberto");
        professorLogado.setEmail("roberto@teste.com");
        professorLogado.setSenha(HASH_ORIGINAL);
    }

    // --- testes de GET ---

    @Test
    void getPerfil_semSessao_redirecionaParaLogin() throws Exception {
        mockMvc.perform(get("/perfil"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/login"));
    }

    @Test
    void getPerfil_comBolsistaLogado_retornaViewPerfil() throws Exception {
        mockMvc.perform(get("/perfil")
                        .sessionAttr("usuario", bolsistaLogado))
                .andExpect(status().isOk())
                .andExpect(view().name("perfil"))
                .andExpect(model().attributeExists("usuario"));
    }

    @Test
    void getPerfil_comProfessorLogado_retornaViewPerfil() throws Exception {
        mockMvc.perform(get("/perfil")
                        .sessionAttr("usuario", professorLogado))
                .andExpect(status().isOk())
                .andExpect(view().name("perfil"));
    }

    // --- testes de POST sem sessao ---

    @Test
    void postPerfil_semSessao_redirecionaParaLogin() throws Exception {
        mockMvc.perform(post("/perfil")
                        .param("nome", "Joao")
                        .param("email", "joao@teste.com"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/login"));
    }

    // --- testes de validacao dos campos obrigatorios ---

    @Test
    void postPerfil_nomesVazios_retornaErroDeValidacao() throws Exception {
        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "")
                        .param("email", ""))
                .andExpect(status().isOk())
                .andExpect(view().name("perfil"))
                .andExpect(model().attributeExists("erro"));
    }

    @Test
    void postPerfil_apenasNomeVazio_retornaErro() throws Exception {
        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "")
                        .param("email", "joao@teste.com"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("erro"));
    }

    // --- testes de alteracao de senha ---

    @Test
    void postPerfil_senhaAtualIncorreta_retornaErro() throws Exception {
        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "Joao")
                        .param("email", "joao@teste.com")
                        .param("senhaAtual", "senhaErradaAqui")
                        .param("senha", "novaSenha123")
                        .param("confirmaSenha", "novaSenha123"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("erro"));
    }

    @Test
    void postPerfil_novaSenhaCurta_retornaErro() throws Exception {
        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "Joao")
                        .param("email", "joao@teste.com")
                        .param("senhaAtual", SENHA_ORIGINAL)
                        .param("senha", "abc")
                        .param("confirmaSenha", "abc"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("erro"));
    }

    @Test
    void postPerfil_novasSenhasNaoConferem_retornaErro() throws Exception {
        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "Joao")
                        .param("email", "joao@teste.com")
                        .param("senhaAtual", SENHA_ORIGINAL)
                        .param("senha", "novaSenha123")
                        .param("confirmaSenha", "senhaDiferente456"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("erro"));
    }

    @Test
    void postPerfil_alteracaoSenhaComCamposFaltando_retornaErro() throws Exception {
        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "Joao")
                        .param("email", "joao@teste.com")
                        .param("senhaAtual", SENHA_ORIGINAL)
                        .param("senha", "")
                        .param("confirmaSenha", ""))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("erro"));
    }

    // --- testes de atualizacao de bolsista ---

    @Test
    void postPerfil_bolsistaSemAlterarSenha_atualizaERetornaSucesso() throws Exception {
        Bolsista bolsistaDoDAO = new Bolsista();
        bolsistaDoDAO.setId(1);
        bolsistaDoDAO.setSenha(HASH_ORIGINAL);
        when(bolsistaService.buscarPorId(1)).thenReturn(bolsistaDoDAO);
        when(bolsistaService.atualizar(any())).thenReturn(true);

        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "Joao Atualizado")
                        .param("email", "joao.novo@teste.com"))
                .andExpect(status().isOk())
                .andExpect(view().name("perfil"))
                .andExpect(model().attributeExists("sucesso"));

        verify(bolsistaService).atualizar(any(Bolsista.class));
    }

    @Test
    void postPerfil_bolsistaTrocaDeSenhaValida_hasheiaNovaSenha() throws Exception {
        Bolsista bolsistaDoDAO = new Bolsista();
        bolsistaDoDAO.setId(1);
        when(bolsistaService.buscarPorId(1)).thenReturn(bolsistaDoDAO);
        when(bolsistaService.atualizar(any())).thenReturn(true);

        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "Joao")
                        .param("email", "joao@teste.com")
                        .param("senhaAtual", SENHA_ORIGINAL)
                        .param("senha", "novaSenha123")
                        .param("confirmaSenha", "novaSenha123"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("sucesso"));

        ArgumentCaptor<Bolsista> captor = ArgumentCaptor.forClass(Bolsista.class);
        verify(bolsistaService).atualizar(captor.capture());
        // verifica que a nova senha foi hasheada e nao salva em texto puro
        assertTrue(passwordEncoder.matches("novaSenha123", captor.getValue().getSenha()));
    }

    @Test
    void postPerfil_bolsistaInexistenteNoBanco_retornaErro() throws Exception {
        when(bolsistaService.buscarPorId(1)).thenReturn(null);

        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", bolsistaLogado)
                        .param("nome", "Joao")
                        .param("email", "joao@teste.com"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("erro"));
    }

    // --- testes de atualizacao de professor ---

    @Test
    void postPerfil_professorSemAlterarSenha_atualizaERetornaSucesso() throws Exception {
        Professor profDoDAO = new Professor();
        profDoDAO.setId(2);
        profDoDAO.setSenha(HASH_ORIGINAL);
        when(professorService.buscarPorId(2)).thenReturn(profDoDAO);
        when(professorService.atualizar(any())).thenReturn(true);

        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", professorLogado)
                        .param("nome", "Prof Roberto Novo")
                        .param("email", "roberto.novo@teste.com"))
                .andExpect(status().isOk())
                .andExpect(view().name("perfil"))
                .andExpect(model().attributeExists("sucesso"));

        verify(professorService).atualizar(any(Professor.class));
        verifyNoInteractions(bolsistaService);
    }

    @Test
    void postPerfil_professorTrocaDeSenhaValida_hasheiaNovaSenha() throws Exception {
        Professor profDoDAO = new Professor();
        profDoDAO.setId(2);
        when(professorService.buscarPorId(2)).thenReturn(profDoDAO);
        when(professorService.atualizar(any())).thenReturn(true);

        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", professorLogado)
                        .param("nome", "Prof Roberto")
                        .param("email", "roberto@teste.com")
                        .param("senhaAtual", SENHA_ORIGINAL)
                        .param("senha", "novaSenha456")
                        .param("confirmaSenha", "novaSenha456"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("sucesso"));

        ArgumentCaptor<Professor> captor = ArgumentCaptor.forClass(Professor.class);
        verify(professorService).atualizar(captor.capture());
        assertTrue(passwordEncoder.matches("novaSenha456", captor.getValue().getSenha()));
    }

    @Test
    void postPerfil_professorInexistenteNoBanco_retornaErro() throws Exception {
        when(professorService.buscarPorId(2)).thenReturn(null);

        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", professorLogado)
                        .param("nome", "Prof Roberto")
                        .param("email", "roberto@teste.com"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("erro"));

        verify(professorService, never()).atualizar(any());
    }

    @Test
    void postPerfil_professorSenhaNaoAlterada_mantemHashOriginalNaBanco() throws Exception {
        Professor profDoDAO = new Professor();
        profDoDAO.setId(2);
        profDoDAO.setSenha(HASH_ORIGINAL);
        when(professorService.buscarPorId(2)).thenReturn(profDoDAO);
        when(professorService.atualizar(any())).thenReturn(true);

        mockMvc.perform(post("/perfil")
                        .sessionAttr("usuario", professorLogado)
                        .param("nome", "Prof Roberto")
                        .param("email", "roberto@teste.com"))
                .andExpect(status().isOk());

        ArgumentCaptor<Professor> captor = ArgumentCaptor.forClass(Professor.class);
        verify(professorService).atualizar(captor.capture());
        // a senha no banco deve ser o hash original, nao texto puro
        assertEquals(HASH_ORIGINAL, captor.getValue().getSenha());
    }
}
