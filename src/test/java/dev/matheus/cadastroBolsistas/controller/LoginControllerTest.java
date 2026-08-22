package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.service.LoginService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import dev.matheus.cadastroBolsistas.security.JwtService;
import dev.matheus.cadastroBolsistas.security.JwtCookieFilter;
import dev.matheus.cadastroBolsistas.security.SecurityConfig;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = LoginController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtCookieFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
class LoginControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LoginService loginService;

    @MockitoBean
    private JwtService jwtService;

    @BeforeEach
    void setUp() throws Exception {
        // Mockamos o comportamento do interceptor para retornar true e liberar o teste de controller
    }

    @Test
    void getLogin_retornaViewLogin() throws Exception {
        mockMvc.perform(get("/login"))
                .andExpect(status().isOk())
                .andExpect(view().name("login"));
    }

    @Test
    void postLogin_comCredenciaisValidas_redirecionaParaDashboard() throws Exception {
        Bolsista mockUsuario = new Bolsista();
        mockUsuario.setEmail("usuario@teste.com");

        when(loginService.autenticar("usuario@teste.com", "senha123")).thenReturn(mockUsuario);

        mockMvc.perform(post("/login")
                        .param("email", "usuario@teste.com")
                        .param("senha", "senha123"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/dashboard"))
                .andExpect(request().sessionAttribute("usuario", mockUsuario));
    }

    @Test
    void postLogin_comCredenciaisInvalidas_retornaLoginComErro() throws Exception {
        when(loginService.autenticar("invalido@teste.com", "senhaErrada")).thenReturn(null);

        mockMvc.perform(post("/login")
                        .param("email", "invalido@teste.com")
                        .param("senha", "senhaErrada"))
                .andExpect(status().isOk())
                .andExpect(view().name("login"))
                .andExpect(model().attributeExists("erro"));
    }

    @Test
    void getRoot_redirecionaParaLogin() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(view().name("login"));
    }
}
