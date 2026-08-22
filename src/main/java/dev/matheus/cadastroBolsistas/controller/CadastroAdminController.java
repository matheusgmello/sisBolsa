package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import org.springframework.security.crypto.password.PasswordEncoder;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

/*
 * responsavel pelo cadastro de administradores.
 * permite criar ate 3 admins no sistema.
 * acessivel pela tela de login, sem necessidade de estar autenticado.
 */
@Controller
@RequestMapping("/cadastro-admin")
public class CadastroAdminController {

    private static final int LIMITE_ADMINS = 3;

    @Autowired
    private BolsistaService bolsistaService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public String formulario(Model model) {
        try {
            int total = bolsistaService.contarAdmins();

            if (total >= LIMITE_ADMINS) {
                model.addAttribute("erro", "O sistema ja possui o numero maximo de administradores (" + LIMITE_ADMINS + ").");
                return "login";
            }

            model.addAttribute("adminsRestantes", LIMITE_ADMINS - total);
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Erro ao verificar administradores: " + e.getMessage());
            return "login";
        }
        return "cadastro-admin";
    }

    @PostMapping
    public String cadastrar(@RequestParam String nome,
                            @RequestParam String email,
                            @RequestParam String senha,
                            @RequestParam String confirmaSenha,
                            Model model) {
        nome = StringUtil.limpar(nome);
        email = StringUtil.limpar(email);
        senha = StringUtil.limpar(senha);
        confirmaSenha = StringUtil.limpar(confirmaSenha);

        String erro = validar(nome, email, senha, confirmaSenha);
        if (erro != null) {
            model.addAttribute("erro", erro);
            return "cadastro-admin";
        }

        try {
            if (bolsistaService.contarAdmins() >= LIMITE_ADMINS) {
                model.addAttribute("erro", "O sistema ja possui o numero maximo de administradores (" + LIMITE_ADMINS + ").");
                return "login";
            }

            Bolsista admin = new Bolsista();
            admin.setNome(nome);
            admin.setEmail(email);
            admin.setSenha(passwordEncoder.encode(senha));
            admin.setTipoUsuario("ADMIN");
            admin.setAtivo(true);
            admin.setDataNascimento(LocalDate.of(1990, 1, 1));
            admin.setCurso("Gestao");
            admin.setMatricula("ADM001");

            boolean sucesso = bolsistaService.inserir(admin);
            if (sucesso) {
                model.addAttribute("sucesso", "Administrador cadastrado com sucesso! Faca o login.");
                return "login";
            } else {
                model.addAttribute("erro", "Nao foi possivel cadastrar o administrador.");
                return "cadastro-admin";
            }
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Erro ao cadastrar administrador: " + e.getMessage());
            return "cadastro-admin";
        }
    }

    private String validar(String nome, String email, String senha, String confirmaSenha) {
        if (StringUtil.estaVazio(nome) || nome.length() < 3) {
            return "O nome deve ter pelo menos 3 caracteres.";
        }
        if (StringUtil.estaVazio(email) || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return "Informe um e-mail valido.";
        }
        if (StringUtil.estaVazio(senha) || senha.length() < 6) {
            return "A senha deve ter pelo menos 6 caracteres.";
        }
        if (!senha.equals(confirmaSenha)) {
            return "As senhas nao coincidem.";
        }
        return null;
    }
}
