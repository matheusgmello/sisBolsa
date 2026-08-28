package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.ProjetoRequest;
import dev.matheus.cadastroBolsistas.dto.ProjetoResponse;
import dev.matheus.cadastroBolsistas.dto.UsuarioResponse;
import dev.matheus.cadastroBolsistas.model.Projeto;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.service.ProjetoService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Tag(name = "Projetos", description = "Projetos de cada laboratorio e o vinculo com bolsistas.")
@RestController
@RequestMapping("/api/projetos")
public class ProjetoApiController {

    private final ProjetoService projetoService;
    private final LaboratorioService laboratorioService;
    private final BolsistaService bolsistaService;
    private final UsuarioLogado usuarioLogado;

    public ProjetoApiController(ProjetoService projetoService, LaboratorioService laboratorioService,
                                BolsistaService bolsistaService, UsuarioLogado usuarioLogado) {
        this.projetoService = projetoService;
        this.laboratorioService = laboratorioService;
        this.bolsistaService = bolsistaService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping
    public List<ProjetoResponse> listar(@RequestParam(required = false) String buscaNome,
                                        @RequestParam(required = false) UUID labId,
                                        HttpSession session) {
        usuarioLogado.obrigatorio(session);
        return projetoService.buscarProjetos(buscaNome, labId).stream().map(ProjetoResponse::de).toList();
    }

    @GetMapping("/{id}")
    public ProjetoResponse buscar(@PathVariable UUID id, HttpSession session) {
        usuarioLogado.obrigatorio(session);
        return ProjetoResponse.de(exigirProjeto(id));
    }

    @GetMapping("/{id}/membros")
    public List<UsuarioResponse> membros(@PathVariable UUID id, HttpSession session) {
        usuarioLogado.obrigatorio(session);
        exigirProjeto(id);
        return bolsistaService.buscarPorProjeto(id).stream().map(UsuarioResponse::de).toList();
    }

    @PostMapping
    public ResponseEntity<ProjetoResponse> criar(@RequestBody ProjetoRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        validar(body);
        usuarioLogado.exigir(laboratorioService.podeGerenciar(logado, body.laboratorioId()),
                "Sem permissao para criar projeto neste laboratorio.");

        Projeto p = new Projeto();
        aplicar(p, body);
        projetoService.cadastrar(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjetoResponse.de(p));
    }

    @PutMapping("/{id}")
    public ProjetoResponse atualizar(@PathVariable UUID id, @RequestBody ProjetoRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Projeto p = exigirProjeto(id);
        validar(body);
        exigirPermissaoNoLab(logado, p.getLaboratorioId());
        usuarioLogado.exigir(laboratorioService.podeGerenciar(logado, body.laboratorioId()),
                "Sem permissao para mover o projeto para este laboratorio.");

        aplicar(p, body);
        p.setAtivo(true);
        projetoService.atualizar(p);
        return ProjetoResponse.de(p);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Projeto p = exigirProjeto(id);
        exigirPermissaoNoLab(logado, p.getLaboratorioId());
        projetoService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/membros/{bolsistaId}")
    public ResponseEntity<Void> vincular(@PathVariable UUID id, @PathVariable UUID bolsistaId, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Projeto p = exigirProjeto(id);
        exigirPermissaoNoLab(logado, p.getLaboratorioId());
        if (bolsistaService.buscarPorId(bolsistaId) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bolsista nao encontrado.");
        }
        projetoService.vincularBolsista(bolsistaId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/membros/{bolsistaId}")
    public ResponseEntity<Void> desvincular(@PathVariable UUID id, @PathVariable UUID bolsistaId, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        Projeto p = exigirProjeto(id);
        exigirPermissaoNoLab(logado, p.getLaboratorioId());
        projetoService.desvincularBolsista(bolsistaId, id);
        return ResponseEntity.noContent().build();
    }

    private Projeto exigirProjeto(UUID id) {
        Projeto p = projetoService.buscarPorId(id);
        if (p == null || !p.isAtivo()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado.");
        }
        return p;
    }

    private void exigirPermissaoNoLab(Usuario logado, UUID labId) {
        usuarioLogado.exigir(laboratorioService.podeGerenciar(logado, labId),
                "Sem permissao para gerenciar projetos deste laboratorio.");
    }

    private void validar(ProjetoRequest body) {
        if (StringUtil.estaVazio(body.nome())) {
            throw new IllegalArgumentException("Nome do projeto e obrigatorio.");
        }
        if (body.laboratorioId() == null) {
            throw new IllegalArgumentException("Projeto precisa estar vinculado a um laboratorio.");
        }
    }

    private void aplicar(Projeto p, ProjetoRequest body) {
        p.setNome(StringUtil.limpar(body.nome()));
        p.setDescricao(body.descricao());
        p.setLaboratorioId(body.laboratorioId());
    }
}
