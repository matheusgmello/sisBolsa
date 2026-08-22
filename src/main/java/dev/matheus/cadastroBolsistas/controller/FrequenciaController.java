package dev.matheus.cadastroBolsistas.controller;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import dev.matheus.cadastroBolsistas.model.Frequencia;
import dev.matheus.cadastroBolsistas.model.Laboratorio;
import dev.matheus.cadastroBolsistas.model.Usuario;
import dev.matheus.cadastroBolsistas.service.BolsistaService;
import dev.matheus.cadastroBolsistas.service.FrequenciaService;
import dev.matheus.cadastroBolsistas.service.LaboratorioService;
import dev.matheus.cadastroBolsistas.util.StringUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletResponse;
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
 * responsavel pelo crud de frequencia.
 * mapeado em rotas limpas do Spring MVC (/frequencia, /frequencia/editar, /frequencia/excluir).
 * admin pode registrar para qualquer bolsista, editar e excluir qualquer registro.
 * professor pode registrar e verificar a frequencia dos bolsistas do seu laboratorio.
 * bolsista comum so pode registrar e editar os proprios.
 */
@Controller
@RequestMapping("/frequencia")
public class FrequenciaController {

    @Autowired
    private FrequenciaService frequenciaService;

    @Autowired
    private BolsistaService bolsistaService;

    @Autowired
    private LaboratorioService laboratorioService;

    @GetMapping
    public String listar(@RequestParam(defaultValue = "1") int pagina,
                         @RequestParam(required = false) Integer bolsistaId,
                         HttpSession session,
                         Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        carregarPagina(model, usuarioLogado, pagina, bolsistaId);
        return "frequencia";
    }

    @GetMapping("/editar")
    public String formularioEditar(@RequestParam String id,
                                   @RequestParam(defaultValue = "1") int pagina,
                                   @RequestParam(required = false) Integer bolsistaId,
                                   HttpSession session,
                                   Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        try {
            int freqId = Integer.parseInt(id);
            Frequencia f = frequenciaService.buscarPorId(freqId);
            if (f == null) {
                model.addAttribute("erro", "Registro de frequencia nao encontrado.");
            } else if (!podeGerenciarFrequencia(usuarioLogado, f)) {
                return "redirect:/frequencia";
            } else {
                model.addAttribute("frequenciaEdicao", f);
            }
        } catch (NumberFormatException e) {
            model.addAttribute("erro", "ID da frequencia invalido.");
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Erro ao buscar frequencia.");
        }
        carregarPagina(model, usuarioLogado, pagina, bolsistaId);
        return "frequencia";
    }

    @GetMapping("/excluir")
    public String excluir(@RequestParam String id,
                          HttpSession session,
                          Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }
        try {
            int freqId = Integer.parseInt(id);
            Frequencia f = frequenciaService.buscarPorId(freqId);
            if (f != null && podeGerenciarFrequencia(usuarioLogado, f)) {
                frequenciaService.excluir(freqId);
                return "redirect:/frequencia?sucesso=Registro+de+frequencia+excluido+com+sucesso";
            } else {
                return "redirect:/frequencia?erro=Sem+permissao+para+excluir+frequencia";
            }
        } catch (NumberFormatException e) {
            return "redirect:/frequencia?erro=ID+da+frequencia+invalido";
        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/frequencia?erro=Erro+ao+excluir+frequencia";
        }
    }

    @PostMapping
    public String salvar(@RequestParam(required = false) String id,
                         @RequestParam(required = false) String data,
                         @RequestParam(required = false) String horas,
                         @RequestParam(required = false) String descricao,
                         @RequestParam(required = false) String bolsistaId,
                         HttpSession session,
                         Model model) {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            return "redirect:/login";
        }

        String erroValidacao = validarFrequencia(data, horas, StringUtil.limpar(descricao));
        if (erroValidacao != null) {
            model.addAttribute("erro", erroValidacao);
            carregarPagina(model, usuarioLogado, 1, null);
            return "frequencia";
        }

        int freqId = 0;
        if (!StringUtil.estaVazio(id)) {
            try {
                freqId = Integer.parseInt(id);
            } catch (NumberFormatException e) {
                model.addAttribute("erro", "ID da frequencia invalido.");
                carregarPagina(model, usuarioLogado, 1, null);
                return "frequencia";
            }
        }

        // fluxo de atualizacao de registro existente
        if (freqId > 0) {
            try {
                Frequencia existente = frequenciaService.buscarPorId(freqId);
                if (existente == null) {
                    model.addAttribute("erro", "Registro de frequencia nao encontrado.");
                    carregarPagina(model, usuarioLogado, 1, null);
                    return "frequencia";
                }
                if (!podeGerenciarFrequencia(usuarioLogado, existente)) {
                    return "redirect:/frequencia?erro=Sem+permissao+para+editar+esta+frequencia";
                }
                existente.setData(LocalDate.parse(data));
                existente.setHorasTrabalhadas(Double.parseDouble(horas));
                existente.setDescricao(StringUtil.limpar(descricao));

                if (frequenciaService.atualizar(existente)) {
                    return "redirect:/frequencia?sucesso=Frequencia+atualizada+com+sucesso";
                } else {
                    model.addAttribute("erro", "Erro ao atualizar frequencia.");
                    carregarPagina(model, usuarioLogado, 1, null);
                    return "frequencia";
                }
            } catch (Exception e) {
                e.printStackTrace();
                model.addAttribute("erro", "Erro ao atualizar frequencia.");
                carregarPagina(model, usuarioLogado, 1, null);
                return "frequencia";
            }
        }

        // fluxo de novo registro
        int idBolsista;
        if (usuarioLogado.isAdmin() || usuarioLogado.isProfessor()) {
            if (StringUtil.estaVazio(bolsistaId)) {
                model.addAttribute("erro", "Selecione o bolsista para registrar a frequencia.");
                carregarPagina(model, usuarioLogado, 1, null);
                return "frequencia";
            }
            try {
                idBolsista = Integer.parseInt(bolsistaId);
                Bolsista b = bolsistaService.buscarPorId(idBolsista);
                if (usuarioLogado.isProfessor() && !bolsistaService.podeGerenciar(usuarioLogado, b)) {
                    model.addAttribute("erro", "Sem permissao para registrar frequencia para este bolsista.");
                    carregarPagina(model, usuarioLogado, 1, null);
                    return "frequencia";
                }
            } catch (Exception e) {
                model.addAttribute("erro", "Bolsista invalido.");
                carregarPagina(model, usuarioLogado, 1, null);
                return "frequencia";
            }
        } else {
            // bolsista comum sempre registra para si mesmo
            idBolsista = usuarioLogado.getId();
        }

        Frequencia f = new Frequencia();
        f.setBolsistaId(idBolsista);
        f.setData(LocalDate.parse(data));
        f.setHorasTrabalhadas(Double.parseDouble(horas));
        f.setDescricao(StringUtil.limpar(descricao));

        try {
            if (frequenciaService.registrar(f)) {
                return "redirect:/frequencia?sucesso=Frequencia+registrada+com+sucesso";
            } else {
                model.addAttribute("erro", "Erro ao registrar frequencia.");
                carregarPagina(model, usuarioLogado, 1, null);
                return "frequencia";
            }
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("erro", "Erro ao registrar frequencia.");
            carregarPagina(model, usuarioLogado, 1, null);
            return "frequencia";
        }
    }

    @GetMapping("/exportar")
    public void exportar(@RequestParam(required = false) Integer bolsistaId,
                         HttpSession session,
                         HttpServletResponse response) throws IOException {
        Usuario usuarioLogado = (Usuario) session.getAttribute("usuario");
        if (usuarioLogado == null) {
            response.sendRedirect(session.getServletContext().getContextPath() + "/login");
            return;
        }

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=frequencias.csv");
        try (PrintWriter writer = response.getWriter()) {
            writer.println("ID,Bolsista,Data,Horas Trabalhadas,Descricao");
            ArrayList<Frequencia> lista = new ArrayList<>();
            if (usuarioLogado.isAdmin()) {
                lista.addAll(frequenciaService.buscarFrequencias(bolsistaId, null, null));
            } else if (usuarioLogado.isProfessor()) {
                ArrayList<Laboratorio> labsCoordenados = laboratorioService.listarPorCoordenador(usuarioLogado.getId());
                ArrayList<Bolsista> listaBolsistas = new ArrayList<>();
                for (Laboratorio l : labsCoordenados) {
                    listaBolsistas.addAll(bolsistaService.buscarPorLaboratorio(l.getId()));
                }
                if (bolsistaId != null && bolsistaId > 0) {
                    boolean coordena = false;
                    for (Bolsista b : listaBolsistas) {
                        if (b.getId() == bolsistaId) {
                            coordena = true;
                            break;
                        }
                    }
                    if (coordena) {
                        lista.addAll(frequenciaService.listarPorBolsista(bolsistaId));
                    }
                } else {
                    for (Laboratorio l : labsCoordenados) {
                        lista.addAll(frequenciaService.listarPorLaboratorio(l.getId()));
                    }
                }
            } else {
                lista.addAll(frequenciaService.listarPorBolsista(usuarioLogado.getId()));
            }

            for (Frequencia f : lista) {
                String desc = f.getDescricao() != null ? f.getDescricao().replace("\"", "\"\"") : "";
                writer.println(f.getId() + "," + f.getNomeBolsista() + "," + f.getData() + "," +
                        f.getHorasTrabalhadas() + ",\"" + desc + "\"");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void carregarPagina(Model model, Usuario usuarioLogado, int pagina, Integer bolsistaId) {
        try {
            int tamanho = 10;
            int offset = (pagina - 1) * tamanho;
            if (usuarioLogado.isAdmin()) {
                int totalRegistros = frequenciaService.contarFrequencias(bolsistaId);
                int totalPaginas = (int) Math.ceil(totalRegistros / (double) tamanho);

                model.addAttribute("listaFrequencia", frequenciaService.buscarFrequencias(bolsistaId, tamanho, offset));
                model.addAttribute("listaBolsistas", bolsistaService.listarTodos());
                model.addAttribute("paginaAtual", pagina);
                model.addAttribute("totalPaginas", totalPaginas > 0 ? totalPaginas : 1);
                model.addAttribute("filtroBolsistaId", bolsistaId);
            } else if (usuarioLogado.isProfessor()) {
                ArrayList<Laboratorio> labsCoordenados = laboratorioService.listarPorCoordenador(usuarioLogado.getId());
                ArrayList<Frequencia> listaFreq = new ArrayList<>();
                ArrayList<Bolsista> listaBolsistas = new ArrayList<>();
                for (Laboratorio l : labsCoordenados) {
                    listaBolsistas.addAll(bolsistaService.buscarPorLaboratorio(l.getId()));
                }
                
                if (bolsistaId != null && bolsistaId > 0) {
                    boolean coordena = false;
                    for (Bolsista b : listaBolsistas) {
                        if (b.getId() == bolsistaId) {
                            coordena = true;
                            break;
                        }
                    }
                    if (coordena) {
                        listaFreq.addAll(frequenciaService.listarPorBolsista(bolsistaId));
                    }
                } else {
                    for (Laboratorio l : labsCoordenados) {
                        listaFreq.addAll(frequenciaService.listarPorLaboratorio(l.getId()));
                    }
                }
                model.addAttribute("listaFrequencia", listaFreq);
                model.addAttribute("listaBolsistas", listaBolsistas);
                model.addAttribute("filtroBolsistaId", bolsistaId);
            } else {
                ArrayList<Frequencia> listaFreq = frequenciaService.listarPorBolsista(usuarioLogado.getId());
                model.addAttribute("listaFrequencia", listaFreq);

                double totalHorasAcumulado = 0.0;
                double totalHorasMesCorrente = 0.0;
                LocalDate hoje = LocalDate.now();

                for (Frequencia f : listaFreq) {
                    totalHorasAcumulado += f.getHorasTrabalhadas();
                    if (f.getData() != null 
                        && f.getData().getMonth() == hoje.getMonth() 
                        && f.getData().getYear() == hoje.getYear()) {
                        totalHorasMesCorrente += f.getHorasTrabalhadas();
                    }
                }

                model.addAttribute("totalHorasAcumulado", totalHorasAcumulado);
                model.addAttribute("totalHorasMesCorrente", totalHorasMesCorrente);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private boolean podeGerenciarFrequencia(Usuario usuarioLogado, Frequencia f) {
        if (usuarioLogado == null || f == null) return false;
        if (usuarioLogado.isAdmin()) return true;
        if (usuarioLogado.isBolsista() && f.getBolsistaId() == usuarioLogado.getId()) return true;
        if (usuarioLogado.isProfessor()) {
            try {
                Bolsista b = bolsistaService.buscarPorId(f.getBolsistaId());
                return bolsistaService.podeGerenciar(usuarioLogado, b);
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }

    private String validarFrequencia(String dataStr, String horasStr, String descricao) {
        if (StringUtil.estaVazio(dataStr)) {
            return "A data da frequencia e obrigatoria.";
        }
        try {
            LocalDate d = LocalDate.parse(dataStr);
            if (d.isAfter(LocalDate.now())) {
                return "A data da frequencia nao pode ser futura.";
            }
        } catch (Exception e) {
            return "A data da frequencia e invalida.";
        }
        if (StringUtil.estaVazio(horasStr)) {
            return "A quantidade de horas e obrigatoria.";
        }
        try {
            double horas = Double.parseDouble(horasStr);
            if (horas <= 0) {
                return "A quantidade de horas deve ser maior que zero.";
            }
            if (horas > 24) {
                return "A quantidade de horas nao pode ser maior que 24.";
            }
        } catch (NumberFormatException e) {
            return "A quantidade de horas deve ser um numero valido.";
        }
        if (descricao != null && descricao.length() > 500) {
            return "A descricao deve ter no maximo 500 caracteres.";
        }
        return null;
    }
}
