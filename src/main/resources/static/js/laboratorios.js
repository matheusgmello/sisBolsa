(async () => {
    const usuario = await Sessao.iniciar();
    Util.configurarModais();

    if (Sessao.ehAdmin()) {
        const btnNovo = document.getElementById("btn-novo");
        btnNovo.hidden = false;
        btnNovo.addEventListener("click", () => abrirModalCriacao());

        /* Carrega lista de professores para o select do modal */
        try {
            const professores = await Api.get("/usuarios?tipo=PROFESSOR&pagina=1");
            const selectCoord = document.getElementById("modal-coord-lab");
            selectCoord.innerHTML = `<option value="">Selecione um professor...</option>` +
                professores.itens.map(p => `<option value="${p.id}">${Util.escapar(p.nome)}</option>`).join("");
        } catch {
            /* se falhar lista sem travar a tela */
        }
    }

    /* bolsista ve os projetos no lugar da area de pesquisa */
    document.getElementById("cabecalho").innerHTML = Sessao.ehBolsista()
        ? "<th>Nome</th><th>Coordenador</th><th>Projetos</th><th>Vagas / Ocupação</th><th>Status</th><th>Ações</th>"
        : "<th>Nome</th><th>Área de Pesquisa</th><th>Coordenador</th><th>Vagas / Ocupação</th><th>Status</th><th>Ações</th>";

    let listaLabs = [];
    await carregar();
    configurarFormModalLab();

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

        try {
            listaLabs = await Api.get("/laboratorios");
        } catch (e) {
            Util.aviso(e.message);
            corpo.innerHTML = `<tr><td colspan="6" class="empty-state-cell">Erro ao carregar laboratórios.</td></tr>`;
            return;
        }

        /* so o bolsista precisa da lista de projetos por lab, entao so ele paga a busca */
        if (Sessao.ehBolsista()) {
            await Promise.all(listaLabs.map(async l => {
                try {
                    l.projetos = await Api.get(`/laboratorios/${l.id}/projetos`);
                } catch {
                    l.projetos = [];
                }
            }));
        }

        corpo.innerHTML = listaLabs.length
            ? listaLabs.map(linha).join("")
            : `<tr>
                <td colspan="6" class="empty-state-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                    <p style="margin: 0; font-weight: 500;">Nenhum laboratório cadastrado no momento.</p>
                </td>
               </tr>`;

        corpo.querySelectorAll("[data-editar]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const l = listaLabs.find(x => x.id === Number(btn.dataset.editar));
                if (l) abrirModalEdicao(l);
            });
        });

        corpo.querySelectorAll("[data-excluir]").forEach(botao => {
            botao.addEventListener("click", async (e) => {
                e.preventDefault();
                const nomeLab = botao.dataset.nome || "este laboratório";
                if (!confirm(`Deseja realmente desativar o laboratório "${nomeLab}"?`)) return;
                try {
                    await Api.delete(`/laboratorios/${botao.dataset.excluir}`);
                    Util.aviso("Laboratório desativado com sucesso.", "sucesso");
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
            ? `<span class="badge-lotacao" title="Capacidade acima de 85%">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span>Lotação</span>
               </span>`
            : "";

        const colunasMeio = Sessao.ehBolsista()
            ? `<td>${Util.escapar(l.coordenador || "---")}</td>
               <td>${l.projetos && l.projetos.length
                        ? l.projetos.map(p => `<span class="badge-projeto-tag">${Util.escapar(p.nome)}</span>`).join(" ")
                        : `<span class="empty-text">Nenhum projeto</span>`}</td>`
            : `<td>${Util.escapar(l.areaPesquisa)}</td><td>${Util.escapar(l.coordenador || "---")}</td>`;

        let acoes;
        if (Sessao.ehBolsista()) {
            acoes = l.id === usuario.laboratorioId
                ? `<a href="/laboratorio-detalhes.html?id=${l.id}" class="btn-icon btn-details" title="Ver detalhes de ${Util.escapar(l.nome)}" aria-label="Ver detalhes de ${Util.escapar(l.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                   </a>`
                : `<span class="text-muted" title="Sem acesso a outros laboratórios" style="display:inline-flex;padding:8px;color:var(--text-tertiary);">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                   </span>`;
        } else {
            acoes = `<a href="/laboratorio-detalhes.html?id=${l.id}" class="btn-icon btn-details" title="Ver detalhes de ${Util.escapar(l.nome)}" aria-label="Ver detalhes de ${Util.escapar(l.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                     </a>`;
            if (Sessao.ehAdmin()) {
                acoes += `
                    <a href="#" class="btn-icon btn-edit" data-editar="${l.id}" title="Editar ${Util.escapar(l.nome)}" aria-label="Editar ${Util.escapar(l.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </a>
                    <a href="#" class="btn-icon btn-delete" title="Excluir ${Util.escapar(l.nome)}" aria-label="Excluir ${Util.escapar(l.nome)}" data-excluir="${l.id}" data-nome="${Util.escapar(l.nome)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </a>`;
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

    function abrirModalCriacao() {
        document.getElementById("lab-id").value = "";
        document.getElementById("modal-nome-lab").value = "";
        document.getElementById("modal-area-lab").value = "";
        document.getElementById("modal-coord-lab").value = "";
        document.getElementById("modal-capacidade-lab").value = 10;
        document.getElementById("modal-status-lab").value = "Ativo";
        document.getElementById("label-modal-lab").textContent = "Cadastrar Novo Laboratório";
        document.getElementById("label-btn-salvar-lab").textContent = "Cadastrar Laboratório";
        Util.abrirModal("modal-laboratorio");
    }

    function abrirModalEdicao(l) {
        document.getElementById("lab-id").value = l.id;
        document.getElementById("modal-nome-lab").value = l.nome || "";
        document.getElementById("modal-area-lab").value = l.areaPesquisa || "";
        document.getElementById("modal-coord-lab").value = l.coordenadorId || "";
        document.getElementById("modal-capacidade-lab").value = l.capacidade || 10;
        document.getElementById("modal-status-lab").value = l.status || "Ativo";
        document.getElementById("label-modal-lab").textContent = "Editar Laboratório";
        document.getElementById("label-btn-salvar-lab").textContent = "Salvar Alterações";
        Util.abrirModal("modal-laboratorio");
    }

    function configurarFormModalLab() {
        const form = document.getElementById("form-modal-lab");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const idLab = document.getElementById("lab-id").value;
            const nome = document.getElementById("modal-nome-lab").value.trim();
            const areaPesquisa = document.getElementById("modal-area-lab").value.trim();
            const coordenadorId = document.getElementById("modal-coord-lab").value ? Number(document.getElementById("modal-coord-lab").value) : null;
            const capacidade = Number(document.getElementById("modal-capacidade-lab").value);
            const status = document.getElementById("modal-status-lab").value;

            if (nome.length < 3) {
                Util.aviso("O nome do laboratório deve ter pelo menos 3 caracteres.");
                return;
            }

            const btn = document.getElementById("btn-modal-salvar-lab");
            if (btn) {
                btn.classList.add("is-loading");
                btn.disabled = true;
            }

            const corpo = { nome, areaPesquisa, coordenadorId, capacidade, status };

            try {
                if (idLab) {
                    await Api.put(`/laboratorios/${idLab}`, corpo);
                    Util.fecharModal("modal-laboratorio");
                    Util.aviso("Laboratório atualizado com sucesso!", "sucesso");
                } else {
                    await Api.post("/laboratorios", corpo);
                    Util.fecharModal("modal-laboratorio");
                    Util.aviso("Laboratório cadastrado com sucesso!", "sucesso");
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
