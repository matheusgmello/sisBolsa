(async () => {
    const usuario = await Sessao.iniciar();

    const filtro = Util.parametro("bolsistaId") || "";
    const editandoId = Util.parametro("editar");
    let pagina = Number(Util.parametro("pagina")) || 1;
    let emEdicao = null;

    const campo = (n) => document.getElementById(n);

    /* bolsista ve o proprio resumo de horas; admin e professor nao tem "as proprias horas" */
    if (Sessao.ehBolsista()) {
        const r = await Api.get("/frequencias/resumo");
        const alvo = document.getElementById("resumo");
        alvo.hidden = false;
        alvo.innerHTML = `
            <div class="stat-card" style="flex:1;min-width:200px;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.05);border-left:4px solid var(--primary-color);">
                <h3 style="font-size:0.9rem;color:#666;margin-bottom:5px;">Horas Trabalhadas no Mês</h3>
                <div class="value" style="font-size:2rem;font-weight:bold;color:var(--primary-color);">${Util.numero(r.horasMes)} hrs</div>
                <p style="font-size:0.8rem;color:#999;margin-top:5px;"><i class="fas fa-calendar-alt"></i> Mês Corrente</p>
            </div>
            <div class="stat-card" style="flex:1;min-width:200px;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.05);border-left:4px solid #2ecc71;">
                <h3 style="font-size:0.9rem;color:#666;margin-bottom:5px;">Total Acumulado de Horas</h3>
                <div class="value" style="font-size:2rem;font-weight:bold;color:#2ecc71;">${Util.numero(r.horasTotal)} hrs</div>
                <p style="font-size:0.8rem;color:#999;margin-top:5px;"><i class="fas fa-history"></i> Histórico Geral</p>
            </div>`;
    }

    if (Sessao.gerencia()) {
        const dados = await Api.get("/usuarios?tipo=BOLSISTA&tamanho=200");
        const opcoes = dados.itens.map(b => `<option value="${b.id}">${Util.escapar(b.nome)}</option>`).join("");
        campo("bolsistaSelect").innerHTML = `<option value="">Selecione o bolsista...</option>${opcoes}`;
        campo("bolsistaSelect").hidden = false;
        campo("filtro-bolsista").innerHTML = `<option value="">Todos os Bolsistas</option>${opcoes}`;
        campo("filtro-bolsista").value = filtro;
        document.getElementById("form-filtro").hidden = false;
    } else {
        campo("bolsistaFixo").hidden = false;
        campo("bolsistaFixo").value = usuario.nome;
        campo("bolsistaSelect").required = false;
    }

    if (filtro) {
        document.getElementById("btn-exportar").href = `/api/frequencias/exportar?bolsistaId=${filtro}`;
    }

    document.getElementById("form-filtro").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = campo("filtro-bolsista").value;
        window.location.href = v ? `/frequencia.html?bolsistaId=${v}` : "/frequencia.html";
    });

    if (editandoId) {
        try {
            emEdicao = await Api.get(`/frequencias/${editandoId}`);
            campo("data").value = emEdicao.data;
            campo("horas").value = emEdicao.horasTrabalhadas;
            campo("descricao").value = emEdicao.descricao || "";
            document.getElementById("titulo-form").innerHTML =
                `Editar Registro — <span class="nome-bolsista-edicao">${Util.escapar(emEdicao.nomeBolsista)}</span>`;
            document.getElementById("rotulo-salvar").textContent = "Salvar Alterações";
            document.getElementById("cancelar").hidden = false;
            /* na edicao o bolsista nao muda: mostra o nome e tira o select do caminho */
            campo("bolsistaSelect").hidden = true;
            campo("bolsistaSelect").required = false;
            campo("bolsistaFixo").hidden = false;
            campo("bolsistaFixo").value = emEdicao.nomeBolsista;
        } catch (e) {
            Util.aviso(e.message);
        }
    }

    await carregar();

    document.getElementById("form-frequencia").addEventListener("submit", async (e) => {
        e.preventDefault();
        Util.limpaAviso();

        const horas = Number(campo("horas").value);
        if (!campo("data").value) {
            Util.aviso("Informe a data.");
            return;
        }
        if (!horas || horas <= 0 || horas > 24) {
            Util.aviso("Horas trabalhadas precisa estar entre 0 e 24.");
            return;
        }
        if (!campo("descricao").value.trim()) {
            Util.aviso("Descreva as atividades realizadas.");
            return;
        }

        const corpo = {
            bolsistaId: Sessao.gerencia() && !emEdicao ? Number(campo("bolsistaSelect").value) : null,
            data: campo("data").value,
            horasTrabalhadas: horas,
            descricao: campo("descricao").value.trim()
        };

        try {
            if (emEdicao) {
                await Api.put(`/frequencias/${emEdicao.id}`, corpo);
            } else {
                await Api.post("/frequencias", corpo);
            }
            window.location.href = filtro ? `/frequencia.html?bolsistaId=${filtro}` : "/frequencia.html";
        } catch (erro) {
            Util.aviso(erro.message);
        }
    });

    async function carregar() {
        const q = new URLSearchParams({ pagina });
        if (filtro) q.set("bolsistaId", filtro);

        let dados;
        try {
            dados = await Api.get(`/frequencias?${q}`);
        } catch (e) {
            Util.aviso(e.message);
            return;
        }

        const corpo = document.getElementById("corpo");
        corpo.innerHTML = dados.itens.length
            ? dados.itens.map(linha).join("")
            : `<tr><td colspan="5" class="empty-state">Nenhum registro encontrado.</td></tr>`;

        corpo.querySelectorAll("[data-excluir]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!confirm("Excluir registro?")) return;
            try {
                await Api.delete(`/frequencias/${a.dataset.excluir}`);
                Util.aviso("Registro excluído.", "sucesso");
                await carregar();
            } catch (erro) {
                Util.aviso(erro.message);
            }
        }));

        montarPaginacao(dados);
    }

    function linha(f) {
        const podeEditar = Sessao.gerencia() || f.bolsistaId === usuario.id;
        const podeExcluir = Sessao.gerencia();
        const q = filtro ? `&bolsistaId=${filtro}` : "";
        return `
            <tr>
                <td>${Util.escapar(f.nomeBolsista)}</td>
                <td>${Util.data(f.data)}</td>
                <td><strong>${Util.numero(f.horasTrabalhadas)}h</strong></td>
                <td>${Util.escapar(f.descricao)}</td>
                <td>
                    ${podeEditar ? `<a href="/frequencia.html?editar=${f.id}${q}" class="action-edit"><i class="fas fa-pencil-alt"></i></a>` : ""}
                    ${podeExcluir ? `<a href="#" class="action-delete" data-excluir="${f.id}"><i class="fas fa-trash"></i></a>` : ""}
                </td>
            </tr>`;
    }

    function montarPaginacao(dados) {
        const alvo = document.getElementById("paginacao");
        if (dados.totalPaginas <= 1) {
            alvo.innerHTML = "";
            return;
        }
        const estilo = "padding:8px 16px;background-color:var(--primary-color);color:white;border-radius:4px;text-decoration:none;font-size:0.9rem;font-weight:bold;";
        const url = (p) => {
            const q = new URLSearchParams({ pagina: p });
            if (filtro) q.set("bolsistaId", filtro);
            return `/frequencia.html?${q}`;
        };
        alvo.innerHTML = `
            ${dados.pagina > 1 ? `<a href="${url(dados.pagina - 1)}" class="btn-pagination" style="${estilo}"><i class="fas fa-chevron-left"></i> Anterior</a>` : ""}
            <span style="font-size:0.9rem;color:#555;">Página <strong>${dados.pagina}</strong> de ${dados.totalPaginas}</span>
            ${dados.pagina < dados.totalPaginas ? `<a href="${url(dados.pagina + 1)}" class="btn-pagination" style="${estilo}">Próxima <i class="fas fa-chevron-right"></i></a>` : ""}`;
    }
})();
