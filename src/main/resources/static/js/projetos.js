(async () => {
    const usuario = await Sessao.iniciar();
    Util.configurarModais();

    if (Sessao.gerencia()) {
        const btnNovo = document.getElementById("btn-novo");
        btnNovo.hidden = false;
        btnNovo.addEventListener("click", () => abrirModalCriacao());
    }

    const buscaNome = Util.parametro("buscaNome") || "";
    const labId = Util.parametro("labId") || "";
    document.getElementById("busca-nome").value = buscaNome;
    if (buscaNome || labId) {
        document.getElementById("limpar").hidden = false;
    }

    let labs = [];
    try {
        labs = await Api.get("/laboratorios");
    } catch (e) {
        Util.aviso("Erro ao carregar lista de laboratórios.");
    }

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

    /* Popular select do modal de projeto com os labs gerenciados */
    const modalLabSelect = document.getElementById("modal-lab-projeto");
    const labsParaCriacao = Sessao.ehAdmin() ? labs : labs.filter(l => labsGerenciados.has(l.id));
    modalLabSelect.innerHTML = `<option value="">Selecione o laboratório...</option>` +
        labsParaCriacao.map(l => `<option value="${l.id}">${Util.escapar(l.nome)}</option>`).join("");

    document.getElementById("form-busca").addEventListener("submit", (e) => {
        e.preventDefault();
        navegar(document.getElementById("busca-nome").value.trim(), select.value);
    });

    select.addEventListener("change", () => {
        navegar(document.getElementById("busca-nome").value.trim(), select.value);
    });

    function navegar(nome, lab) {
        const q = new URLSearchParams();
        if (nome) q.set("buscaNome", nome);
        if (lab) q.set("labId", lab);
        window.location.href = `/projetos.html${q.toString() ? "?" + q : ""}`;
    }

    let listaProjetosAtuais = [];
    await carregar();
    configurarFormModalProjeto();

    async function carregar() {
        const corpo = document.getElementById("corpo");
        corpo.innerHTML = `
            <tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted);">
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="height: 20px; background: #f1f5f9; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                    <div style="height: 20px; background: #f1f5f9; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                    <div style="height: 20px; background: #f1f5f9; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                </div>
            </td></tr>
        `;

        const q = new URLSearchParams();
        if (buscaNome) q.set("buscaNome", buscaNome);
        if (labId) q.set("labId", labId);

        try {
            listaProjetosAtuais = await Api.get(`/projetos${q.toString() ? "?" + q : ""}`);
        } catch (e) {
            Util.aviso(e.message);
            corpo.innerHTML = `<tr><td colspan="6" class="empty-state-cell">Erro ao carregar projetos.</td></tr>`;
            return;
        }

        /* busca de membros por projeto em paralelo */
        await Promise.all(listaProjetosAtuais.map(async p => {
            try {
                p.membros = await Api.get(`/projetos/${p.id}/membros`);
            } catch {
                p.membros = [];
            }
        }));

        corpo.innerHTML = listaProjetosAtuais.length
            ? listaProjetosAtuais.map(linha).join("")
            : `<tr>
                <td colspan="6" class="empty-state-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    <p style="margin: 0; font-weight: 500;">Nenhum projeto encontrado.</p>
                </td>
               </tr>`;

        corpo.querySelectorAll("[data-editar]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const p = listaProjetosAtuais.find(x => x.id === Number(btn.dataset.editar));
                if (p) abrirModalEdicao(p);
            });
        });

        corpo.querySelectorAll("[data-excluir]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            const nomeProj = a.dataset.nome || "este projeto";
            if (!confirm(`Deseja realmente desativar o projeto "${nomeProj}"? Todos os bolsistas vinculados serão liberados.`)) return;
            try {
                await Api.delete(`/projetos/${a.dataset.excluir}`);
                Util.aviso("Projeto desativado com sucesso.", "sucesso");
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
            : `<a href="/laboratorio-detalhes.html?id=${p.laboratorioId}" class="badge-lab-link" title="Ver Detalhes do Laboratório">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                    <span>${Util.escapar(p.nomeLaboratorio)}</span>
               </a>`;

        const membros = p.membros.length
            ? p.membros.map(m => `
                <span class="badge-membro" title="${Util.escapar(m.curso || "")} - ${Util.escapar(m.cargo || "Bolsista")}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    <span>${Util.escapar(m.nome)}</span>
                </span>`).join("")
            : `<span class="empty-text">Nenhum membro vinculado</span>`;

        let acoes;
        if (Sessao.ehBolsista()) {
            acoes = doMeuLab
                ? `<a href="/projeto-detalhes.html?id=${p.id}" class="btn-icon btn-details" title="Ver detalhes de ${Util.escapar(p.nome)}" aria-label="Ver detalhes de ${Util.escapar(p.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                   </a>`
                : `<span class="text-muted" title="Sem acesso a projetos de outros laboratórios" style="display:inline-flex;padding:8px;color:var(--text-tertiary);">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                   </span>`;
        } else {
            acoes = `<a href="/projeto-detalhes.html?id=${p.id}" class="btn-icon btn-details" title="Ver detalhes de ${Util.escapar(p.nome)}" aria-label="Ver detalhes de ${Util.escapar(p.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                     </a>`;
            if (podeGerenciar) {
                acoes += `
                    <a href="#" class="btn-icon btn-edit" data-editar="${p.id}" title="Editar ${Util.escapar(p.nome)}" aria-label="Editar ${Util.escapar(p.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </a>
                    <a href="#" class="btn-icon btn-delete" title="Excluir ${Util.escapar(p.nome)}" aria-label="Excluir ${Util.escapar(p.nome)}" data-excluir="${p.id}" data-nome="${Util.escapar(p.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </a>`;
            }
        }

        return `
            <tr>
                <td><strong>${Util.escapar(p.nome)}</strong></td>
                <td><div class="projeto-desc" title="${Util.escapar(p.descricao)}">${Util.escapar(p.descricao || "Sem descrição cadastrada.")}</div></td>
                <td>${celulaLab}</td>
                <td>
                    <span style="font-size:0.875rem;font-weight:500;display:inline-flex;align-items:center;gap:6px;color:var(--text-main);">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--text-tertiary);"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        ${Util.escapar(coordenadorPorLab.get(p.laboratorioId) || "Sem coordenador")}
                    </span>
                </td>
                <td><div class="membros-list-container">${membros}</div></td>
                <td><div class="actions-cell">${acoes}</div></td>
            </tr>`;
    }

    function abrirModalCriacao() {
        document.getElementById("projeto-id").value = "";
        document.getElementById("modal-nome-projeto").value = "";
        document.getElementById("modal-lab-projeto").value = "";
        document.getElementById("modal-desc-projeto").value = "";
        document.getElementById("label-modal-projeto").textContent = "Cadastrar Novo Projeto";
        document.getElementById("label-btn-salvar-proj").textContent = "Cadastrar Projeto";
        Util.abrirModal("modal-projeto");
    }

    function abrirModalEdicao(p) {
        document.getElementById("projeto-id").value = p.id;
        document.getElementById("modal-nome-projeto").value = p.nome;
        document.getElementById("modal-lab-projeto").value = p.laboratorioId;
        document.getElementById("modal-desc-projeto").value = p.descricao || "";
        document.getElementById("label-modal-projeto").textContent = "Editar Projeto";
        document.getElementById("label-btn-salvar-proj").textContent = "Salvar Alterações";
        Util.abrirModal("modal-projeto");
    }

    function configurarFormModalProjeto() {
        const form = document.getElementById("form-modal-projeto");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const idProj = document.getElementById("projeto-id").value;
            const nome = document.getElementById("modal-nome-projeto").value.trim();
            const laboratorioId = Number(document.getElementById("modal-lab-projeto").value);
            const descricao = document.getElementById("modal-desc-projeto").value.trim();

            if (nome.length < 3) {
                Util.aviso("O nome do projeto deve ter pelo menos 3 caracteres.");
                return;
            }

            const btn = document.getElementById("btn-modal-salvar-proj");
            if (btn) {
                btn.classList.add("is-loading");
                btn.disabled = true;
            }

            try {
                if (idProj) {
                    await Api.put(`/projetos/${idProj}`, { nome, laboratorioId, descricao });
                    Util.fecharModal("modal-projeto");
                    Util.aviso("Projeto atualizado com sucesso!", "sucesso");
                } else {
                    await Api.post("/projetos", { nome, laboratorioId, descricao });
                    Util.fecharModal("modal-projeto");
                    Util.aviso("Projeto cadastrado com sucesso!", "sucesso");
                }
                await carregar();
            } catch (erro) {
                Util.aviso(erro.message);
            } finally {
                if (btn) {
                    btn.classList.remove("is-loading");
                    btn.disabled = false;
                }
            }
        });
    }
})();
