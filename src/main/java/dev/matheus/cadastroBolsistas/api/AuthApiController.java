package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.LoginRequest;
import dev.matheus.cadastroBolsistas.dto.UsuarioResponse;
import dev.matheus.cadastroBolsistas.model.Usuario;
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

@Tag(name = "Autenticacao", description = "Login, logout e dados do usuario da sessao atual.")
@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    private final LoginService loginService;
    private final JwtService jwtService;
    private final UsuarioLogado usuarioLogado;

    public AuthApiController(LoginService loginService, JwtService jwtService, UsuarioLogado usuarioLogado) {
        this.loginService = loginService;
        this.jwtService = jwtService;
        this.usuarioLogado = usuarioLogado;
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
}
