/*
 * cria/edita o laboratorio e, na edicao, gerencia os projetos dele na mesma tela.
 */
(async () => {
    await Sessao.iniciar();

    const id = Util.parametro("id");
    const edicao = Boolean(id);
    const campo = (n) => document.getElementById(n);

    if (!Sessao.gerencia()) {
        window.location.href = "/dashboard.html";
        return;
    }

    document.getElementById("titulo").textContent =
        `${edicao ? "Editar" : "Cadastrar Novo"} Laboratório`;

    /* a lista de coordenadores so existe para admin, que e quem enxerga professores */
    if (Sessao.ehAdmin()) {
        const professores = await Api.get("/usuarios?tipo=PROFESSOR&pagina=1");
        campo("coordenadorId").innerHTML =
            `<option value="">Selecione um professor...</option>` +
            professores.itens.map(p => `<option value="${p.id}">${Util.escapar(p.nome)}</option>`).join("");
    }

    let projetoEditando = null;

    if (edicao) {
        try {
            const lab = await Api.get(`/laboratorios/${id}`);
            campo("nome").value = lab.nome || "";
            campo("areaPesquisa").value = lab.areaPesquisa || "";
            campo("capacidade").value = lab.capacidade;
            campo("status").value = lab.status || "";
            if (lab.coordenadorId) campo("coordenadorId").value = lab.coordenadorId;
        } catch (e) {
            Util.aviso(e.message);
            return;
        }
        document.getElementById("secao-projetos").hidden = false;
        await carregarProjetos();
    }

    document.getElementById("formLab").addEventListener("submit", async (e) => {
        e.preventDefault();
        Util.limpaAviso();

        if (campo("nome").value.trim().length < 3) {
            Util.aviso("O nome do laboratório deve ter pelo menos 3 caracteres.");
            return;
        }

        const corpo = {
            nome: campo("nome").value.trim(),
            areaPesquisa: campo("areaPesquisa").value.trim(),
            status: campo("status").value,
            capacidade: Number(campo("capacidade").value),
            coordenadorId: campo("coordenadorId").value ? Number(campo("coordenadorId").value) : null
        };

        try {
            if (edicao) {
                await Api.put(`/laboratorios/${id}`, corpo);
                Util.aviso("Laboratório salvo com sucesso.", "sucesso");
            } else {
                await Api.post("/laboratorios", corpo);
                window.location.href = "/laboratorios.html";
            }
        } catch (erro) {
            Util.aviso(erro.message);
        }
    });

    async function carregarProjetos() {
        const projetos = await Api.get(`/laboratorios/${id}/projetos`);
        const grid = document.getElementById("grid-projetos");

        grid.innerHTML = projetos.length
            ? projetos.map(p => `
                <div class="projeto-card">
                    <div class="projeto-info">
                        <h4>${Util.escapar(p.nome)}</h4>
                        <p>${Util.escapar(p.descricao || "Sem descrição cadastrada.")}</p>
                    </div>
                    <div class="projeto-acoes">
                        <a href="#" class="btn-mini btn-mini-edit" data-editar="${p.id}"><i class="fas fa-edit"></i> Editar</a>
                        <a href="#" class="btn-mini btn-mini-delete" data-excluir="${p.id}"><i class="fas fa-trash"></i> Excluir</a>
                    </div>
                </div>`).join("")
            : `<div class="form-group-full" style="grid-column:span 2;text-align:center;color:#777;padding:20px;">
                   <p><i class="fas fa-folder-open"></i> Nenhum projeto cadastrado neste laboratório.</p>
               </div>`;

        grid.querySelectorAll("[data-editar]").forEach(a => a.addEventListener("click", (e) => {
            e.preventDefault();
            const p = projetos.find(x => x.id === Number(a.dataset.editar));
            entrarModoEdicao(p);
        }));

        grid.querySelectorAll("[data-excluir]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!confirm("Deseja realmente desativar este projeto?")) return;
            try {
                await Api.delete(`/projetos/${a.dataset.excluir}`);
                await carregarProjetos();
                Util.aviso("Projeto desativado.", "sucesso");
            } catch (erro) {
                Util.aviso(erro.message);
            }
        }));
    }

    function entrarModoEdicao(projeto) {
        projetoEditando = projeto;
        campo("nomeProj").value = projeto.nome;
        campo("descProj").value = projeto.descricao || "";
        document.getElementById("titulo-projeto").textContent = "Editar Projeto";
        document.getElementById("rotulo-salvar-projeto").textContent = "Salvar Alterações";
        document.getElementById("icone-projeto").className = "fas fa-edit";
        document.getElementById("cancelar-projeto").hidden = false;
    }

    function sairModoEdicao() {
        projetoEditando = null;
        campo("nomeProj").value = "";
        campo("descProj").value = "";
        document.getElementById("titulo-projeto").textContent = "Adicionar Novo Projeto";
        document.getElementById("rotulo-salvar-projeto").textContent = "Cadastrar Projeto";
        document.getElementById("icone-projeto").className = "fas fa-plus-circle";
        document.getElementById("cancelar-projeto").hidden = true;
    }

    document.getElementById("cancelar-projeto").addEventListener("click", (e) => {
        e.preventDefault();
        sairModoEdicao();
    });

    document.getElementById("form-projeto").addEventListener("submit", async (e) => {
        e.preventDefault();
        Util.limpaAviso();

        if (campo("nomeProj").value.trim().length < 3) {
            Util.aviso("O nome do projeto deve ter pelo menos 3 caracteres.");
            return;
        }

        const corpo = {
            nome: campo("nomeProj").value.trim(),
            descricao: campo("descProj").value.trim(),
            laboratorioId: Number(id)
        };

        try {
            if (projetoEditando) {
                await Api.put(`/projetos/${projetoEditando.id}`, corpo);
            } else {
                await Api.post("/projetos", corpo);
            }
            sairModoEdicao();
            await carregarProjetos();
            Util.aviso("Projeto salvo com sucesso.", "sucesso");
        } catch (erro) {
            Util.aviso(erro.message);
        }
    });
})();
