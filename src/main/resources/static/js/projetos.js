(async () => {
    const usuario = await Sessao.iniciar();

    if (Sessao.gerencia()) {
        document.getElementById("btn-novo").hidden = false;
    }

    const buscaNome = Util.parametro("buscaNome") || "";
    const labId = Util.parametro("labId") || "";
    document.getElementById("busca-nome").value = buscaNome;
    if (buscaNome || labId) {
        document.getElementById("limpar").hidden = false;
    }

    const labs = await Api.get("/laboratorios");
    const select = document.getElementById("filtro-lab");
    select.innerHTML = `<option value="">Todos os Laboratórios</option>` +
        labs.map(l => `<option value="${l.id}">${Util.escapar(l.nome)}</option>`).join("");
    select.value = labId;

    /* labs que o usuario coordena: define quem pode editar cada projeto */
    const labsGerenciados = new Set(
        Sessao.ehAdmin() ? labs.map(l => l.id)
        : Sessao.ehProfessor() ? labs.filter(l => l.coordenadorId === usuario.id).map(l => l.id)
        : []
    );
    const coordenadorPorLab = new Map(labs.map(l => [l.id, l.coordenador]));

    document.getElementById("form-busca").addEventListener("submit", (e) => {
        e.preventDefault();
        navegar(document.getElementById("busca-nome").value, labId);
    });
    select.addEventListener("change", () => navegar(buscaNome, select.value));

    function navegar(nome, lab) {
        const q = new URLSearchParams();
        if (nome) q.set("buscaNome", nome);
        if (lab) q.set("labId", lab);
        window.location.href = `/projetos.html${q.toString() ? "?" + q : ""}`;
    }

    await carregar();

    async function carregar() {
        const q = new URLSearchParams();
        if (buscaNome) q.set("buscaNome", buscaNome);
        if (labId) q.set("labId", labId);

        let projetos;
        try {
            projetos = await Api.get(`/projetos${q.toString() ? "?" + q : ""}`);
        } catch (e) {
            Util.aviso(e.message);
            return;
        }

        /* uma busca de membros por projeto; sao poucos projetos por tela */
        await Promise.all(projetos.map(async p => {
            p.membros = await Api.get(`/projetos/${p.id}/membros`);
        }));

        const corpo = document.getElementById("corpo");
        corpo.innerHTML = projetos.length
            ? projetos.map(linha).join("")
            : `<tr><td colspan="6" class="empty-state">Nenhum projeto encontrado.</td></tr>`;

        corpo.querySelectorAll("[data-excluir]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!confirm("Deseja realmente desativar este projeto? Todos os bolsistas serão desvinculados.")) return;
            try {
                await Api.delete(`/projetos/${a.dataset.excluir}`);
                Util.aviso("Projeto desativado.", "sucesso");
                await carregar();
            } catch (erro) {
                Util.aviso(erro.message);
            }
        }));
    }

    function linha(p) {
        const doMeuLab = usuario.laboratorioId === p.laboratorioId;
        const podeGerenciar = labsGerenciados.has(p.laboratorioId);

        const celulaLab = Sessao.ehBolsista() && !doMeuLab
            ? `<span class="badge status-concluido" style="background-color:#f1f5f9;color:var(--text-muted);border:1px solid var(--border-grid);">${Util.escapar(p.nomeLaboratorio)}</span>`
            : `<a href="/laboratorio-detalhes.html?id=${p.laboratorioId}" class="badge status-concluido" title="Ver Detalhes do Laboratório"><i class="fas fa-flask"></i> ${Util.escapar(p.nomeLaboratorio)}</a>`;

        const membros = p.membros.length
            ? p.membros.map(m => `<span class="badge-membro" title="${Util.escapar(m.curso || "")} - ${Util.escapar(m.cargo || "Bolsista")}"><i class="fas fa-user-graduate" style="font-size:0.7rem;"></i> ${Util.escapar(m.nome)}</span>`).join("")
            : `<span class="empty-text">Nenhum membro vinculado</span>`;

        const estiloOlho = "color:var(--text-muted);background-color:#f1f5f9;border:1px solid var(--border-grid);margin-right:8px;";
        let acoes;
        if (Sessao.ehBolsista()) {
            acoes = doMeuLab
                ? `<a href="/projeto-detalhes.html?id=${p.id}" class="action-link action-link-details" style="${estiloOlho}" title="Detalhes do Projeto"><i class="fas fa-eye"></i></a>`
                : `<span class="text-muted" title="Sem acesso a detalhes de projetos de outras equipes"><i class="fas fa-lock"></i></span>`;
        } else {
            acoes = `<a href="/projeto-detalhes.html?id=${p.id}" class="action-link action-link-details" style="${estiloOlho}" title="Detalhes do Projeto"><i class="fas fa-eye"></i></a>`;
            if (podeGerenciar) {
                acoes += `<a href="/projeto-form.html?id=${p.id}" class="action-link action-link-edit" title="Editar Projeto"><i class="fas fa-edit"></i></a>
                          <a href="#" class="action-link action-link-delete" title="Remover Projeto" data-excluir="${p.id}"><i class="fas fa-trash"></i></a>`;
            }
        }

        return `
            <tr>
                <td><strong>${Util.escapar(p.nome)}</strong></td>
                <td><div class="projeto-desc" title="${Util.escapar(p.descricao)}">${Util.escapar(p.descricao || "Sem descrição.")}</div></td>
                <td>${celulaLab}</td>
                <td><span class="text-main" style="font-size:0.85rem;font-weight:500;">
                        <i class="fas fa-user-tie" style="color:#64748b;margin-right:4px;"></i>
                        ${Util.escapar(coordenadorPorLab.get(p.laboratorioId) || "Sem coordenador")}</span></td>
                <td><div class="membros-list-container">${membros}</div></td>
                <td><div class="actions-cell">${acoes}</div></td>
            </tr>`;
    }
})();
