package dev.matheus.cadastroBolsistas.api;

import dev.matheus.cadastroBolsistas.dto.BolsistaRequest;
import dev.matheus.cadastroBolsistas.dto.PaginaResponse;
import dev.matheus.cadastroBolsistas.dto.UsuarioResponse;
import dev.matheus.cadastroBolsistas.model.*;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.service.ProfessorService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

/*
 * bolsistas, admins e professores saem pela mesma rota porque para quem consome
 * sao todos usuario - o que muda e o tipoUsuario.
 */
@Tag(name = "Usuarios", description = "Bolsistas, administradores e professores. O que muda entre eles e o campo tipoUsuario.")
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioApiController {

    private static final int TAMANHO_PAGINA = 10;

    private final BolsistaService bolsistaService;
    private final ProfessorService professorService;
    private final LaboratorioService laboratorioService;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioLogado usuarioLogado;

    public UsuarioApiController(BolsistaService bolsistaService, ProfessorService professorService,
                                LaboratorioService laboratorioService, PasswordEncoder passwordEncoder,
                                UsuarioLogado usuarioLogado) {
        this.bolsistaService = bolsistaService;
        this.professorService = professorService;
        this.laboratorioService = laboratorioService;
        this.passwordEncoder = passwordEncoder;
        this.usuarioLogado = usuarioLogado;
    }

    @Operation(summary = "Lista usuarios ja recortados pelo escopo de quem chama: admin ve todos, professor ve os bolsistas dos labs que coordena, bolsista ve os colegas do proprio lab.")
    @GetMapping
    public PaginaResponse<UsuarioResponse> listar(@RequestParam(defaultValue = "1") int pagina,
                                                  @RequestParam(required = false) String tipo,
                                                  @RequestParam(required = false) String buscaNome,
                                                  @RequestParam(required = false) String buscaCurso,
                                                  HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);

        ArrayList<Usuario> lista = new ArrayList<>();
        if (!StringUtil.estaVazio(buscaNome)) {
            lista.addAll(bolsistaService.buscarPorNome(buscaNome));
            if (logado.isAdmin()) {
                lista.addAll(professorService.buscarPorNome(buscaNome));
            }
        } else if (!StringUtil.estaVazio(buscaCurso)) {
            lista.addAll(bolsistaService.buscarPorCurso(buscaCurso));
        } else {
            lista.addAll(bolsistaService.listarTodos());
            if (logado.isAdmin()) {
                lista.addAll(professorService.listarTodos());
            }
        }

        if (!StringUtil.estaVazio(tipo)) {
            String filtro = tipo.trim().toUpperCase();
            lista.removeIf(u -> !filtro.equals(u.getTipoUsuario()));
        }

        preencherLabsDosProfessores(lista);
        lista = bolsistaService.filtrarPorEscopo(lista, logado);

        return paginar(lista, pagina);
    }

    @GetMapping("/{id}")
    public UsuarioResponse buscar(@PathVariable int id,
                                  @RequestParam(defaultValue = "BOLSISTA") String tipo,
                                  HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);

        if ("PROFESSOR".equalsIgnoreCase(tipo)) {
            usuarioLogado.exigirAdmin(logado);
            Professor p = professorService.buscarPorId(id);
            if (p == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Professor nao encontrado.");
            }
            return UsuarioResponse.de(p);
        }

        Bolsista b = bolsistaService.buscarPorId(id);
        if (b == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado.");
        }
        /* o proprio usuario sempre pode se ver; fora isso vale o podeGerenciar */
        usuarioLogado.exigir(logado.getId() == id || bolsistaService.podeGerenciar(logado, b),
                "Sem permissao para ver este usuario.");
        return UsuarioResponse.de(b);
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> criar(@RequestBody BolsistaRequest body, HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        usuarioLogado.exigir(!logado.isBolsista(), "Bolsista nao cadastra usuario.");
        validarObrigatorios(body, true);

        if ("PROFESSOR".equalsIgnoreCase(body.tipoUsuario())) {
            usuarioLogado.exigirAdmin(logado);
            Professor p = new Professor();
            aplicarComuns(p, body);
            p.setSenha(passwordEncoder.encode(body.senha()));
            p.setAtivo(true);
            professorService.inserir(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.de(p));
        }

        if ("ADMIN".equalsIgnoreCase(body.tipoUsuario())) {
            usuarioLogado.exigirAdmin(logado);
            if (bolsistaService.contarAdmins() >= 3) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Limite de 3 administradores atingido.");
            }
        }

        Bolsista b = new Bolsista();
        aplicarComuns(b, body);
        aplicarCamposDeBolsista(b, body, logado);
        b.setSenha(passwordEncoder.encode(body.senha()));
        bolsistaService.inserir(b);
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.de(b));
    }

    @Operation(summary = "Atualiza um usuario. Senha em branco mantem a que ja esta gravada.")
    @PutMapping("/{id}")
    public UsuarioResponse atualizar(@PathVariable int id,
                                     @RequestBody BolsistaRequest body,
                                     HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);
        validarObrigatorios(body, false);

        if ("PROFESSOR".equalsIgnoreCase(body.tipoUsuario())) {
            usuarioLogado.exigirAdmin(logado);
            Professor p = professorService.buscarPorId(id);
            if (p == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Professor nao encontrado.");
            }
            aplicarComuns(p, body);
            if (!StringUtil.estaVazio(body.senha())) {
                p.setSenha(passwordEncoder.encode(body.senha()));
            }
            professorService.atualizar(p);
            return UsuarioResponse.de(p);
        }

        Bolsista b = bolsistaService.buscarPorId(id);
        if (b == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado.");
        }
        usuarioLogado.exigir(logado.getId() == id || bolsistaService.podeGerenciar(logado, b),
                "Sem permissao para editar este usuario.");

        String senhaAtual = b.getSenha();
        aplicarComuns(b, body);
        aplicarCamposDeBolsista(b, body, logado);
        /* senha vazia na edicao significa manter a que ja esta gravada */
        b.setSenha(StringUtil.estaVazio(body.senha()) ? senhaAtual : passwordEncoder.encode(body.senha()));
        bolsistaService.atualizar(b);
        return UsuarioResponse.de(b);
    }

    @Operation(summary = "Desativa o usuario (soft delete). A linha e o historico de frequencia permanecem no banco.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id,
                                        @RequestParam(defaultValue = "BOLSISTA") String tipo,
                                        HttpSession session) {
        Usuario logado = usuarioLogado.obrigatorio(session);

        if ("PROFESSOR".equalsIgnoreCase(tipo)) {
            usuarioLogado.exigirAdmin(logado);
            if (professorService.buscarPorId(id) == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Professor nao encontrado.");
            }
            professorService.excluir(id);
            return ResponseEntity.noContent().build();
        }

        Bolsista b = bolsistaService.buscarPorId(id);
        if (b == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado.");
        }
        usuarioLogado.exigir(bolsistaService.podeGerenciar(logado, b), "Sem permissao para excluir este usuario.");
        bolsistaService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    private void validarObrigatorios(BolsistaRequest body, boolean exigirSenha) {
        if (StringUtil.estaVazio(body.nome())) {
            throw new IllegalArgumentException("Nome e obrigatorio.");
        }
        if (StringUtil.estaVazio(body.email())) {
            throw new IllegalArgumentException("E-mail e obrigatorio.");
        }
        if (exigirSenha && (StringUtil.estaVazio(body.senha()) || body.senha().length() < 6)) {
            throw new IllegalArgumentException("Senha e obrigatoria e precisa ter ao menos 6 caracteres.");
        }
        if (!exigirSenha && !StringUtil.estaVazio(body.senha()) && body.senha().length() < 6) {
            throw new IllegalArgumentException("A nova senha precisa ter ao menos 6 caracteres.");
        }
    }

    private void aplicarComuns(Usuario u, BolsistaRequest body) {
        u.setNome(StringUtil.limpar(body.nome()));
        u.setEmail(StringUtil.limpar(body.email()));
        u.setFotoUrl(body.fotoUrl());
        u.setBio(body.bio());
        u.setAtivo(true);
    }

    private void aplicarCamposDeBolsista(Bolsista b, BolsistaRequest body, Usuario logado) {
        b.setDataNascimento(body.dataNascimento());
        b.setCurso(body.curso());
        b.setMatricula(body.matricula());
        b.setCpf(body.cpf());
        b.setTelefone(body.telefone());
        b.setCargo(Cargo.deString(body.cargo()));
        b.setTipoUsuario("ADMIN".equalsIgnoreCase(body.tipoUsuario()) ? "ADMIN" : "BOLSISTA");

        int labId = body.laboratorioId() != null ? body.laboratorioId() : 0;
        if (labId > 0) {
            /* professor so aloca bolsista em lab que ele coordena */
            usuarioLogado.exigir(laboratorioService.podeGerenciar(logado, labId),
                    "Sem permissao para vincular usuario a este laboratorio.");
        }
        b.setLaboratorioId(labId);
    }

    private void preencherLabsDosProfessores(List<Usuario> lista) {
        for (Usuario u : lista) {
            if (u.isProfessor()) {
                List<Laboratorio> labs = laboratorioService.listarPorCoordenador(u.getId());
                u.setNomeLaboratorio(labs.isEmpty()
                        ? "Nenhum"
                        : labs.stream().map(Laboratorio::getNome).reduce((a, b) -> a + ", " + b).orElse("Nenhum"));
            }
        }
    }

    private PaginaResponse<UsuarioResponse> paginar(List<Usuario> lista, int pagina) {
        int total = lista.size();
        int totalPaginas = Math.max(1, (int) Math.ceil(total / (double) TAMANHO_PAGINA));
        int atual = Math.min(Math.max(pagina, 1), totalPaginas);
        int de = (atual - 1) * TAMANHO_PAGINA;
        int ate = Math.min(de + TAMANHO_PAGINA, total);

        List<UsuarioResponse> itens = de < total
                ? lista.subList(de, ate).stream().map(UsuarioResponse::de).toList()
                : List.of();
        return new PaginaResponse<>(itens, atual, totalPaginas, total);
    }
}
