package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.security.CookieJwt;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LogoutController {

    @GetMapping("/logout")
    public String logout(HttpSession session, HttpServletResponse response) {
        CookieJwt.limpar(response);
        session.invalidate();
        return "redirect:/login";
    }
}
