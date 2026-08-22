package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.CadastroAdminRequest;
import dev.matheus.cadastroBolsistas.dto.LoginRequest;
import dev.matheus.cadastroBolsistas.dto.PerfilRequest;
import dev.matheus.cadastroBolsistas.dto.UsuarioResponse;
import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.ProfessorService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import dev.matheus.cadastroBolsistas.security.CookieJwt;
import dev.matheus.cadastroBolsistas.security.JwtService;
import dev.matheus.cadastroBolsistas.service.LoginService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Tag(name = "Autenticacao", description = "Login, logout e dados do usuario da sessao atual.")
@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    private static final int LIMITE_ADMINS = 3;

    private final LoginService loginService;
    private final JwtService jwtService;
    private final UsuarioLogado usuarioLogado;
    private final BolsistaService bolsistaService;
    private final ProfessorService professorService;
    private final PasswordEncoder passwordEncoder;

    public AuthApiController(LoginService loginService, JwtService jwtService, UsuarioLogado usuarioLogado,
                             BolsistaService bolsistaService, ProfessorService professorService,
                             PasswordEncoder passwordEncoder) {
        this.loginService = loginService;
        this.jwtService = jwtService;
        this.usuarioLogado = usuarioLogado;
        this.bolsistaService = bolsistaService;
        this.professorService = professorService;
        this.passwordEncoder = passwordEncoder;
    }

    @Operation(summary = "Autentica e grava o token jwt num cookie httpOnly. As chamadas seguintes nao precisam mandar nada a mais.")
    @PostMapping("/login")
    public UsuarioResponse login(@RequestBody LoginRequest body,
                                 HttpSession session,
                                 HttpServletResponse response) {
        Usuario usuario = loginService.autenticar(
                body.email() != null ? body.email().trim() : null,
                body.senha() != null ? body.senha().trim() : null);

        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        }

        String token = jwtService.gerarToken(usuario.getEmail(), usuario.getTipoUsuario());
        CookieJwt.gravar(response, token, jwtService.getExpiracaoMinutos());
        session.setAttribute("usuario", usuario);
        return UsuarioResponse.de(usuario);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session, HttpServletResponse response) {
        CookieJwt.limpar(response);
        session.invalidate();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UsuarioResponse eu(HttpSession session) {
        return UsuarioResponse.de(usuarioLogado.obrigatorio(session));
    }

    @Operation(summary = "Atualiza o proprio perfil. A troca de senha exige a senha atual.")
    @PutMapping("/perfil")
    public UsuarioResponse atualizarPerfil(@RequestBody PerfilRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);

        String nome = StringUtil.limpar(body.nome());
        String email = StringUtil.limpar(body.email());
        if (nome.length() < 3) {
            throw new IllegalArgumentException("O nome deve ter pelo menos 3 caracteres.");
        }
        if (StringUtil.estaVazio(email)) {
            throw new IllegalArgumentException("E-mail e obrigatorio.");
        }

        String senhaNova = null;
        boolean trocandoSenha = !StringUtil.estaVazio(body.senhaAtual())
                || !StringUtil.estaVazio(body.senha())
                || !StringUtil.estaVazio(body.confirmaSenha());
        if (trocandoSenha) {
            if (StringUtil.estaVazio(body.senhaAtual()) || StringUtil.estaVazio(body.senha())
                    || StringUtil.estaVazio(body.confirmaSenha())) {
                throw new IllegalArgumentException("Para alterar a senha, preencha a senha atual, a nova e a confirmacao.");
            }
            /* bcrypt tem salt, entao comparar strings de hash nao funciona */
            if (!passwordEncoder.matches(body.senhaAtual(), logado.getSenha())) {
                throw new IllegalArgumentException("A senha atual informada esta incorreta.");
            }
            if (body.senha().length() < 6) {
                throw new IllegalArgumentException("A nova senha deve ter pelo menos 6 caracteres.");
            }
            if (!body.senha().equals(body.confirmaSenha())) {
                throw new IllegalArgumentException("A nova senha e a confirmacao nao coincidem.");
            }
            senhaNova = passwordEncoder.encode(body.senha());
        }

        Usuario atualizado;
        if (logado.isProfessor()) {
            Professor p = professorService.buscarPorId(logado.getId());
            if (p == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado.");
            }
            aplicar(p, nome, email, body, senhaNova);
            professorService.atualizar(p);
            atualizado = p;
        } else {
            Bolsista b = bolsistaService.buscarPorId(logado.getId());
            if (b == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado.");
            }
            aplicar(b, nome, email, body, senhaNova);
            bolsistaService.atualizar(b);
            atualizado = b;
        }

        /* a sessao guarda o usuario para as telas: precisa refletir o que mudou */
        session.setAttribute("usuario", atualizado);
        return UsuarioResponse.de(atualizado);
    }

    private void aplicar(Usuario u, String nome, String email, PerfilRequest body, String senhaNova) {
        u.setNome(nome);
        u.setEmail(email);
        u.setFotoUrl(body.fotoUrl());
        u.setBio(body.bio());
        if (senhaNova != null) {
            u.setSenha(senhaNova);
        }
    }

    @Operation(summary = "Quantas vagas de administrador ainda existem (limite de 3).")
    @GetMapping("/admins-restantes")
    public Map<String, Integer> adminsRestantes() {
        return Map.of("restantes", Math.max(0, LIMITE_ADMINS - bolsistaService.contarAdmins()));
    }

    @Operation(summary = "Cadastro publico de administrador, limitado a 3 no sistema.")
    @PostMapping("/cadastro-admin")
    public ResponseEntity<UsuarioResponse> cadastrarAdmin(@RequestBody CadastroAdminRequest body) {
        String nome = StringUtil.limpar(body.nome());
        String email = StringUtil.limpar(body.email());
        String senha = StringUtil.limpar(body.senha());
        String confirma = StringUtil.limpar(body.confirmaSenha());

        if (nome.length() < 3) {
            throw new IllegalArgumentException("O nome deve ter pelo menos 3 caracteres.");
        }
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new IllegalArgumentException("Informe um e-mail valido.");
        }
        if (senha.length() < 6) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
        }
        if (!senha.equals(confirma)) {
            throw new IllegalArgumentException("As senhas nao coincidem.");
        }
        if (bolsistaService.contarAdmins() >= LIMITE_ADMINS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "O sistema ja possui o numero maximo de administradores (" + LIMITE_ADMINS + ").");
        }

        Bolsista admin = new Bolsista();
        admin.setNome(nome);
        admin.setEmail(email);
        admin.setSenha(passwordEncoder.encode(senha));
        admin.setTipoUsuario("ADMIN");
        admin.setAtivo(true);
        admin.setDataNascimento(java.time.LocalDate.of(1990, 1, 1));
        admin.setCurso("Gestao");
        admin.setMatricula("ADM001");
        bolsistaService.inserir(admin);

        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.de(admin));
    }
}
