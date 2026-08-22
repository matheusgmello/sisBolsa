package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.FrequenciaRequest;
import dev.matheus.cadastroBolsistas.dto.FrequenciaResponse;
import dev.matheus.cadastroBolsistas.dto.PaginaResponse;
import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Frequencia;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.FrequenciaService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/frequencias")
public class FrequenciaApiController {

    private static final int TAMANHO_PAGINA = 10;

    private final FrequenciaService frequenciaService;
    private final BolsistaService bolsistaService;
    private final UsuarioLogado usuarioLogado;

    public FrequenciaApiController(FrequenciaService frequenciaService, BolsistaService bolsistaService,
                                   UsuarioLogado usuarioLogado) {
        this.frequenciaService = frequenciaService;
        this.bolsistaService = bolsistaService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping
    public PaginaResponse<FrequenciaResponse> listar(@RequestParam(defaultValue = "1") int pagina,
                                                     @RequestParam(required = false) Integer bolsistaId,
                                                     HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);

        /*
         * bolsista comum so ve as proprias frequencias, ignorando o filtro pedido.
         * o Integer.valueOf e proposital: com int de um lado e Integer do outro,
         * o ternario faz unboxing dos dois e estoura NPE quando bolsistaId e null.
         */
        Integer filtro = logado.isBolsista() ? Integer.valueOf(logado.getId()) : bolsistaId;

        int total = frequenciaService.contarFrequencias(filtro);
        int totalPaginas = Math.max(1, (int) Math.ceil(total / (double) TAMANHO_PAGINA));
        int atual = Math.min(Math.max(pagina, 1), totalPaginas);

        List<FrequenciaResponse> itens = frequenciaService
                .buscarFrequencias(filtro, TAMANHO_PAGINA, (atual - 1) * TAMANHO_PAGINA)
                .stream().map(FrequenciaResponse::de).toList();

        return new PaginaResponse<>(itens, atual, totalPaginas, total);
    }

    @GetMapping("/{id}")
    public FrequenciaResponse buscar(@PathVariable int id, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Frequencia f = exigirFrequencia(id);
        exigirPermissao(logado, f.getBolsistaId());
        return FrequenciaResponse.de(f);
    }

    @PostMapping
    public ResponseEntity<FrequenciaResponse> registrar(@RequestBody FrequenciaRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        validar(body);

        int alvo = resolverBolsistaAlvo(logado, body.bolsistaId());
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
    public FrequenciaResponse atualizar(@PathVariable int id, @RequestBody FrequenciaRequest body, HttpSession session) {
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
    public ResponseEntity<Void> excluir(@PathVariable int id, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Frequencia f = exigirFrequencia(id);
        exigirPermissao(logado, f.getBolsistaId());
        frequenciaService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    private Frequencia exigirFrequencia(int id) {
        Frequencia f = frequenciaService.buscarPorId(id);
        if (f == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Frequencia nao encontrada.");
        }
        return f;
    }

    /* bolsista comum sempre registra para si mesmo, ignorando o id que mandar */
    private int resolverBolsistaAlvo(Usuario logado, Integer pedido) {
        if (logado.isBolsista()) {
            return logado.getId();
        }
        if (pedido == null || pedido < 1) {
            throw new IllegalArgumentException("Informe o bolsista da frequencia.");
        }
        return pedido;
    }

    private void exigirPermissao(Usuario logado, int bolsistaId) {
        if (logado.isAdmin() || logado.getId() == bolsistaId) {
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
