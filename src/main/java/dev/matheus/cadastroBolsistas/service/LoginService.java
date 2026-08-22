package dev.matheus.cadastroBolsistas.service;

import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.repository.BolsistaRepository;
import dev.matheus.cadastroBolsistas.repository.ProfessorRepository;
import dev.matheus.cadastroBolsistas.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    @Autowired
    private BolsistaRepository bolsistaRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    public Usuario autenticar(String email, String senha) {
        try {
            String senhaHash = SecurityUtil.hashSenha(senha);
            /*
             * tenta primeiro como bolsista ou admin, que moram na mesma tabela.
             * so cai para professor se nao achar nada.
             */
            Usuario u = bolsistaRepository.findByEmailAndSenhaAndAtivoTrue(email, senhaHash).orElse(null);
            if (u != null) {
                return u;
            }
            return professorRepository.findByEmailAndSenhaAndAtivoTrue(email, senhaHash).orElse(null);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
