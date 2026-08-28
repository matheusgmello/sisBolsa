package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.FrequenciaRequest;
import dev.matheus.cadastroBolsistas.dto.FrequenciaResponse;
import dev.matheus.cadastroBolsistas.dto.PaginaResponse;
import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Frequencia;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.FrequenciaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Tag(name = "Frequencias", description = "Registro de horas trabalhadas pelos bolsistas.")
@RestController
@RequestMapping("/api/frequencias")
public class FrequenciaApiController {

    private static final int TAMANHO_PAGINA = 10;

    private final FrequenciaService frequenciaService;
    private final BolsistaService bolsistaService;
    private final LaboratorioService laboratorioService;
    private final UsuarioLogado usuarioLogado;

    public FrequenciaApiController(FrequenciaService frequenciaService, BolsistaService bolsistaService,
                                   LaboratorioService laboratorioService, UsuarioLogado usuarioLogado) {
        this.frequenciaService = frequenciaService;
        this.bolsistaService = bolsistaService;
        this.laboratorioService = laboratorioService;
        this.usuarioLogado = usuarioLogado;
    }

    @Operation(summary = "Lista frequencias paginadas. Bolsista comum ve apenas as proprias, e o filtro bolsistaId e ignorado para ele.")
    @GetMapping
    public PaginaResponse<FrequenciaResponse> listar(@RequestParam(defaultValue = "1") int pagina,
                                                     @RequestParam(required = false) UUID bolsistaId,
                                                     HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        UUID filtro = logado.isBolsista() ? logado.getId() : bolsistaId;

        if (filtro != null) {
            exigirPermissao(logado, filtro);
        }

        int total;
        List<Frequencia> pagina1;
        int atual;

        if (filtro == null && logado.isProfessor()) {
            List<UUID> ids = idsDosMeusBolsistas(logado);
            total = frequenciaService.contarPorBolsistas(ids);
            atual = paginaValida(pagina, total);
            pagina1 = frequenciaService.buscarPorBolsistas(ids, TAMANHO_PAGINA, (atual - 1) * TAMANHO_PAGINA);
        } else {
            total = frequenciaService.contarFrequencias(filtro);
            atual = paginaValida(pagina, total);
            pagina1 = frequenciaService.buscarFrequencias(filtro, TAMANHO_PAGINA, (atual - 1) * TAMANHO_PAGINA);
        }

        int totalPaginas = Math.max(1, (int) Math.ceil(total / (double) TAMANHO_PAGINA));
        return new PaginaResponse<>(pagina1.stream().map(FrequenciaResponse::de).toList(), atual, totalPaginas, total);
    }

    @Operation(summary = "Horas do mes corrente e total acumulado do bolsista.")
    @GetMapping("/resumo")
    public Map<String, Double> resumo(@RequestParam(required = false) UUID bolsistaId, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        UUID alvo = logado.isBolsista() ? logado.getId()
                 : (bolsistaId != null ? bolsistaId : logado.getId());
        exigirPermissao(logado, alvo);

        List<Frequencia> todas = frequenciaService.listarPorBolsista(alvo);
        LocalDate hoje = LocalDate.now();
        double mes = todas.stream()
                .filter(f -> f.getData() != null
                        && f.getData().getMonthValue() == hoje.getMonthValue()
                        && f.getData().getYear() == hoje.getYear())
                .mapToDouble(Frequencia::getHorasTrabalhadas).sum();
        double total = todas.stream().mapToDouble(Frequencia::getHorasTrabalhadas).sum();
        return Map.of("horasMes", mes, "horasTotal", total);
    }

    @Operation(summary = "Exporta em CSV as frequencias visiveis para quem chama.")
    @GetMapping("/exportar")
    public void exportar(@RequestParam(required = false) UUID bolsistaId,
                         HttpSession session,
                         HttpServletResponse response) throws java.io.IOException {
        Usuario logado = usuarioLogado.obrigatorio(session);
        UUID filtro = logado.isBolsista() ? logado.getId() : bolsistaId;
        if (filtro != null) {
            exigirPermissao(logado, filtro);
        }

        List<Frequencia> lista = (filtro == null && logado.isProfessor())
                ? frequenciaService.buscarPorBolsistas(idsDosMeusBolsistas(logado), null, null)
                : frequenciaService.buscarFrequencias(filtro, null, null);

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=frequencias.csv");
        try (java.io.PrintWriter writer = response.getWriter()) {
            writer.println("ID,Bolsista,Data,Horas Trabalhadas,Descricao");
            for (Frequencia f : lista) {
                writer.println(String.join(",",
                        String.valueOf(f.getId()),
                        csv(f.getNomeBolsista()),
                        f.getData() != null ? f.getData().toString() : "",
                        String.valueOf(f.getHorasTrabalhadas()),
                        csv(f.getDescricao())));
            }
        }
    }

    private static String csv(String valor) {
        if (valor == null) {
            return "";
        }
        return "\"" + valor.replace("\"", "\"\"") + "\"";
    }

    @GetMapping("/{id}")
    public FrequenciaResponse buscar(@PathVariable UUID id, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Frequencia f = exigirFrequencia(id);
        exigirPermissao(logado, f.getBolsistaId());
        return FrequenciaResponse.de(f);
    }

    @Operation(summary = "Registra frequencia. Bolsista comum sempre registra para si mesmo, independente do bolsistaId enviado.")
    @PostMapping
    public ResponseEntity<FrequenciaResponse> registrar(@RequestBody FrequenciaRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        validar(body);

        UUID alvo = resolverBolsistaAlvo(logado, body.bolsistaId());
        exigirPermissao(logado, alvo);

        Frequencia f = new Frequencia();
        f.setBolsistaId(alvo);
        f.setData(body.data());
        f.setHorasTrabalhadas(body.horasTrabalhadas());
        f.setDescricao(StringUtil.limpar(body.descricao()));
        frequenciaService.registrar(f);
        return ResponseEntity.status(HttpStatus.CREATED).body(FrequenciaResponse.de(f));
    }

    @PutMapping("/{id}")
    public FrequenciaResponse atualizar(@PathVariable UUID id, @RequestBody FrequenciaRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Frequencia f = exigirFrequencia(id);
        exigirPermissao(logado, f.getBolsistaId());
        validar(body);

        f.setData(body.data());
        f.setHorasTrabalhadas(body.horasTrabalhadas());
        f.setDescricao(StringUtil.limpar(body.descricao()));
        frequenciaService.atualizar(f);
        return FrequenciaResponse.de(f);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Frequencia f = exigirFrequencia(id);
        exigirPermissao(logado, f.getBolsistaId());
        frequenciaService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    private int paginaValida(int pedida, int total) {
        int totalPaginas = Math.max(1, (int) Math.ceil(total / (double) TAMANHO_PAGINA));
        return Math.min(Math.max(pedida, 1), totalPaginas);
    }

    private List<UUID> idsDosMeusBolsistas(Usuario professor) {
        return laboratorioService.listarPorCoordenador(professor.getId()).stream()
                .flatMap(lab -> bolsistaService.buscarPorLaboratorio(lab.getId()).stream())
                .map(Bolsista::getId)
                .distinct()
                .toList();
    }

    private Frequencia exigirFrequencia(UUID id) {
        Frequencia f = frequenciaService.buscarPorId(id);
        if (f == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Frequencia nao encontrada.");
        }
        return f;
    }

    private UUID resolverBolsistaAlvo(Usuario logado, UUID pedido) {
        if (logado.isBolsista()) {
            return logado.getId();
        }
        if (pedido == null) {
            throw new IllegalArgumentException("Informe o bolsista da frequencia.");
        }
        return pedido;
    }

    private void exigirPermissao(Usuario logado, UUID bolsistaId) {
        if (logado.isAdmin() || Objects.equals(logado.getId(), bolsistaId)) {
            return;
        }
        Bolsista alvo = bolsistaService.buscarPorId(bolsistaId);
        if (alvo == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bolsista nao encontrado.");
        }
        usuarioLogado.exigir(bolsistaService.podeGerenciar(logado, alvo),
                "Sem permissao sobre a frequencia deste bolsista.");
    }

    private void validar(FrequenciaRequest body) {
        if (body.data() == null) {
            throw new IllegalArgumentException("Data e obrigatoria.");
        }
        if (body.horasTrabalhadas() == null || body.horasTrabalhadas() <= 0 || body.horasTrabalhadas() > 24) {
            throw new IllegalArgumentException("Horas trabalhadas precisa estar entre 0 e 24.");
        }
        if (StringUtil.estaVazio(body.descricao())) {
            throw new IllegalArgumentException("Descricao e obrigatoria.");
        }
    }
}
