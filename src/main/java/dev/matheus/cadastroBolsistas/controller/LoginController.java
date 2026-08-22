package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.security.CookieJwt;
import dev.matheus.cadastroBolsistas.security.JwtService;
import dev.matheus.cadastroBolsistas.service.LoginService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/*
 * autentica o usuario e emite o jwt no cookie httpOnly.
 * o objeto na sessao continua existindo porque as jsp leem dele.
 */
@Controller
public class LoginController {

    @Autowired
    private LoginService loginService;

    @Autowired
    private JwtService jwtService;

    @GetMapping({"/", "/login"})
    public String loginPage() {
        return "login";
    }

    @PostMapping("/login")
    public String autenticar(@RequestParam String email,
                             @RequestParam String senha,
                             HttpSession session,
                             HttpServletResponse response,
                             Model model) {
        email = email != null ? email.trim() : "";
        senha = senha != null ? senha.trim() : "";

        Usuario usuarioAutenticado = loginService.autenticar(email, senha);

        if (usuarioAutenticado != null) {
            String token = jwtService.gerarToken(usuarioAutenticado.getEmail(), usuarioAutenticado.getTipoUsuario());
            CookieJwt.gravar(response, token, jwtService.getExpiracaoMinutos());
            session.setAttribute("usuario", usuarioAutenticado);
            return "redirect:/dashboard";
        }

        model.addAttribute("erro", "USUARIO OU SENHA INCORRETOS");
        return "login";
    }
}
