(async () => {
    await Sessao.iniciar();

    const id = Util.parametro("id");
    if (!id) {
        window.location.href = "/laboratorios.html";
        return;
    }

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
    await Promise.all(projetos.map(async p => {
        const membros = await Api.get(`/projetos/${p.id}/membros`);
        membrosPorProjeto.set(p.id, membros);
        membros.forEach(m => {
            if (!projetosPorBolsista.has(m.id)) projetosPorBolsista.set(m.id, []);
            projetosPorBolsista.get(m.id).push(p);
        });
    }));

    const podeGerenciar = Sessao.ehAdmin()
        || (Sessao.ehProfessor() && lab.coordenadorId === Sessao.get().id);

    document.getElementById("nome-lab").textContent = lab.nome;
    document.title = `${lab.nome} - SisBolsa`;
    document.getElementById("aba-projetos").textContent = `Projetos (${projetos.length})`;
    document.getElementById("aba-equipe").textContent = `Equipe (${bolsistas.length})`;

    montarVisaoGeral();
    montarProjetos();
    montarEquipe();
    ligarAbas();

    function montarVisaoGeral() {
        const capacidade = lab.capacidade > 0 ? lab.capacidade : 1;
        const pct = (bolsistas.length * 100) / capacidade;
        const classe = pct >= 85 ? "danger" : pct >= 50 ? "warning" : "success";

        let recado;
        if (pct >= 100) {
            recado = `<i class="fas fa-exclamation-triangle" style="color:var(--danger-color);"></i> Limite de capacidade atingido. Não é recomendado vincular novos bolsistas.`;
        } else if (pct >= 85) {
            recado = `<i class="fas fa-exclamation-circle" style="color:var(--warning-color);"></i> Laboratório próximo da capacidade limite. Restam poucas vagas.`;
        } else {
            recado = `<i class="fas fa-check-circle" style="color:var(--success-color);"></i> O laboratório possui vagas disponíveis para novos membros.`;
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
                    <h3><i class="fas fa-users-cog"></i> Ocupação e Vagas</h3>
                    <span class="capacity-stats">${bolsistas.length} / ${lab.capacidade} Bolsistas (${Util.numero(pct)}%)</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill ${classe}" style="width: ${Math.min(pct, 100)}%;"></div>
                </div>
                <p style="font-size:0.85rem;color:var(--text-muted);margin:5px 0 0;line-height:1.4;">${recado}</p>
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
                                ${podeGerenciar ? `<a href="#" class="btn-deactivate-project" title="Desativar projeto" data-desativar="${p.id}"><i class="fas fa-power-off"></i></a>` : ""}
                            </div>
                            <p class="project-desc">${Util.escapar(p.descricao || "Sem descrição disponível.")}</p>
                            <div class="project-members" style="margin-top:15px;">
                                <h4><i class="fas fa-user-friends"></i> Equipe do Projeto:</h4>
                                <div class="project-card-members">${tags}</div>
                            </div>
                        </div>
                        <div class="project-card-footer">
                            <span style="font-size:0.8rem;color:var(--text-muted);font-weight:500;">
                                <i class="fas fa-users-viewfinder"></i> ${membros.length} integrante(s)
                            </span>
                            <a href="/projeto-detalhes.html?id=${p.id}" class="btn-view-project">
                                <i class="fas fa-external-link-alt"></i> Gerenciar Equipe
                            </a>
                        </div>
                    </div>`;
            }).join("")
            : `<div class="empty-projects-state"><i class="fas fa-folder-open"></i><p>Nenhum projeto ativo neste laboratório.</p></div>`;

        const formulario = podeGerenciar ? `
            <div class="add-project-box">
                <h3><i class="fas fa-plus-circle"></i> Adicionar Novo Projeto</h3>
                <form class="add-project-form" id="form-novo-projeto">
                    <div class="form-group">
                        <label for="nomeProjeto">Título do Projeto</label>
                        <input type="text" id="nomeProjeto" required placeholder="Ex: Inteligência Artificial Aplicada">
                    </div>
                    <div class="form-group">
                        <label for="descProjeto">Descrição do Projeto</label>
                        <textarea id="descProjeto" placeholder="Breve resumo dos objetivos do projeto..."></textarea>
                    </div>
                    <button type="submit" class="btn-project-submit"><i class="fas fa-check"></i> Adicionar Projeto</button>
                </form>
            </div>` : "";

        document.getElementById("projetos").innerHTML = `<div class="projects-grid">${cartoes}</div>${formulario}`;

        document.querySelectorAll("[data-desativar]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!confirm("Deseja desativar este projeto?")) return;
            try {
                await Api.delete(`/projetos/${a.dataset.desativar}`);
                window.location.reload();
            } catch (erro) {
                Util.aviso(erro.message);
            }
        }));

        const form = document.getElementById("form-novo-projeto");
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                try {
                    await Api.post("/projetos", {
                        nome: document.getElementById("nomeProjeto").value.trim(),
                        descricao: document.getElementById("descProjeto").value.trim(),
                        laboratorioId: Number(id)
                    });
                    window.location.reload();
                } catch (erro) {
                    Util.aviso(erro.message);
                }
            });
        }
    }

    function montarEquipe() {
        const linhas = bolsistas.length
            ? bolsistas.map(b => {
                const seus = projetosPorBolsista.get(b.id) || [];
                const tags = seus.length
                    ? seus.map(p => `<span class="project-tag">${Util.escapar(p.nome)}</span>`).join(", ")
                    : `<span class="no-projects">Nenhum</span>`;
                return `
                    <tr>
                        <td><strong>${Util.escapar(b.nome)}</strong></td>
                        <td>${Util.escapar(b.curso)}</td>
                        <td><span class="badge badge-cargo">${Util.escapar(b.cargo || "Bolsista")}</span></td>
                        <td>${tags}</td>
                        <td>${Util.escapar(b.email)}</td>
                        <td>${Util.escapar(b.matricula)}</td>
                    </tr>`;
            }).join("")
            : `<tr><td colspan="6" class="empty-state">Nenhum bolsista vinculado a este laboratório.</td></tr>`;

        document.getElementById("equipe").innerHTML = `
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
            abas.forEach(a => a.classList.remove("active"));
            aba.classList.add("active");
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
