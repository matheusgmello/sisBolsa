package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Projeto;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.service.ProjetoService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;

/*
 * controller responsavel pelo crud de projetos e gerenciamento de membros.
 * rotas de leitura: /projeto (lista), /projeto/novo, /projeto/editar, /projeto/detalhes.
 * rotas de escrita: /projeto/salvar, /projeto/desativar, /projeto/vincular, /projeto/desvincular.
 * permissoes verificadas via laboratorioService.podeGerenciar antes de qualquer alteracao.
 */
@Controller
@RequestMapping("/projeto")
public class ProjetoController {

    @Autowired
    private ProjetoService projetoService;

    @Autowired
    private LaboratorioService laboratorioService;

    @Autowired
    private BolsistaService bolsistaService;

    @GetMapping
    public String listar(@RequestParam(required = false) String buscaNome,
                         @RequestParam(required = false) String labId,
                         HttpSession session,
                         Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        try {
            model.addAttribute("todosLaboratorios", laboratorioService.listarTodos());

            Integer filterLabId = null;
            if (labId != null && !labId.trim().isEmpty()) {
                try {
                    filterLabId = Integer.parseInt(labId);
                } catch (NumberFormatException e) {
                    // ignore
                }
            }
            ArrayList<Projeto> lista = projetoService.buscarProjetos(buscaNome, filterLabId);

            for (Projeto p : lista) {
                Laboratorio lab = laboratorioService.buscarPorId(p.getLaboratorioId());
                if (lab != null) {
                    model.addAttribute("coordenador_" + p.getId(), lab.getCoordenador());
                }
                ArrayList<Bolsista> membros = bolsistaService.buscarPorProjeto(p.getId());
                model.addAttribute("membros_" + p.getId(), membros);
                
                boolean podeGerenciar = laboratorioService.podeGerenciar(usuarioLogado, p.getLaboratorioId());
                model.addAttribute("podeGerenciar_" + p.getId(), podeGerenciar);
            }

            model.addAttribute("listaProjetos", lista);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return "projetos";
    }

    @GetMapping("/detalhes")
    public String detalhes(@RequestParam String id,
                           HttpSession session,
                           Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        try {
            int projId = Integer.parseInt(id);
            Projeto proj = projetoService.buscarPorId(projId);
            if (proj == null) {
                return "redirect:/projeto";
            }

            Laboratorio lab = laboratorioService.buscarPorId(proj.getLaboratorioId());
            if (lab != null) {
                model.addAttribute("coordenador", lab.getCoordenador());
                model.addAttribute("coordenadorId", lab.getCoordenadorId());
            }

            if (usuarioLogado.isBolsista() && ((Bolsista) usuarioLogado).getLaboratorioId() != proj.getLaboratorioId()) {
                return "redirect:/projeto?erro=Sem permissao para visualizar detalhes deste projeto.";
            }

            ArrayList<Bolsista> membrosProjeto = bolsistaService.buscarPorProjeto(projId);
            ArrayList<Bolsista> bolsistasLab = bolsistaService.buscarPorLaboratorio(proj.getLaboratorioId());

            boolean podeGerenciar = laboratorioService.podeGerenciar(usuarioLogado, proj.getLaboratorioId());

            model.addAttribute("projeto", proj);
            model.addAttribute("laboratorio", lab);
            model.addAttribute("membros", membrosProjeto);
            model.addAttribute("bolsistasLab", bolsistasLab);
            model.addAttribute("podeGerenciar", podeGerenciar);
            return "detalhes-projeto";
        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/projeto";
        }
    }

    @GetMapping("/novo")
    public String formularioNovo(@RequestParam(required = false) String labId,
                                 HttpSession session,
                                 Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/projeto";
        }

        Projeto proj = new Projeto();
        proj.setAtivo(true);
        if (labId != null) {
            try {
                proj.setLaboratorioId(Integer.parseInt(labId));
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        try {
            ArrayList<Laboratorio> labsDisponiveis = new ArrayList<>();
            if (usuarioLogado.isAdmin()) {
                labsDisponiveis = laboratorioService.listarTodos();
            } else if (usuarioLogado.isProfessor()) {
                labsDisponiveis = laboratorioService.listarPorCoordenador(usuarioLogado.getId());
            }
            model.addAttribute("laboratorios", labsDisponiveis);
        } catch (Exception e) {
            e.printStackTrace();
        }

        model.addAttribute("projeto", proj);
        return "cadastro-projeto";
    }

    @GetMapping("/editar")
    public String formularioEditar(@RequestParam String id,
                                   HttpSession session,
                                   Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        if (usuarioLogado.isBolsista()) {
            return "redirect:/projeto";
        }

        try {
            int projId = Integer.parseInt(id);
            Projeto proj = projetoService.buscarPorId(projId);
            if (proj == null) {
                return "redirect:/projeto";
            }
            if (!laboratorioService.podeGerenciar(usuarioLogado, proj.getLaboratorioId())) {
                return "redirect:/projeto";
            }

            ArrayList<Laboratorio> labsDisponiveis = new ArrayList<>();
            if (usuarioLogado.isAdmin()) {
                labsDisponiveis = laboratorioService.listarTodos();
            } else if (usuarioLogado.isProfessor()) {
                labsDisponiveis = laboratorioService.listarPorCoordenador(usuarioLogado.getId());
            }
            model.addAttribute("laboratorios", labsDisponiveis);
            model.addAttribute("projeto", proj);
            return "cadastro-projeto";
        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/projeto";
        }
    }

    @PostMapping("/salvar")
    public String salvar(@RequestParam(required = false) Integer id,
                         @RequestParam String nome,
                         @RequestParam String descricao,
                         @RequestParam int laboratorioId,
                         @RequestParam(required = false) String origem,
                         HttpSession session,
                         Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        try {
            if (!laboratorioService.podeGerenciar(usuarioLogado, laboratorioId)) {
                return "redirect:/laboratorio";
            }

            Projeto p;
            if (id != null && id > 0) {
                p = projetoService.buscarPorId(id);
                if (p == null || p.getLaboratorioId() != laboratorioId) {
                    if ("projeto".equals(origem)) {
                        return "redirect:/projeto";
                    }
                    if ("editar".equals(origem)) {
                        return "redirect:/laboratorio/editar?id=" + laboratorioId;
                    }
                    return "redirect:/laboratorio/detalhes?id=" + laboratorioId;
                }
            } else {
                p = new Projeto();
                p.setLaboratorioId(laboratorioId);
                p.setAtivo(true);
            }
            p.setNome(nome != null ? nome.trim() : "");
            p.setDescricao(descricao != null ? descricao.trim() : "");
            
            if (p.getNome().isEmpty()) {
                if ("projeto".equals(origem)) {
                    return "redirect:/projeto/novo?erro=O nome do projeto nao pode ser vazio";
                }
                if ("editar".equals(origem)) {
                    return "redirect:/laboratorio/editar?id=" + laboratorioId + "&erro=O nome do projeto nao pode ser vazio";
                }
                return "redirect:/laboratorio/detalhes?id=" + laboratorioId;
            }

            if (p.getId() > 0) {
                projetoService.atualizar(p);
            } else {
                projetoService.cadastrar(p);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        if ("projeto".equals(origem)) {
            return "redirect:/projeto?sucesso=Projeto+salvo+com+sucesso";
        }
        if ("editar".equals(origem)) {
            return "redirect:/laboratorio/editar?id=" + laboratorioId + "&sucesso=Projeto+salvo+com+sucesso";
        }
        return "redirect:/laboratorio/detalhes?id=" + laboratorioId + "&sucesso=Projeto+salvo+com+sucesso";
    }

    @GetMapping("/desativar")
    public String desativar(@RequestParam int id,
                            @RequestParam int labId,
                            @RequestParam(required = false) String origem,
                            HttpSession session) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        try {
            if (!laboratorioService.podeGerenciar(usuarioLogado, labId)) {
                return "redirect:/laboratorio?erro=Sem+permissao+para+desativar+projetos";
            }
            projetoService.excluir(id);
            if ("projeto".equals(origem)) {
                return "redirect:/projeto?sucesso=Projeto+desativado+com+sucesso";
            }
            if ("editar".equals(origem)) {
                return "redirect:/laboratorio/editar?id=" + labId + "&sucesso=Projeto+desativado+com+sucesso";
            }
            return "redirect:/laboratorio/detalhes?id=" + labId + "&sucesso=Projeto+desativado+com+sucesso";
        } catch (Exception e) {
            e.printStackTrace();
            if ("projeto".equals(origem)) {
                return "redirect:/projeto?erro=Erro+ao+desativar+projeto";
            }
            if ("editar".equals(origem)) {
                return "redirect:/laboratorio/editar?id=" + labId + "&erro=Erro+ao+desativar+projeto";
            }
            return "redirect:/laboratorio/detalhes?id=" + labId + "&erro=Erro+ao+desativar+projeto";
        }
    }

    @PostMapping("/vincular")
    public String vincularBolsista(@RequestParam int bolsistaId,
                                   @RequestParam int projetoId,
                                   @RequestParam int labId,
                                   @RequestParam(required = false) String origem,
                                   HttpSession session) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        try {
            if (!laboratorioService.podeGerenciar(usuarioLogado, labId)) {
                return "redirect:/laboratorio?erro=Sem+permissao+para+gerenciar+este+laboratorio";
            }
            projetoService.vincularBolsista(bolsistaId, projetoId);
            String successMsg = "Bolsista+vinculado+com+sucesso";
            if ("detalhes-projeto".equals(origem)) {
                return "redirect:/projeto/detalhes?id=" + projetoId + "&sucesso=" + successMsg;
            }
            return "redirect:/laboratorio/detalhes?id=" + labId + "&sucesso=" + successMsg;
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = "Erro+ao+vincular+bolsista";
            if ("detalhes-projeto".equals(origem)) {
                return "redirect:/projeto/detalhes?id=" + projetoId + "&erro=" + errorMsg;
            }
            return "redirect:/laboratorio/detalhes?id=" + labId + "&erro=" + errorMsg;
        }
    }

    @GetMapping("/desvincular")
    public String desvincularBolsista(@RequestParam int bolsistaId,
                                      @RequestParam int projetoId,
                                      @RequestParam int labId,
                                      @RequestParam(required = false) String origem,
                                      HttpSession session) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        try {
            if (!laboratorioService.podeGerenciar(usuarioLogado, labId)) {
                return "redirect:/laboratorio?erro=Sem+permissao+para+gerenciar+este+laboratorio";
            }
            projetoService.desvincularBolsista(bolsistaId, projetoId);
            String successMsg = "Bolsista+desvinculado+com+sucesso";
            if ("detalhes-projeto".equals(origem)) {
                return "redirect:/projeto/detalhes?id=" + projetoId + "&sucesso=" + successMsg;
            }
            return "redirect:/laboratorio/detalhes?id=" + labId + "&sucesso=" + successMsg;
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = "Erro+ao+desvincular+bolsista";
            if ("detalhes-projeto".equals(origem)) {
                return "redirect:/projeto/detalhes?id=" + projetoId + "&erro=" + errorMsg;
            }
            return "redirect:/laboratorio/detalhes?id=" + labId + "&erro=" + errorMsg;
        }
    }
}
