(async () => {
    await Sessao.iniciar();

    if (!Sessao.gerencia()) {
        window.location.href = "/dashboard.html";
        return;
    }

    const id = Util.parametro("id");
    const edicao = Boolean(id);
    const labPreSelecionado = Util.parametro("labId");
    const campo = (n) => document.getElementById(n);

    if (edicao) {
        document.getElementById("titulo").textContent = "Editar Projeto";
        document.getElementById("rotulo-salvar").textContent = "Salvar Alterações";
    }

    let labs = [];
    try {
        labs = await Api.get("/laboratorios");
    } catch (e) {
        Util.aviso("Erro ao carregar lista de laboratórios.");
    }

    campo("laboratorioId").innerHTML =
        `<option value="">Selecione o laboratório...</option>` +
        labs.map(l => `<option value="${l.id}">${Util.escapar(l.nome)}</option>`).join("");

    if (edicao) {
        try {
            const p = await Api.get(`/projetos/${id}`);
            campo("nome").value = p.nome || "";
            campo("descricao").value = p.descricao || "";
            campo("laboratorioId").value = p.laboratorioId || "";
        } catch (e) {
            Util.aviso(e.message);
            return;
        }
    } else if (labPreSelecionado) {
        campo("laboratorioId").value = labPreSelecionado;
    }

    document.getElementById("formProjeto").addEventListener("submit", async (e) => {
        e.preventDefault();
        Util.limpaAviso();

        if (campo("nome").value.trim().length < 3) {
            Util.aviso("O nome do projeto deve ter pelo menos 3 caracteres.");
            return;
        }

        const corpo = {
            nome: campo("nome").value.trim(),
            descricao: campo("descricao").value.trim(),
            laboratorioId: campo("laboratorioId").value ? Number(campo("laboratorioId").value) : null
        };

        const btn = document.getElementById("btn-salvar-proj");
        if (btn) {
            btn.classList.add("is-loading");
            btn.disabled = true;
        }

        try {
            if (edicao) {
                await Api.put(`/projetos/${id}`, corpo);
            } else {
                await Api.post("/projetos", corpo);
            }
            window.location.href = "/projetos.html";
        } catch (erro) {
            Util.aviso(erro.message);
        } finally {
            if (btn) {
                btn.classList.remove("is-loading");
                btn.disabled = false;
            }
        }
    });
})();
