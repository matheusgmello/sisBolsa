(async () => {
    const usuario = await Sessao.iniciar();

    const id = Util.parametro("id");
    if (!id) {
        window.location.href = "/projetos.html";
        return;
    }

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

    document.getElementById("info").innerHTML = `
        <div class="info-item">
            <span class="info-label">Laboratório Responsável</span>
            <span class="info-value">
                <a href="/laboratorio-detalhes.html?id=${projeto.laboratorioId}" style="text-decoration:none;color:var(--primary-color);">
                    <i class="fas fa-flask"></i> ${Util.escapar(projeto.nomeLaboratorio)}
                </a>
            </span>
        </div>
        <div class="info-item">
            <span class="info-label">Professor Coordenador / Gestor</span>
            <span class="info-value">
                <i class="fas fa-user-tie" style="color:#64748b;margin-right:4px;"></i>
                ${Util.escapar(lab.coordenador || "Sem coordenador")}
            </span>
        </div>`;

    await montar();

    async function montar() {
        membros = await Api.get(`/projetos/${id}/membros`);

        const colunas = podeGerenciar ? 5 : 4;
        const linhas = membros.length
            ? membros.map(m => `
                <tr>
                    <td><strong>${Util.escapar(m.nome)}</strong></td>
                    <td>${Util.escapar(m.curso)}</td>
                    <td><span class="badge badge-cargo" style="background-color:#eff6ff;color:#1d4ed8;border:1px solid #dbeafe;">${Util.escapar(m.cargo || "Bolsista")}</span></td>
                    <td>${Util.escapar(m.email)}</td>
                    ${podeGerenciar ? `<td><a href="#" class="badge-unlink" title="Remover bolsista deste projeto" data-remover="${m.id}" data-nome="${Util.escapar(m.nome)}"><i class="fas fa-user-minus"></i> Remover</a></td>` : ""}
                </tr>`).join("")
            : `<tr><td colspan="${colunas}" class="empty-state">Nenhum bolsista vinculado a este projeto no momento.</td></tr>`;

        let painel = "";
        if (podeGerenciar) {
            /* so bolsistas do lab do projeto podem entrar, e quem ja e membro sai da lista */
            const doLab = await Api.get(`/laboratorios/${projeto.laboratorioId}/bolsistas`);
            const jaMembro = new Set(membros.map(m => m.id));
            const disponiveis = doLab.filter(b => !jaMembro.has(b.id));

            painel = `
                <div class="card-management">
                    <h3 style="margin-top:0;font-family:'Outfit',sans-serif;display:flex;align-items:center;gap:8px;font-size:1.15rem;">
                        <i class="fas fa-user-plus" style="color:var(--primary-color);"></i> Vincular Bolsista
                    </h3>
                    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:15px;line-height:1.4;">
                        Selecione um bolsista ativo do laboratório <strong>${Util.escapar(projeto.nomeLaboratorio)}</strong> para integrá-lo a este projeto.
                    </p>
                    <form id="form-vincular">
                        <div class="form-group" style="margin-bottom:15px;">
                            <select id="bolsistaId" required
                                    style="width:100%;padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border-grid);background-color:var(--surface-color);">
                                <option value="">Selecione um bolsista...</option>
                                ${disponiveis.map(b => `<option value="${b.id}">${Util.escapar(b.nome)} (${Util.escapar(b.cargo || "Bolsista")})</option>`).join("")}
                            </select>
                        </div>
                        <button type="submit" class="btn btn-submit"
                                style="width:100%;justify-content:center;display:inline-flex;gap:8px;font-size:0.85rem;padding:10px;">
                            <i class="fas fa-plus"></i> Vincular ao Projeto
                        </button>
                    </form>
                </div>`;
        }

        document.getElementById("detalhes").innerHTML = `
            <div>
                <div class="desc-box">
                    <span class="info-label">Descrição Detalhada do Projeto</span>
                    <p>${Util.escapar(projeto.descricao || "Nenhuma descrição detalhada foi cadastrada para este projeto.")}</p>
                </div>
                <h2><i class="fas fa-users-viewfinder"></i> Bolsistas Vinculados a este Projeto</h2>
                <div class="table-container">
                    <table>
                        <thead><tr>
                            <th>Nome</th><th>Curso</th><th>Cargo</th><th>E-mail</th>
                            ${podeGerenciar ? "<th>Desvincular</th>" : ""}
                        </tr></thead>
                        <tbody>${linhas}</tbody>
                    </table>
                </div>
            </div>
            ${painel}`;

        document.querySelectorAll("[data-remover]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!confirm(`Remover ${a.dataset.nome} do projeto?`)) return;
            try {
                await Api.delete(`/projetos/${id}/membros/${a.dataset.remover}`);
                Util.aviso("Bolsista removido do projeto.", "sucesso");
                await montar();
            } catch (erro) {
                Util.aviso(erro.message);
            }
        }));

        const form = document.getElementById("form-vincular");
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const bolsistaId = document.getElementById("bolsistaId").value;
                if (!bolsistaId) return;
                try {
                    await Api.post(`/projetos/${id}/membros/${bolsistaId}`);
                    Util.aviso("Bolsista vinculado ao projeto.", "sucesso");
                    await montar();
                } catch (erro) {
                    Util.aviso(erro.message);
                }
            });
        }
    }
})();
