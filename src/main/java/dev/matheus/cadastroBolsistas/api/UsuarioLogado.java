package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.model.Usuario;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/*
 * o JwtCookieFilter poe o usuario na sessao a partir do token, entao aqui e so
 * leitura. o 401 e rede de seguranca: o spring security ja barra /api/**
 * sem token valido antes de chegar no controller.
 */
@Component
public class UsuarioLogado {

    public Usuario obrigatorio(HttpSession session) {
        Usuario u = (Usuario) session.getAttribute("usuario");
        if (u == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nao autenticado.");
        }
        return u;
    }

    public void exigirAdmin(Usuario usuario) {
        if (!usuario.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requer perfil de administrador.");
        }
    }

    public void exigir(boolean condicao, String mensagem) {
        if (!condicao) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, mensagem);
        }
    }
}
