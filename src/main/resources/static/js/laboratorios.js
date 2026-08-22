(async () => {
    const usuario = await Sessao.iniciar();

    if (Sessao.ehAdmin()) {
        document.getElementById("btn-novo").hidden = false;
    }

    /* bolsista ve os projetos no lugar da area de pesquisa */
    document.getElementById("cabecalho").innerHTML = Sessao.ehBolsista()
        ? "<th>Nome</th><th>Coordenador</th><th>Projetos</th><th>Vagas / Ocupação</th><th>Status</th><th>Ações</th>"
        : "<th>Nome</th><th>Área de Pesquisa</th><th>Coordenador</th><th>Vagas / Ocupação</th><th>Status</th><th>Ações</th>";

    await carregar();

    async function carregar() {
        let labs;
        try {
            labs = await Api.get("/laboratorios");
        } catch (e) {
            Util.aviso(e.message);
            return;
        }

        /* so o bolsista precisa da lista de projetos por lab, entao so ele paga a busca */
        if (Sessao.ehBolsista()) {
            await Promise.all(labs.map(async l => {
                l.projetos = await Api.get(`/laboratorios/${l.id}/projetos`);
            }));
        }

        const corpo = document.getElementById("corpo");
        corpo.innerHTML = labs.length
            ? labs.map(linha).join("")
            : `<tr><td colspan="6" class="empty-state">Nenhum laboratório encontrado.</td></tr>`;

        corpo.querySelectorAll("[data-excluir]").forEach(botao => {
            botao.addEventListener("click", async (e) => {
                e.preventDefault();
                if (!confirm("Tem certeza que deseja excluir este laboratório?")) return;
                try {
                    await Api.delete(`/laboratorios/${botao.dataset.excluir}`);
                    Util.aviso("Laboratório excluído com sucesso.", "sucesso");
                    await carregar();
                } catch (erro) {
                    Util.aviso(erro.message);
                }
            });
        });
    }

    function linha(l) {
        const lotado = l.capacidade > 0 && (l.totalBolsistas / l.capacidade) >= 0.85;
        const alerta = lotado
            ? `<span class="badge status-em-pausa" title="Capacidade acima de 85%"
                     style="background-color:#f39c12;color:white;padding:2px 6px;border-radius:4px;font-size:0.75rem;font-weight:bold;margin-left:5px;">
                   <i class="fas fa-exclamation-triangle"></i> Lotação</span>`
            : "";

        const colunasMeio = Sessao.ehBolsista()
            ? `<td>${Util.escapar(l.coordenador)}</td>
               <td>${l.projetos && l.projetos.length
                        ? l.projetos.map(p => `<span class="badge-projeto-tag">${Util.escapar(p.nome)}</span>`).join(" ")
                        : `<span class="empty-text">Nenhum projeto</span>`}</td>`
            : `<td>${Util.escapar(l.areaPesquisa)}</td><td>${Util.escapar(l.coordenador)}</td>`;

        let acoes;
        if (Sessao.ehBolsista()) {
            acoes = l.id === usuario.laboratorioId
                ? `<a href="/laboratorio-detalhes.html?id=${l.id}" class="btn-icon btn-details" title="Detalhes"><i class="fas fa-eye"></i></a>`
                : `<span class="text-muted" title="Sem acesso a detalhes de laboratórios de outras equipes"><i class="fas fa-lock"></i></span>`;
        } else {
            acoes = `<a href="/laboratorio-detalhes.html?id=${l.id}" class="btn-icon btn-details" title="Detalhes"><i class="fas fa-eye"></i></a>`;
            if (Sessao.ehAdmin()) {
                acoes += `<a href="/laboratorio-form.html?id=${l.id}" class="btn-icon btn-edit" title="Editar"><i class="fas fa-edit"></i></a>
                          <a href="#" class="btn-icon btn-delete" title="Excluir" data-excluir="${l.id}"><i class="fas fa-trash"></i></a>`;
            }
        }

        const statusClasse = "status-" + String(l.status || "").toLowerCase().replaceAll(" ", "-");
        return `
            <tr>
                <td><strong>${Util.escapar(l.nome)}</strong></td>
                ${colunasMeio}
                <td><strong>${l.totalBolsistas}</strong> / ${l.capacidade}${alerta}</td>
                <td><span class="badge ${statusClasse}">${Util.escapar(l.status)}</span></td>
                <td class="actions-cell">${acoes}</td>
            </tr>`;
    }
})();
