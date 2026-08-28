/*
 * cria/edita o laboratorio. O gerenciamento de projetos e equipe e centralizado em laboratorio-detalhes.html
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

        const btnLab = document.getElementById("btn-salvar-lab");
        if (btnLab) {
            btnLab.classList.add("is-loading");
            btnLab.disabled = true;
        }

        try {
            if (edicao) {
                await Api.put(`/laboratorios/${id}`, corpo);
                Util.aviso("Laboratório salvo com sucesso.", "sucesso");
                setTimeout(() => {
                    window.location.href = `/laboratorio-detalhes.html?id=${id}`;
                }, 1000);
            } else {
                const criado = await Api.post("/laboratorios", corpo);
                window.location.href = criado && criado.id ? `/laboratorio-detalhes.html?id=${criado.id}` : "/laboratorios.html";
            }
        } catch (erro) {
            Util.aviso(erro.message);
            if (btnLab) {
                btnLab.classList.remove("is-loading");
                btnLab.disabled = false;
            }
        }
    });
})();
