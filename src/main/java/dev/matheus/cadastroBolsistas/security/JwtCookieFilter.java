package dev.matheus.cadastroBolsistas.security;

import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.LoginService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/*
 * le o jwt do cookie e autentica a requisicao.
 *
 * as jsp e os controllers ainda leem o usuario da HttpSession. entao, alem de
 * popular o SecurityContext, o filtro repoe o atributo "usuario" na sessao
 * quando ele nao esta la (sessao expirada com token ainda valido, por exemplo).
 * assim quem manda e o token, e a sessao vira so cache da view.
 *
 * ponytail: essa reposicao existe so enquanto as jsp existirem. some na etapa 6.
 */
@Component
public class JwtCookieFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final LoginService loginService;

    public JwtCookieFilter(JwtService jwtService, LoginService loginService) {
        this.jwtService = jwtService;
        this.loginService = loginService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = CookieJwt.ler(request);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            Claims claims = jwtService.validar(token);
            if (claims != null) {
                autenticar(request, claims);
            }
        }
        chain.doFilter(request, response);
    }

    private void autenticar(HttpServletRequest request, Claims claims) {
        String email = claims.getSubject();
        String tipo = claims.get("tipo", String.class);

        HttpSession session = request.getSession(true);
        Usuario usuario = (Usuario) session.getAttribute("usuario");

        /*
         * so vai no banco quando a sessao perdeu o usuario. no caminho normal
         * o objeto ja esta la desde o login.
         */
        if (usuario == null || !email.equals(usuario.getEmail())) {
            usuario = loginService.buscarPorEmail(email);
            if (usuario == null) {
                return;
            }
            session.setAttribute("usuario", usuario);
        }

        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + tipo));
        var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
