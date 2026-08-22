package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.*;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.service.ProjetoService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/laboratorios")
public class LaboratorioApiController {

    private final LaboratorioService laboratorioService;
    private final BolsistaService bolsistaService;
    private final ProjetoService projetoService;
    private final UsuarioLogado usuarioLogado;

    public LaboratorioApiController(LaboratorioService laboratorioService, BolsistaService bolsistaService,
                                    ProjetoService projetoService, UsuarioLogado usuarioLogado) {
        this.laboratorioService = laboratorioService;
        this.bolsistaService = bolsistaService;
        this.projetoService = projetoService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping
    public List<LaboratorioResponse> listar(HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        /* professor so enxerga o que coordena; admin e bolsista veem todos */
        List<Laboratorio> labs = logado.isProfessor()
                ? laboratorioService.listarPorCoordenador(logado.getId())
                : laboratorioService.listarTodos();
        return labs.stream().map(this::comOcupacao).toList();
    }

    @GetMapping("/{id}")
    public LaboratorioResponse buscar(@PathVariable int id, HttpSession session) {
        usuarioLogado.obrigatorio(session);
        return comOcupacao(exigirLab(id));
    }

    @GetMapping("/{id}/bolsistas")
    public List<UsuarioResponse> bolsistas(@PathVariable int id, HttpSession session) {
        usuarioLogado.obrigatorio(session);
        exigirLab(id);
        return bolsistaService.buscarPorLaboratorio(id).stream().map(UsuarioResponse::de).toList();
    }

    @GetMapping("/{id}/projetos")
    public List<ProjetoResponse> projetos(@PathVariable int id, HttpSession session) {
        usuarioLogado.obrigatorio(session);
        exigirLab(id);
        return projetoService.listarPorLaboratorio(id).stream().map(ProjetoResponse::de).toList();
    }

    @PostMapping
    public ResponseEntity<LaboratorioResponse> criar(@RequestBody LaboratorioRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        usuarioLogado.exigirAdmin(logado);
        validar(body);

        Laboratorio lab = new Laboratorio();
        aplicar(lab, body);
        laboratorioService.cadastrar(lab);
        return ResponseEntity.status(HttpStatus.CREATED).body(comOcupacao(lab));
    }

    @PutMapping("/{id}")
    public LaboratorioResponse atualizar(@PathVariable int id, @RequestBody LaboratorioRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Laboratorio lab = exigirLab(id);
        usuarioLogado.exigir(laboratorioService.podeGerenciar(logado, id), "Sem permissao para editar este laboratorio.");
        validar(body);

        aplicar(lab, body);
        lab.setAtivo(true);
        laboratorioService.atualizar(lab);
        return comOcupacao(lab);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        exigirLab(id);
        usuarioLogado.exigir(laboratorioService.podeGerenciar(logado, id), "Sem permissao para excluir este laboratorio.");
        laboratorioService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    private Laboratorio exigirLab(int id) {
        Laboratorio lab = laboratorioService.buscarPorId(id);
        if (lab == null || !lab.isAtivo()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Laboratorio nao encontrado.");
        }
        return lab;
    }

    private void validar(LaboratorioRequest body) {
        if (StringUtil.estaVazio(body.nome())) {
            throw new IllegalArgumentException("Nome do laboratorio e obrigatorio.");
        }
        if (body.capacidade() == null || body.capacidade() < 1) {
            throw new IllegalArgumentException("Capacidade precisa ser maior que zero.");
        }
    }

    private void aplicar(Laboratorio lab, LaboratorioRequest body) {
        lab.setNome(StringUtil.limpar(body.nome()));
        lab.setAreaPesquisa(body.areaPesquisa());
        lab.setStatus(StringUtil.estaVazio(body.status()) ? "Ativo" : body.status());
        lab.setCapacidade(body.capacidade());
        lab.setCoordenadorId(body.coordenadorId() != null ? body.coordenadorId() : 0);
    }

    private LaboratorioResponse comOcupacao(Laboratorio lab) {
        return LaboratorioResponse.de(lab, laboratorioService.contarBolsistasNoLaboratorio(lab.getId()));
    }
}
