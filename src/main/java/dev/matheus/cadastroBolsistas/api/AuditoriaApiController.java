package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.AuditoriaResponse;
import dev.matheus.cadastroBolsistas.dto.PaginaResponse;
import dev.matheus.cadastroBolsistas.model.Auditoria;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.AuditoriaService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Tag(name = "Auditoria", description = "Trilha de auditoria e registro de atividades no sistema.")
@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaApiController {

    private static final int TAMANHO_PAGINA = 15;

    private final AuditoriaService auditoriaService;
    private final UsuarioLogado usuarioLogado;

    public AuditoriaApiController(AuditoriaService auditoriaService, UsuarioLogado usuarioLogado) {
        this.auditoriaService = auditoriaService;
        this.usuarioLogado = usuarioLogado;
    }

    @Operation(summary = "Lista logs de auditoria com paginação e filtros opcionais.")
    @GetMapping
    public PaginaResponse<AuditoriaResponse> listar(@RequestParam(defaultValue = "1") int pagina,
                                                   @RequestParam(required = false) String entidade,
                                                   @RequestParam(required = false) String acao,
                                                   @RequestParam(required = false) LocalDate dataInicio,
                                                   @RequestParam(required = false) LocalDate dataFim,
                                                   HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        usuarioLogado.exigir(logado.isAdmin() || logado.isProfessor(), "Acesso restrito a administradores e professores.");

        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : null;
        LocalDateTime fim = dataFim != null ? dataFim.atTime(LocalTime.MAX) : null;
        String ent = StringUtil.estaVazio(entidade) ? null : entidade.trim();
        String ac = StringUtil.estaVazio(acao) ? null : acao.trim();

        int total = auditoriaService.contarLogs(ent, ac, inicio, fim);
        int totalPaginas = Math.max(1, (int) Math.ceil(total / (double) TAMANHO_PAGINA));
        int atual = Math.min(Math.max(pagina, 1), totalPaginas);

        List<Auditoria> itens = auditoriaService.buscarLogs(ent, ac, inicio, fim, TAMANHO_PAGINA, (atual - 1) * TAMANHO_PAGINA);
        return new PaginaResponse<>(itens.stream().map(AuditoriaResponse::de).toList(), atual, totalPaginas, total);
    }

    @Operation(summary = "Exporta logs de auditoria em CSV.")
    @GetMapping("/exportar")
    public void exportar(@RequestParam(required = false) String entidade,
                         @RequestParam(required = false) String acao,
                         @RequestParam(required = false) LocalDate dataInicio,
                         @RequestParam(required = false) LocalDate dataFim,
                         HttpSession session,
                         HttpServletResponse response) throws IOException {
        Usuario logado = usuarioLogado.obrigatorio(session);
        usuarioLogado.exigir(logado.isAdmin() || logado.isProfessor(), "Acesso restrito a administradores e professores.");

        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : null;
        LocalDateTime fim = dataFim != null ? dataFim.atTime(LocalTime.MAX) : null;
        String ent = StringUtil.estaVazio(entidade) ? null : entidade.trim();
        String ac = StringUtil.estaVazio(acao) ? null : acao.trim();

        List<Auditoria> lista = auditoriaService.buscarLogs(ent, ac, inicio, fim, null, null);

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=auditoria.csv");
        try (PrintWriter writer = response.getWriter()) {
            writer.println("Data/Hora,Usuario,Acao,Entidade,Detalhes,IP");
            for (Auditoria a : lista) {
                writer.println(String.join(",",
                        a.getDataHora() != null ? a.getDataHora().toString() : "",
                        csv(a.getUsuarioNome()),
                        csv(a.getAcao()),
                        csv(a.getEntidade()),
                        csv(a.getDetalhes()),
                        csv(a.getIpOrigem())));
            }
        }
    }

    private static String csv(String valor) {
        if (valor == null) return "";
        return "\"" + valor.replace("\"", "\"\"") + "\"";
    }
}
