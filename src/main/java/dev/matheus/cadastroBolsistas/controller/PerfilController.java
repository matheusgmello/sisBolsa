package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.ProfessorService;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/*
 * controller responsavel pela visualizacao e atualizacao do perfil do usuario logado.
 * suporta bolsista e professor, atualizando a sessao apos salvar as mudancas.
 * a troca de senha exige confirmacao da senha atual hasheada via securityutil.
 */
@Controller
@RequestMapping("/perfil")
public class PerfilController {

    @Autowired
    private BolsistaService bolsistaService;

    @Autowired
    private ProfessorService professorService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public String perfilPage(HttpSession session, Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        model.addAttribute("usuario", usuarioLogado);
        return "perfil";
    }

    @PostMapping
    public String atualizarPerfil(@RequestParam String nome,
                                  @RequestParam String email,
                                  @RequestParam(required = false) String senhaAtual,
                                  @RequestParam(required = false) String senha,
                                  @RequestParam(required = false) String confirmaSenha,
                                  @RequestParam(required = false) String fotoUrl,
                                  @RequestParam(required = false) String bio,
                                  HttpSession session,
                                  Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        nome = nome != null ? nome.trim() : "";
        email = email != null ? email.trim() : "";
        senhaAtual = senhaAtual != null ? senhaAtual.trim() : "";
        senha = senha != null ? senha.trim() : "";
        confirmaSenha = confirmaSenha != null ? confirmaSenha.trim() : "";
        fotoUrl = fotoUrl != null ? fotoUrl.trim() : "";
        bio = bio != null ? bio.trim() : "";

        if (nome.isEmpty() || email.isEmpty()) {
            model.addAttribute("erro", "Nome e e-mail são campos obrigatórios.");
            model.addAttribute("usuario", usuarioLogado);
            return "perfil";
        }

        boolean alterandoSenha = !senhaAtual.isEmpty() || !senha.isEmpty() || !confirmaSenha.isEmpty();
        String senhaParaSalvar = usuarioLogado.getSenha(); // padrão: manter a mesma senha (que já está hasheada no banco/sessão)

        if (alterandoSenha) {
            if (senhaAtual.isEmpty() || senha.isEmpty() || confirmaSenha.isEmpty()) {
                model.addAttribute("erro", "Para alterar a senha, preencha todos os campos de senha (atual, nova e confirmação).");
                model.addAttribute("usuario", usuarioLogado);
                return "perfil";
            }
            
            /* bcrypt tem salt, entao comparar strings de hash nao funciona */
            if (!passwordEncoder.matches(senhaAtual, usuarioLogado.getSenha())) {
                model.addAttribute("erro", "A senha atual informada está incorreta.");
                model.addAttribute("usuario", usuarioLogado);
                return "perfil";
            }

            if (senha.length() < 6) {
                model.addAttribute("erro", "A nova senha deve ter pelo menos 6 caracteres.");
                model.addAttribute("usuario", usuarioLogado);
                return "perfil";
            }

            if (!senha.equals(confirmaSenha)) {
                model.addAttribute("erro", "A nova senha e a confirmação não coincidem.");
                model.addAttribute("usuario", usuarioLogado);
                return "perfil";
            }

            senhaParaSalvar = passwordEncoder.encode(senha);
        }

        try {
            if (usuarioLogado.isProfessor()) {
                Professor prof = professorService.buscarPorId(usuarioLogado.getId());
                if (prof == null) {
                    model.addAttribute("erro", "Perfil de professor nao encontrado no banco.");
                    model.addAttribute("usuario", usuarioLogado);
                    return "perfil";
                }
                prof.setNome(nome);
                prof.setEmail(email);
                prof.setSenha(senhaParaSalvar);
                prof.setFotoUrl(fotoUrl.isEmpty() ? null : fotoUrl);
                prof.setBio(bio.isEmpty() ? null : bio);

                professorService.atualizar(prof);
                session.setAttribute("usuario", prof);
            } else {
                Bolsista bol = bolsistaService.buscarPorId(usuarioLogado.getId());
                if (bol == null) {
                    model.addAttribute("erro", "Perfil de usuario nao encontrado no banco.");
                    model.addAttribute("usuario", usuarioLogado);
                    return "perfil";
                }
                bol.setNome(nome);
                bol.setEmail(email);
                bol.setSenha(senhaParaSalvar);
                bol.setFotoUrl(fotoUrl.isEmpty() ? null : fotoUrl);
                bol.setBio(bio.isEmpty() ? null : bio);

                bolsistaService.atualizar(bol);
                session.setAttribute("usuario", bol);
            }
            model.addAttribute("sucesso", "Perfil atualizado com sucesso!");
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Erro ao atualizar perfil: " + e.getMessage());
        }

        model.addAttribute("usuario", session.getAttribute("usuario"));
        return "perfil";
    }
}
