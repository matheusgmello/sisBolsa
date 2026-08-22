package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.repository.RelatorioRepository;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.service.ProjetoService;
import dev.matheus.cadastroBolsistas.service.RelatorioService;
import jakarta.servlet.http.HttpSession;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/*
 * relatorios sao so para admin. o SecurityConfig ja barra a rota por role,
 * a checagem aqui e o cinto alem do suspensorio.
 */
@Tag(name = "Relatorios", description = "Dados agregados do sistema. Exclusivo do perfil ADMIN.")
@RestController
@RequestMapping("/api/relatorios")
public class RelatorioApiController {

    private final RelatorioService relatorioService;
    private final BolsistaService bolsistaService;
    private final LaboratorioService laboratorioService;
    private final ProjetoService projetoService;
    private final UsuarioLogado usuarioLogado;

    public RelatorioApiController(RelatorioService relatorioService, BolsistaService bolsistaService,
                                  LaboratorioService laboratorioService, ProjetoService projetoService,
                                  UsuarioLogado usuarioLogado) {
        this.relatorioService = relatorioService;
        this.bolsistaService = bolsistaService;
        this.laboratorioService = laboratorioService;
        this.projetoService = projetoService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping("/resumo")
    public Map<String, Object> resumo(HttpSession session) {
        exigirAdmin(session);
        return Map.of(
                "totalBolsistas", bolsistaService.listarTodos().size(),
                "totalLaboratorios", laboratorioService.listarTodos().size(),
                "totalProjetos", projetoService.listarTodos().size());
    }

    @GetMapping("/horas-mes")
    public List<RelatorioRepository.HorasBolsista> horasDoMes(HttpSession session) {
        exigirAdmin(session);
        return relatorioService.getHorasBolsistasMesCorrente();
    }

    @GetMapping("/projetos-por-laboratorio")
    public List<RelatorioRepository.ProjetosPorLaboratorio> projetosPorLaboratorio(HttpSession session) {
        exigirAdmin(session);
        return relatorioService.getProjetosAtivosPorLaboratorio();
    }

    @GetMapping("/bolsistas-por-cargo")
    public List<RelatorioRepository.BolsistasPorCargo> bolsistasPorCargo(HttpSession session) {
        exigirAdmin(session);
        return relatorioService.getBolsistasPorCargo();
    }

    @GetMapping("/ocupacao")
    public List<RelatorioRepository.OcupacaoLaboratorio> ocupacao(HttpSession session) {
        exigirAdmin(session);
        return relatorioService.getLaboratoriosOcupacao();
    }

    private void exigirAdmin(HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        usuarioLogado.exigirAdmin(logado);
    }
}
