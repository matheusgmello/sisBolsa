(async () => {
    await Sessao.iniciar();
    Util.configurarModais();

    const id = Util.parametro("id");
    if (!id) {
        window.location.href = "/laboratorios.html";
        return;
    }

    document.getElementById("visao-geral").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
            <div class="skeleton-box" style="height: 80px;"></div>
            <div class="skeleton-box" style="height: 80px;"></div>
            <div class="skeleton-box" style="height: 80px;"></div>
            <div class="skeleton-box" style="height: 80px;"></div>
        </div>
        <div class="skeleton-box" style="height: 120px;"></div>
    `;

    let lab, projetos, bolsistas;
    try {
        [lab, projetos, bolsistas] = await Promise.all([
            Api.get(`/laboratorios/${id}`),
            Api.get(`/laboratorios/${id}/projetos`),
            Api.get(`/laboratorios/${id}/bolsistas`)
        ]);
    } catch (e) {
        Util.aviso(e.message);
        return;
    }

    /*
     * o vinculo bolsista x projeto e buscado uma vez por projeto e depois
     * invertido em memoria. e o mesmo truque do dao antigo para nao fazer
     * uma consulta por bolsista.
     */
    const membrosPorProjeto = new Map();
    const projetosPorBolsista = new Map();

    async function carregarMembrosProjetos() {
        membrosPorProjeto.clear();
        projetosPorBolsista.clear();
        await Promise.all(projetos.map(async p => {
            try {
                const membros = await Api.get(`/projetos/${p.id}/membros`);
                membrosPorProjeto.set(p.id, membros);
                membros.forEach(m => {
                    if (!projetosPorBolsista.has(m.id)) projetosPorBolsista.set(m.id, []);
                    projetosPorBolsista.get(m.id).push(p);
                });
            } catch {
                membrosPorProjeto.set(p.id, []);
            }
        }));
    }

    await carregarMembrosProjetos();

    const podeGerenciar = Sessao.ehAdmin()
        || (Sessao.ehProfessor() && lab.coordenadorId === Sessao.get().id);

    document.getElementById("nome-lab").textContent = lab.nome;
    document.title = `${lab.nome} - SisBolsa`;
    atualizarContadoresAbas();

    function atualizarContadoresAbas() {
        document.getElementById("aba-projetos").textContent = `Projetos (${projetos.length})`;
        document.getElementById("aba-equipe").textContent = `Equipe (${bolsistas.length})`;
    }

    montarVisaoGeral();
    montarProjetos();
    montarEquipe();
    ligarAbas();
    configurarFormProjeto();

    function montarVisaoGeral() {
        const capacidade = lab.capacidade > 0 ? lab.capacidade : 1;
        const pct = (bolsistas.length * 100) / capacidade;
        const classe = pct >= 85 ? "danger" : pct >= 50 ? "warning" : "success";

        let recado;
        if (pct >= 100) {
            recado = `<span style="color:var(--danger-color);font-weight:600;">Limite de capacidade atingido.</span> Não é recomendado vincular novos bolsistas.`;
        } else if (pct >= 85) {
            recado = `<span style="color:var(--warning-color);font-weight:600;">Atenção:</span> Laboratório próximo da capacidade limite. Restam poucas vagas.`;
        } else {
            recado = `<span style="color:var(--success-color);font-weight:600;">Disponível:</span> O laboratório possui vagas disponíveis para novos membros.`;
        }

        const statusClasse = "status-" + String(lab.status || "").toLowerCase().replaceAll(" ", "-");
        document.getElementById("visao-geral").innerHTML = `
            <div class="lab-info-grid">
                <div class="info-item"><span class="info-label">Área de Pesquisa</span><span class="info-value">${Util.escapar(lab.areaPesquisa)}</span></div>
                <div class="info-item"><span class="info-label">Status</span><span class="info-value"><span class="badge ${statusClasse}">${Util.escapar(lab.status)}</span></span></div>
                <div class="info-item"><span class="info-label">Professor Coordenador</span><span class="info-value">${Util.escapar(lab.coordenador || "---")}</span></div>
                <div class="info-item"><span class="info-label">Capacidade Máxima</span><span class="info-value">${lab.capacidade} bolsistas</span></div>
            </div>

            <div class="capacity-card">
                <div class="capacity-header">
                    <h3>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--primary-color);"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Ocupação e Vagas
                    </h3>
                    <span class="capacity-stats">${bolsistas.length} de ${lab.capacidade} Bolsistas (${Util.numero(pct)}%)</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill ${classe}" style="transform: scaleX(${Math.min(pct, 100) / 100}); width: 100%;"></div>
                </div>
                <p style="font-size:0.875rem;color:var(--text-secondary);margin:4px 0 0;line-height:1.4;">${recado}</p>
            </div>`;
    }

    function montarProjetos() {
        const cartoes = projetos.length
            ? projetos.map(p => {
                const membros = membrosPorProjeto.get(p.id) || [];
                const tags = membros.length
                    ? membros.map(m => `<span class="project-member-tag" title="${Util.escapar(m.cargo || "Bolsista")}">${Util.escapar(m.nome)}</span>`).join(" ")
                    : `<span class="project-member-tag empty">Nenhum bolsista vinculado</span>`;
                return `
                    <div class="project-card">
                        <div>
                            <div class="project-card-header">
                                <h3>${Util.escapar(p.nome)}</h3>
                                ${podeGerenciar ? `
                                    <a href="#" class="btn-deactivate-project" title="Desativar projeto ${Util.escapar(p.nome)}" aria-label="Desativar projeto ${Util.escapar(p.nome)}" data-desativar="${p.id}" data-nome="${Util.escapar(p.nome)}">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                                    </a>` : ""}
                            </div>
                            <p class="project-desc">${Util.escapar(p.descricao || "Sem descrição disponível.")}</p>
                            <div class="project-members" style="margin-top:12px;">
                                <h4>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    Equipe do Projeto:
                                </h4>
                                <div class="project-card-members">${tags}</div>
                            </div>
                        </div>
                        <div class="project-card-footer">
                            <span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">
                                ${membros.length} integrante(s)
                            </span>
                            <a href="/projeto-detalhes.html?id=${p.id}" class="btn-view-project">
                                <span>Gerenciar Equipe</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                            </a>
                        </div>
                    </div>`;
            }).join("")
            : `<div class="empty-projects-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                    <p>Nenhum projeto ativo neste laboratório.</p>
               </div>`;

        const headerBar = `
            <div class="section-header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 class="section-title" style="margin: 0;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    <span>Projetos do Laboratório</span>
                    <span class="count-badge count-badge-purple" style="margin-left: 8px;">${projetos.length}</span>
                </h2>
                ${podeGerenciar ? `
                    <button type="button" class="btn-new btn-primary" id="btn-abrir-novo-projeto" style="padding: 8px 16px; font-size: 0.85rem;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>Novo Projeto</span>
                    </button>` : ""}
            </div>`;

        document.getElementById("projetos").innerHTML = `${headerBar}<div class="projects-grid">${cartoes}</div>`;

        const btnAbrir = document.getElementById("btn-abrir-novo-projeto");
        if (btnAbrir) {
            btnAbrir.addEventListener("click", () => {
                document.getElementById("form-novo-projeto").reset();
                Util.abrirModal("modal-novo-projeto");
            });
        }

        document.querySelectorAll("[data-desativar]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            const nomeProj = a.dataset.nome || "este projeto";
            if (!confirm(`Deseja desativar o projeto "${nomeProj}"?`)) return;
            try {
                await Api.delete(`/projetos/${a.dataset.desativar}`);
                projetos = await Api.get(`/laboratorios/${id}/projetos`);
                await carregarMembrosProjetos();
                atualizarContadoresAbas();
                montarProjetos();
                Util.aviso("Projeto desativado com sucesso.", "sucesso");
            } catch (erro) {
                Util.aviso(erro.message);
            }
        }));
    }

    function configurarFormProjeto() {
        const form = document.getElementById("form-novo-projeto");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById("btn-salvar-proj");
            if (btn) {
                btn.classList.add("is-loading");
                btn.disabled = true;
            }
            try {
                await Api.post("/projetos", {
                    nome: document.getElementById("nomeProjeto").value.trim(),
                    descricao: document.getElementById("descProjeto").value.trim(),
                    laboratorioId: Number(id)
                });
                Util.fecharModal("modal-novo-projeto");
                Util.aviso("Projeto cadastrado com sucesso!", "sucesso");
                projetos = await Api.get(`/laboratorios/${id}/projetos`);
                await carregarMembrosProjetos();
                atualizarContadoresAbas();
                montarProjetos();
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

    function montarEquipe() {
        const linhas = bolsistas.length
            ? bolsistas.map(b => {
                const seus = projetosPorBolsista.get(b.id) || [];
                const tags = seus.length
                    ? seus.map(p => `<span class="project-tag">${Util.escapar(p.nome)}</span>`).join(" ")
                    : `<span class="no-projects">Nenhum</span>`;
                return `
                    <tr>
                        <td><strong>${Util.escapar(b.nome)}</strong></td>
                        <td>${Util.escapar(b.curso || "---")}</td>
                        <td><span class="badge badge-cargo">${Util.escapar(b.cargo || "Bolsista")}</span></td>
                        <td>${tags}</td>
                        <td>${Util.escapar(b.email)}</td>
                        <td>${Util.escapar(b.matricula || "---")}</td>
                    </tr>`;
            }).join("")
            : `<tr><td colspan="6" class="empty-state-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p style="margin:0;font-weight:500;">Nenhum bolsista vinculado a este laboratório.</p>
               </td></tr>`;

        document.getElementById("equipe").innerHTML = `
            <div class="section-header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 class="section-title" style="margin: 0;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Equipe de Bolsistas & Pesquisadores</span>
                    <span class="count-badge count-badge-purple" style="margin-left: 8px;">${bolsistas.length}</span>
                </h2>
                ${podeGerenciar ? `
                    <a href="/usuarios.html" class="btn-new btn-export" style="padding: 8px 14px; font-size: 0.825rem;">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        <span>Gerenciar Bolsistas</span>
                    </a>` : ""}
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Nome</th><th>Curso</th><th>Cargo</th><th>Projetos Atuantes</th><th>E-mail</th><th>Matrícula</th></tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>`;
    }

    function ligarAbas() {
        const abas = document.querySelectorAll(".tab-btn");
        const conteudos = document.querySelectorAll(".tab-content");
        const chave = "abaLab_" + id;

        abas.forEach(aba => aba.addEventListener("click", () => {
            abas.forEach(a => {
                a.classList.remove("active");
                a.setAttribute("aria-selected", "false");
            });
            aba.classList.add("active");
            aba.setAttribute("aria-selected", "true");
            conteudos.forEach(c => c.classList.remove("active"));
            document.getElementById(aba.dataset.tab).classList.add("active");
            localStorage.setItem(chave, aba.dataset.tab);
        }));

        const salva = localStorage.getItem(chave);
        if (salva) {
            const alvo = document.querySelector(`.tab-btn[data-tab="${salva}"]`);
            if (alvo) alvo.click();
        }
    }
})();
