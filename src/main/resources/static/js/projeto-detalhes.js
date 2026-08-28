(async () => {
    const usuario = await Sessao.iniciar();
    Util.configurarModais();

    const id = Util.parametro("id");
    if (!id) {
        window.location.href = "/projetos.html";
        return;
    }

    document.getElementById("info").innerHTML = `
        <div class="skeleton-box" style="height: 80px;"></div>
        <div class="skeleton-box" style="height: 80px;"></div>
    `;
    document.getElementById("detalhes").innerHTML = `
        <div class="skeleton-box" style="height: 120px; margin-bottom: 20px;"></div>
        <div class="skeleton-box" style="height: 250px;"></div>
    `;

    let projeto, membros, lab;
    try {
        projeto = await Api.get(`/projetos/${id}`);
        [membros, lab] = await Promise.all([
            Api.get(`/projetos/${id}/membros`),
            Api.get(`/laboratorios/${projeto.laboratorioId}`)
        ]);
    } catch (e) {
        Util.aviso(e.message);
        return;
    }

    const podeGerenciar = Sessao.ehAdmin()
        || (Sessao.ehProfessor() && lab.coordenadorId === usuario.id);

    document.getElementById("nome-projeto").textContent = projeto.nome;
    document.title = `${projeto.nome} - SisBolsa`;

    if (podeGerenciar) {
        const btnAbrirModal = document.getElementById("btn-abrir-vincular");
        if (btnAbrirModal) {
            btnAbrirModal.hidden = false;
            btnAbrirModal.addEventListener("click", () => carregarModalVincular());
        }
    }

    document.getElementById("info").innerHTML = `
        <div class="info-item">
            <span class="info-label">Laboratório Responsável</span>
            <span class="info-value">
                <a href="/laboratorio-detalhes.html?id=${projeto.laboratorioId}" style="text-decoration:none;color:var(--primary-color);display:inline-flex;align-items:center;gap:6px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                    <span>${Util.escapar(projeto.nomeLaboratorio)}</span>
                </a>
            </span>
        </div>
        <div class="info-item">
            <span class="info-label">Professor Coordenador / Gestor</span>
            <span class="info-value" style="display:inline-flex;align-items:center;gap:6px;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--text-tertiary);"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                <span>${Util.escapar(lab.coordenador || "Sem coordenador")}</span>
            </span>
        </div>`;

    await montar();

    async function montar() {
        try {
            membros = await Api.get(`/projetos/${id}/membros`);
        } catch {
            membros = [];
        }

        const colunas = podeGerenciar ? 5 : 4;
        const linhas = membros.length
            ? membros.map(m => `
                <tr>
                    <td><strong>${Util.escapar(m.nome)}</strong></td>
                    <td>${Util.escapar(m.curso || "---")}</td>
                    <td><span class="badge badge-cargo">${Util.escapar(m.cargo || "Bolsista")}</span></td>
                    <td>${Util.escapar(m.email)}</td>
                    ${podeGerenciar ? `
                        <td>
                            <a href="#" class="badge-unlink" title="Remover bolsista ${Util.escapar(m.nome)} deste projeto" aria-label="Remover bolsista ${Util.escapar(m.nome)} deste projeto" data-remover="${m.id}" data-nome="${Util.escapar(m.nome)}">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                                <span>Remover</span>
                            </a>
                        </td>` : ""}
                </tr>`).join("")
            : `<tr><td colspan="${colunas}" class="empty-state-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p style="margin:0;font-weight:500;">Nenhum bolsista vinculado a este projeto no momento.</p>
               </td></tr>`;

        document.getElementById("detalhes").innerHTML = `
            <div class="desc-box" style="margin-bottom: 24px;">
                <span class="info-label">Descrição Detalhada do Projeto</span>
                <p>${Util.escapar(projeto.descricao || "Nenhuma descrição detalhada foi cadastrada para este projeto.")}</p>
            </div>

            <div class="section-header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 class="section-title" style="margin: 0;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Bolsistas Integrantes</span>
                    <span class="count-badge count-badge-purple" style="margin-left: 8px;">${membros.length}</span>
                </h2>
                ${podeGerenciar ? `
                    <button type="button" class="btn-new btn-primary" onclick="document.getElementById('btn-abrir-vincular').click()" style="padding: 8px 14px; font-size: 0.825rem;">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>Adicionar Integrante</span>
                    </button>` : ""}
            </div>

            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>Nome</th><th>Curso</th><th>Cargo</th><th>E-mail</th>
                        ${podeGerenciar ? "<th>Desvincular</th>" : ""}
                    </tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>`;

        document.querySelectorAll("[data-remover]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            const nomeMembro = a.dataset.nome || "este bolsista";
            if (!confirm(`Remover "${nomeMembro}" do projeto?`)) return;
            try {
                await Api.delete(`/projetos/${id}/membros/${a.dataset.remover}`);
                Util.aviso("Bolsista removido do projeto com sucesso.", "sucesso");
                await montar();
            } catch (erro) {
                Util.aviso(erro.message);
            }
        }));
    }

    async function carregarModalVincular() {
        const select = document.getElementById("bolsistaId");
        select.innerHTML = `<option value="">Carregando bolsistas disponíveis...</option>`;
        select.disabled = true;

        Util.abrirModal("modal-vincular");

        try {
            const doLab = await Api.get(`/laboratorios/${projeto.laboratorioId}/bolsistas`);
            const jaMembro = new Set(membros.map(m => m.id));
            const disponiveis = doLab.filter(b => !jaMembro.has(b.id));

            if (disponiveis.length === 0) {
                select.innerHTML = `<option value="">Todos os bolsistas do laboratório já fazem parte do projeto</option>`;
                select.disabled = true;
            } else {
                select.innerHTML = `<option value="">Selecione um bolsista...</option>` +
                    disponiveis.map(b => `<option value="${b.id}">${Util.escapar(b.nome)} (${Util.escapar(b.cargo || "Bolsista")})</option>`).join("");
                select.disabled = false;
            }
        } catch {
            select.innerHTML = `<option value="">Erro ao carregar bolsistas</option>`;
        }
    }

    const formVincular = document.getElementById("form-vincular");
    if (formVincular) {
        formVincular.addEventListener("submit", async (e) => {
            e.preventDefault();
            const bolsistaId = document.getElementById("bolsistaId").value;
            if (!bolsistaId) return;

            const btn = document.getElementById("btn-vincular-submit");
            if (btn) {
                btn.classList.add("is-loading");
                btn.disabled = true;
            }

            try {
                await Api.post(`/projetos/${id}/membros/${bolsistaId}`);
                Util.fecharModal("modal-vincular");
                Util.aviso("Bolsista vinculado ao projeto com sucesso!", "sucesso");
                await montar();
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

