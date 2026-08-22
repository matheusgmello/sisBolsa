package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.service.RelatorioService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/*
 * controller responsavel pela tela de relatorios analiticos.
 * exibe estatisticas agregadas via sql: horas mensais, projetos por lab,
 * distribuicao por cargo e alertas de ocupacao de laboratorios.
 * acesso restrito ao perfil admin verificado no proprio metodo.
 */
@Controller
public class RelatorioController {

    @Autowired
    private BolsistaService bolsistaService;

    @Autowired
    private LaboratorioService laboratorioService;

    @Autowired
    private RelatorioService relatorioService;

    @GetMapping("/relatorio")
    public String relatorio(HttpSession session, Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (!usuarioLogado.isAdmin()) {
            return "redirect:/dashboard";
        }

        try {
            // Dados básicos existentes
            ArrayList<Bolsista> bolsistas = bolsistaService.listarTodos();
            ArrayList<Laboratorio> laboratorios = laboratorioService.listarTodos();

            long totalBolsistas = bolsistas.size();
            long totalLabs = laboratorios.size();
            long bolsistasAtivos = bolsistas.stream().filter(Bolsista::isAtivo).count();

            Map<String, Long> bolsistasPorCurso = bolsistas.stream()
                    .collect(Collectors.groupingBy(Bolsista::getCurso, Collectors.counting()));

            Map<String, Long> labsPorStatus = laboratorios.stream()
                    .collect(Collectors.groupingBy(Laboratorio::getStatus, Collectors.counting()));

            model.addAttribute("totalBolsistas", totalBolsistas);
            model.addAttribute("totalLabs", totalLabs);
            model.addAttribute("bolsistasAtivos", bolsistasAtivos);
            model.addAttribute("bolsistasPorCurso", bolsistasPorCurso);
            model.addAttribute("labsPorStatus", labsPorStatus);

            // Novos relatórios avançados (SQL nativo via RelatorioService)
            model.addAttribute("horasBolsistas", relatorioService.getHorasBolsistasMesCorrente());
            model.addAttribute("projetosPorLab", relatorioService.getProjetosAtivosPorLaboratorio());
            model.addAttribute("bolsistasPorCargo", relatorioService.getBolsistasPorCargo());
            
            // Laboratórios próximos do limite (> 85%)
            var labsLimite = relatorioService.getLaboratoriosOcupacao().stream()
                    .filter(lab -> lab.getPercentualOcupacao() >= 85.0)
                    .collect(Collectors.toList());
            model.addAttribute("labsLimite", labsLimite);

        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/dashboard";
        }
        return "relatorios";
    }
}
