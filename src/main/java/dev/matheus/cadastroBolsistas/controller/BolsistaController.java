package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Cargo;
import dev.matheus.cadastroBolsistas.model.Professor;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.ProfessorService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.ArrayList;

/*
 * responsavel pelo crud de bolsistas e professores.
 * mapeado em rotas limpas do Spring MVC (/bolsista, /bolsista/novo, /bolsista/editar, /bolsista/excluir, /bolsista/exportar).
 * bolsista comum so visualiza membros do proprio lab/squad, e edita apenas a si mesmo.
 * professor visualiza e gerencia os bolsistas do seu laboratorio.
 */
@Controller
@RequestMapping("/bolsista")
public class BolsistaController {

    @Autowired
    private BolsistaService bolsistaService;

    @Autowired
    private LaboratorioService laboratorioService;

    @Autowired
    private ProfessorService professorService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public String listar(@RequestParam(value = "pagina", defaultValue = "1") Integer pagina,
                         @RequestParam(required = false) String tipo,
                         @RequestParam(required = false) String buscaNome,
                         @RequestParam(required = false) String buscaCurso,
                         HttpSession session,
                         Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/dashboard";
        }

        try {
            int paginaAtual = (pagina != null) ? pagina : 1;
            ArrayList<Usuario> lista = new ArrayList<>();
            if (buscaNome != null && !buscaNome.isEmpty()) {
                lista.addAll(bolsistaService.buscarPorNome(buscaNome));
                if (usuarioLogado.isAdmin()) {
                    lista.addAll(professorService.buscarPorNome(buscaNome));
                }
            } else if (buscaCurso != null && !buscaCurso.isEmpty()) {
                lista.addAll(bolsistaService.buscarPorCurso(buscaCurso));
            } else {
                lista.addAll(bolsistaService.listarTodos());
                if (usuarioLogado.isAdmin()) {
                    lista.addAll(professorService.listarTodos());
                }
            }

            if (tipo != null && !tipo.trim().isEmpty()) {
                String tipoFiltro = tipo.trim().toUpperCase();
                ArrayList<Usuario> listaFiltrada = new ArrayList<>();
                for (Usuario u : lista) {
                    if (tipoFiltro.equals(u.getTipoUsuario())) {
                        listaFiltrada.add(u);
                    }
                }
                lista = listaFiltrada;
            }

            // Popular o nomeLaboratorio para os professores com a lista de laboratórios coordenados por eles
            for (Usuario u : lista) {
                if (u.isProfessor()) {
                    ArrayList<Laboratorio> labs = laboratorioService.listarPorCoordenador(u.getId());
                    if (labs != null && !labs.isEmpty()) {
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < labs.size(); i++) {
                            sb.append(labs.get(i).getNome());
                            if (i < labs.size() - 1) {
                                  sb.append(", ");
                            }
                        }
                        u.setNomeLaboratorio(sb.toString());
                    } else {
                        u.setNomeLaboratorio("Nenhum");
                    }
                }
            }

            lista = bolsistaService.filtrarPorEscopo(lista, usuarioLogado);


            int tamanho = 10;
            int totalRegistros = lista.size();
            int totalPaginas = (int) Math.ceil(totalRegistros / (double) tamanho);
            if (paginaAtual < 1) paginaAtual = 1;
            if (paginaAtual > totalPaginas && totalPaginas > 0) paginaAtual = totalPaginas;

            int de = (paginaAtual - 1) * tamanho;
            int ate = Math.min(de + tamanho, totalRegistros);

            ArrayList<Usuario> sublista = new ArrayList<>();
            if (de < totalRegistros) {
                sublista.addAll(lista.subList(de, ate));
            }

            model.addAttribute("listabolsistas", sublista);
            model.addAttribute("paginaAtual", paginaAtual);
            model.addAttribute("totalPaginas", totalPaginas > 0 ? totalPaginas : 1);
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Erro ao listar usuários: " + e.getMessage());
        }

        return "bolsistas";
    }

    @GetMapping("/exportar")
    public String exportar(HttpSession session, HttpServletResponse response) throws IOException {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/dashboard";
        }
        exportarParaCSV(response, usuarioLogado);
        return null;
    }

    @GetMapping("/novo")
    public String formularioNovo(HttpSession session, Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/dashboard";
        }
        carregarLaboratoriosDisponiveis(model, usuarioLogado);
        return "cadastro-bolsista";
    }

    @GetMapping("/editar")
    public String formularioEditar(@RequestParam String id,
                                   @RequestParam String tipo,
                                   HttpSession session,
                                   Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/dashboard";
        }
        try {
            int userId = Integer.parseInt(id);
            Usuario u;
            if ("PROFESSOR".equals(tipo)) {
                u = professorService.buscarPorId(userId);
            } else {
                u = bolsistaService.buscarPorId(userId);
            }

            if (u == null) {
                return "redirect:/bolsista";
            }

            if ("PROFESSOR".equals(tipo)) {
                if (!usuarioLogado.isAdmin()) {
                    return "redirect:/bolsista";
                }
            } else {
                Bolsista b = (Bolsista) u;
                if (!bolsistaService.podeGerenciar(usuarioLogado, b) && b.getId() != usuarioLogado.getId()) {
                    return "redirect:/bolsista";
                }
            }
            model.addAttribute("bolsista", u);
            carregarLaboratoriosDisponiveis(model, usuarioLogado);
            return "cadastro-bolsista";
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Usuário inválido para edição.");
        }
        return "redirect:/bolsista";
    }

    @GetMapping("/excluir")
    public String excluir(@RequestParam String id,
                          @RequestParam String tipo,
                          HttpSession session,
                          Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/dashboard";
        }
        try {
            int userId = Integer.parseInt(id);
            if ("PROFESSOR".equals(tipo)) {
                if (usuarioLogado.isAdmin()) {
                    professorService.excluir(userId);
                    return "redirect:/bolsista?sucesso=Professor+excluido+com+sucesso";
                } else {
                    return "redirect:/bolsista?erro=Sem+permissao+para+excluir";
                }
            } else {
                Bolsista b = bolsistaService.buscarPorId(userId);
                if (b != null && (usuarioLogado.isAdmin() || (usuarioLogado.isProfessor() && bolsistaService.podeGerenciar(usuarioLogado, b)))) {
                    bolsistaService.excluir(userId);
                    return "redirect:/bolsista?sucesso=Bolsista+excluido+com+sucesso";
                } else {
                    return "redirect:/bolsista?erro=Sem+permissao+para+excluir";
                }
            }
        } catch (NumberFormatException e) {
            return "redirect:/bolsista?erro=ID+do+usuario+invalido";
        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/bolsista?erro=Erro+ao+excluir+usuario";
        }
    }

    @PostMapping
    public String salvar(@RequestParam(required = false) String id,
                         @RequestParam(required = false) String nome,
                         @RequestParam(required = false) String dataNascimento,
                         @RequestParam(required = false) String curso,
                         @RequestParam(required = false) String email,
                         @RequestParam(required = false) String matricula,
                         @RequestParam(required = false) String cpf,
                         @RequestParam(required = false) String telefone,
                         @RequestParam(required = false) String senha,
                         @RequestParam(required = false) String laboratorioId,
                         @RequestParam(required = false) String tipoUsuario,
                         @RequestParam(required = false) String fotoUrl,
                         @RequestParam(required = false) String cargo,
                         @RequestParam(required = false) String bio,
                         HttpSession session,
                         Model model) {

        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/dashboard";
        }

        int userId = 0;
        if (!StringUtil.estaVazio(id)) {
            try {
                userId = Integer.parseInt(id);
            } catch (NumberFormatException e) {
                model.addAttribute("erro", "ID inválido.");
                carregarLaboratoriosDisponiveis(model, usuarioLogado);
                return "cadastro-bolsista";
            }
        }

        // Se for professor, as permissões e fluxo são diferentes
        if ("PROFESSOR".equals(tipoUsuario)) {
            if (!usuarioLogado.isAdmin()) {
                return "redirect:/bolsista";
            }

            Professor p = new Professor();
            p.setId(userId);
            p.setNome(StringUtil.limpar(nome));
            p.setEmail(StringUtil.limpar(email));
            p.setSenha(StringUtil.limpar(senha));
            p.setAtivo(true);
            p.setFotoUrl(StringUtil.limpar(fotoUrl));
            p.setBio(StringUtil.limpar(bio));

            String erroValidacao = validarProfessor(p, usuarioLogado);
            if (erroValidacao != null) {
                model.addAttribute("erro", erroValidacao);
                model.addAttribute("bolsista", p);
                carregarLaboratoriosDisponiveis(model, usuarioLogado);
                return "cadastro-bolsista";
            }

            try {
                if (p.getId() > 0 && StringUtil.estaVazio(p.getSenha())) {
                    Professor profExistente = professorService.buscarPorId(p.getId());
                    if (profExistente != null) {
                        p.setSenha(profExistente.getSenha());
                    }
                } else {
                    p.setSenha(passwordEncoder.encode(p.getSenha()));
                }

                boolean sucesso = p.getId() > 0 ? professorService.atualizar(p) : professorService.inserir(p);
                if (sucesso) {
                    return "redirect:/bolsista";
                } else {
                    model.addAttribute("erro", "Problemas ao salvar o professor.");
                    model.addAttribute("bolsista", p);
                    carregarLaboratoriosDisponiveis(model, usuarioLogado);
                    return "cadastro-bolsista";
                }
            } catch (Exception e) {
                e.printStackTrace();
                model.addAttribute("erro", "Algo aconteceu: " + e.getMessage());
                model.addAttribute("bolsista", p);
                carregarLaboratoriosDisponiveis(model, usuarioLogado);
                return "cadastro-bolsista";
            }
        }

        if (!usuarioLogado.isAdmin() && !usuarioLogado.isProfessor() && (userId == 0 || userId != usuarioLogado.getId())) {
            return "redirect:/bolsista";
        }

        Bolsista b = new Bolsista();
        b.setId(userId);
        b.setNome(StringUtil.limpar(nome));
        b.setCurso(StringUtil.limpar(curso));
        b.setEmail(StringUtil.limpar(email));
        b.setMatricula(StringUtil.limpar(matricula));
        b.setCpf(StringUtil.limpar(cpf));
        b.setTelefone(StringUtil.limpar(telefone));
        b.setSenha(StringUtil.limpar(senha));
        b.setAtivo(true);
        b.setTipoUsuario(!StringUtil.estaVazio(tipoUsuario) ? tipoUsuario : "BOLSISTA");
        b.setFotoUrl(StringUtil.limpar(fotoUrl));
        b.setCargo(Cargo.deString(StringUtil.limpar(cargo)));
        b.setBio(StringUtil.limpar(bio));

        String erroValidacao = validarBolsista(b, dataNascimento, laboratorioId, usuarioLogado);
        if (erroValidacao != null) {
            model.addAttribute("erro", erroValidacao);
            model.addAttribute("bolsista", b);
            carregarLaboratoriosDisponiveis(model, usuarioLogado);
            return "cadastro-bolsista";
        }

        b.setDataNascimento(LocalDate.parse(dataNascimento));

        if (!StringUtil.estaVazio(laboratorioId)) {
            int labId = Integer.parseInt(laboratorioId);
            
            try {
                if (usuarioLogado.isProfessor() && !laboratorioService.podeGerenciar(usuarioLogado, labId)) {
                    model.addAttribute("erro", "Sem permissao para vincular bolsista a este laboratorio.");
                    model.addAttribute("bolsista", b);
                    carregarLaboratoriosDisponiveis(model, usuarioLogado);
                    return "cadastro-bolsista";
                }
                
                if (b.getId() == 0 && !laboratorioService.temVaga(labId)) {
                    model.addAttribute("erro", "Laboratorio atingiu a capacidade maxima!");
                    model.addAttribute("bolsista", b);
                    carregarLaboratoriosDisponiveis(model, usuarioLogado);
                    return "cadastro-bolsista";
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            b.setLaboratorioId(labId);
        } else {
            b.setLaboratorioId(0);
            b.setCargo(null);
        }

        try {
            if (b.getId() > 0 && StringUtil.estaVazio(b.getSenha())) {
                Bolsista bolsExistente = bolsistaService.buscarPorId(b.getId());
                if (bolsExistente != null) {
                    b.setSenha(bolsExistente.getSenha());
                }
            } else {
                b.setSenha(passwordEncoder.encode(b.getSenha()));
            }

            boolean sucesso = b.getId() > 0 ? bolsistaService.atualizar(b) : bolsistaService.inserir(b);
            if (sucesso) {
                String msg = b.getId() > 0 ? "Usuario+atualizado+com+sucesso" : "Usuario+salvo+com+sucesso";
                return "redirect:/bolsista?sucesso=" + msg;
            } else {
                model.addAttribute("erro", "Problemas ao salvar o bolsista.");
                model.addAttribute("bolsista", b);
                carregarLaboratoriosDisponiveis(model, usuarioLogado);
                return "cadastro-bolsista";
            }
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Algo aconteceu: " + e.getMessage());
            model.addAttribute("bolsista", b);
            carregarLaboratoriosDisponiveis(model, usuarioLogado);
            return "cadastro-bolsista";
        }
    }

    private void exportarParaCSV(HttpServletResponse response, Usuario usuarioLogado) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=usuarios.csv");
        try (PrintWriter writer = response.getWriter()) {
            writer.println("ID,Nome,Email,Curso,Laboratorio,Status,Cargo,Tipo");
            ArrayList<Usuario> lista = new ArrayList<>();
            lista.addAll(bolsistaService.listarTodos());
            if (usuarioLogado.isAdmin()) {
                lista.addAll(professorService.listarTodos());
            }

            for (Usuario u : lista) {
                if (u.isProfessor()) {
                    ArrayList<Laboratorio> labs = laboratorioService.listarPorCoordenador(u.getId());
                    if (labs != null && !labs.isEmpty()) {
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < labs.size(); i++) {
                            sb.append(labs.get(i).getNome());
                            if (i < labs.size() - 1) {
                                sb.append(", ");
                            }
                        }
                        u.setNomeLaboratorio(sb.toString());
                    } else {
                        u.setNomeLaboratorio("Nenhum");
                    }
                }
            }

            lista = bolsistaService.filtrarPorEscopo(lista, usuarioLogado);
            for (Usuario u : lista) {
                String curso = u instanceof Bolsista ? ((Bolsista) u).getCurso() : "";
                Cargo cargoObj = u instanceof Bolsista ? ((Bolsista) u).getCargo() : null;
                String cargoStr = cargoObj != null ? cargoObj.getDescricao() : "";
                writer.println(u.getId() + "," + u.getNome() + "," + u.getEmail() + "," +
                        curso + "," + u.getNomeLaboratorio() + "," + (u.isAtivo() ? "Ativo" : "Inativo") + "," +
                        cargoStr + "," + u.getTipoUsuario());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void carregarLaboratoriosDisponiveis(Model model, Usuario usuarioLogado) {
        try {
            if (usuarioLogado.isAdmin()) {
                model.addAttribute("laboratorios", laboratorioService.listarTodos());
            } else if (usuarioLogado.isProfessor()) {
                model.addAttribute("laboratorios", laboratorioService.listarPorCoordenador(usuarioLogado.getId()));
            }
            model.addAttribute("cargos", Cargo.values());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    private String validarBolsista(Bolsista b, String dataNascimentoStr, String laboratorioIdStr, Usuario usuarioLogado) {
        if (StringUtil.estaVazio(b.getNome()) || b.getNome().length() < 3) {
            return "O nome do bolsista deve ter pelo menos 3 caracteres.";
        }
        if (StringUtil.estaVazio(dataNascimentoStr)) {
            return "A data de nascimento e obrigatoria.";
        }
        try {
            LocalDate dataNascimento = LocalDate.parse(dataNascimentoStr);
            if (dataNascimento.isAfter(LocalDate.now())) {
                return "A data de nascimento nao pode ser futura.";
            }
        } catch (Exception e) {
            return "A data de nascimento e invalida.";
        }
        if (StringUtil.estaVazio(b.getCurso())) {
            return "O curso e obrigatorio.";
        }
        if (StringUtil.estaVazio(b.getEmail()) || !b.getEmail().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return "Informe um e-mail valido.";
        }
        if (StringUtil.estaVazio(b.getMatricula())) {
            return "A matricula e obrigatoria.";
        }
        if (b.getId() == 0) {
            if (StringUtil.estaVazio(b.getSenha()) || b.getSenha().length() < 6) {
                return "A senha deve ter pelo menos 6 caracteres.";
            }
        } else {
            if (!StringUtil.estaVazio(b.getSenha()) && b.getSenha().length() < 6) {
                return "A senha deve ter pelo menos 6 caracteres.";
            }
        }
        if (!"ADMIN".equals(b.getTipoUsuario()) && !"BOLSISTA".equals(b.getTipoUsuario())) {
            return "Tipo de usuario invalido.";
        }
        if (!usuarioLogado.isAdmin() && "ADMIN".equals(b.getTipoUsuario())) {
            return "Apenas administradores podem definir outro administrador.";
        }
        if (!StringUtil.estaVazio(laboratorioIdStr)) {
            try {
                if (Integer.parseInt(laboratorioIdStr) <= 0) {
                    return "Laboratorio invalido.";
                }
            } catch (NumberFormatException e) {
                return "Laboratorio invalido.";
            }
        }
        return null;
    }

    private String validarProfessor(Professor p, Usuario usuarioLogado) {
        if (StringUtil.estaVazio(p.getNome()) || p.getNome().length() < 3) {
            return "O nome do professor deve ter pelo menos 3 caracteres.";
        }
        if (StringUtil.estaVazio(p.getEmail()) || !p.getEmail().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return "Informe um e-mail válido.";
        }
        if (p.getId() == 0) {
            if (StringUtil.estaVazio(p.getSenha()) || p.getSenha().length() < 6) {
                return "A senha deve ter pelo menos 6 caracteres.";
            }
        } else {
            if (!StringUtil.estaVazio(p.getSenha()) && p.getSenha().length() < 6) {
                return "A senha deve ter pelo menos 6 caracteres.";
            }
        }
        if (!usuarioLogado.isAdmin()) {
            return "Apenas administradores podem definir outro professor.";
        }
        return null;
    }
}
