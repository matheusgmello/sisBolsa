(async () => {
    const usuario = await Sessao.iniciar();
    Util.configurarModais();

    const filtro = Util.parametro("bolsistaId") || "";
    let pagina = Number(Util.parametro("pagina")) || 1;
    let listaFrequenciasAtuais = [];

    const campo = (n) => document.getElementById(n);

    /* bolsista ve o proprio resumo de horas; admin e professor nao tem "as proprias horas" */
    async function carregarResumo() {
        if (!Sessao.ehBolsista()) return;
        try {
            const r = await Api.get("/frequencias/resumo");
            const alvo = document.getElementById("resumo");
            alvo.hidden = false;
            alvo.innerHTML = `
                <div class="stat-card">
                    <h3>Horas Trabalhadas no Mês</h3>
                    <div class="value">${Util.numero(r.horasMes)} hrs</div>
                    <p class="stat-desc">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>Mês Corrente</span>
                    </p>
                </div>
                <div class="stat-card">
                    <h3>Total Acumulado de Horas</h3>
                    <div class="value">${Util.numero(r.horasTotal)} hrs</div>
                    <p class="stat-desc">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>Histórico Geral</span>
                    </p>
                </div>`;
        } catch (e) {
            Util.aviso(e.message);
        }
    }

    await carregarResumo();

    if (Sessao.gerencia()) {
        try {
            const dados = await Api.get("/usuarios?tipo=BOLSISTA&tamanho=200");
            const opcoes = dados.itens.map(b => `<option value="${b.id}">${Util.escapar(b.nome)}</option>`).join("");
            campo("bolsistaSelect").innerHTML = `<option value="">Selecione o bolsista...</option>${opcoes}`;
            campo("filtro-bolsista").innerHTML = `<option value="">Todos os Bolsistas</option>${opcoes}`;
            campo("filtro-bolsista").value = filtro;
            document.getElementById("form-filtro").hidden = false;
        } catch (e) {
            Util.aviso(e.message);
        }
    }

    if (filtro) {
        document.getElementById("btn-exportar").href = `/api/frequencias/exportar?bolsistaId=${filtro}`;
    }

    document.getElementById("form-filtro").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = campo("filtro-bolsista").value;
        window.location.href = v ? `/frequencia.html?bolsistaId=${v}` : "/frequencia.html";
    });

    document.getElementById("btn-nova-frequencia").addEventListener("click", () => {
        abrirModalCriacao();
    });

    await carregar();
    configurarFormFrequencia();

    async function carregar() {
        const corpo = document.getElementById("corpo");
        corpo.innerHTML = `
            <tr class="skeleton-row"><td colspan="5"><div class="skeleton-box" style="height: 24px; margin: 4px 0;"></div></td></tr>
            <tr class="skeleton-row"><td colspan="5"><div class="skeleton-box" style="height: 24px; margin: 4px 0;"></div></td></tr>
            <tr class="skeleton-row"><td colspan="5"><div class="skeleton-box" style="height: 24px; margin: 4px 0;"></div></td></tr>`;

        const q = new URLSearchParams({ pagina });
        if (filtro) q.set("bolsistaId", filtro);

        let dados;
        try {
            dados = await Api.get(`/frequencias?${q}`);
            listaFrequenciasAtuais = dados.itens;
        } catch (e) {
            Util.aviso(e.message);
            corpo.innerHTML = `<tr><td colspan="5" class="empty-state-cell">Erro ao carregar registros.</td></tr>`;
            return;
        }

        corpo.innerHTML = dados.itens.length
            ? dados.itens.map(linha).join("")
            : `<tr>
                <td colspan="5" class="empty-state-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Nenhum registro de frequência encontrado.</span>
                </td>
               </tr>`;

        corpo.querySelectorAll("[data-editar]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const f = listaFrequenciasAtuais.find(x => x.id === Number(btn.dataset.editar));
                if (f) abrirModalEdicao(f);
            });
        });

        corpo.querySelectorAll("[data-excluir]").forEach(a => a.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!confirm("Deseja realmente excluir este registro de frequência?")) return;
            try {
                await Api.delete(`/frequencias/${a.dataset.excluir}`);
                Util.aviso("Registro excluído com sucesso.", "sucesso");
                await carregarResumo();
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
        return `
            <tr>
                <td><strong>${Util.escapar(f.nomeBolsista)}</strong></td>
                <td>${Util.data(f.data)}</td>
                <td><strong>${Util.numero(f.horasTrabalhadas)}h</strong></td>
                <td>${Util.escapar(f.descricao)}</td>
                <td>
                    <div class="actions-cell">
                        ${podeEditar ? `
                            <a href="#" class="btn-icon btn-edit" data-editar="${f.id}" title="Editar registro" aria-label="Editar registro de ${Util.escapar(f.nomeBolsista)} do dia ${Util.data(f.data)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </a>` : ""}
                        ${podeExcluir ? `
                            <a href="#" class="btn-icon btn-delete" data-excluir="${f.id}" title="Excluir registro" aria-label="Excluir registro de ${Util.escapar(f.nomeBolsista)} do dia ${Util.data(f.data)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </a>` : ""}
                    </div>
                </td>
            </tr>`;
    }

    function abrirModalCriacao() {
        document.getElementById("frequencia-id").value = "";
        document.getElementById("data").value = new Date().toISOString().slice(0, 10);
        document.getElementById("horas").value = "";
        document.getElementById("descricao").value = "";
        document.getElementById("label-modal-freq").textContent = "Novo Registro de Horas";
        document.getElementById("rotulo-salvar").textContent = "Registrar Horas";

        if (Sessao.gerencia()) {
            campo("bolsistaSelect").hidden = false;
            campo("bolsistaSelect").required = true;
            campo("bolsistaSelect").value = "";
            campo("bolsistaFixo").hidden = true;
        } else {
            campo("bolsistaSelect").hidden = true;
            campo("bolsistaSelect").required = false;
            campo("bolsistaFixo").hidden = false;
            campo("bolsistaFixo").value = usuario.nome;
        }

        Util.abrirModal("modal-frequencia");
    }

    function abrirModalEdicao(f) {
        document.getElementById("frequencia-id").value = f.id;
        document.getElementById("data").value = f.data;
        document.getElementById("horas").value = f.horasTrabalhadas;
        document.getElementById("descricao").value = f.descricao || "";
        document.getElementById("label-modal-freq").textContent = `Editar Registro — ${f.nomeBolsista}`;
        document.getElementById("rotulo-salvar").textContent = "Salvar Alterações";

        campo("bolsistaSelect").hidden = true;
        campo("bolsistaSelect").required = false;
        campo("bolsistaFixo").hidden = false;
        campo("bolsistaFixo").value = f.nomeBolsista;

        Util.abrirModal("modal-frequencia");
    }

    function configurarFormFrequencia() {
        const formFreq = document.getElementById("form-frequencia");
        const btnSalvar = document.getElementById("btn-salvar-freq");

        formFreq.addEventListener("submit", async (e) => {
            e.preventDefault();
            Util.limpaAviso();

            const idFreq = document.getElementById("frequencia-id").value;
            const horas = Number(campo("horas").value);
            if (!campo("data").value) {
                Util.aviso("Informe a data.");
                return;
            }
            if (!horas || horas <= 0 || horas > 24) {
                Util.aviso("Horas trabalhadas precisa estar entre 0.5 e 24.");
                return;
            }
            if (!campo("descricao").value.trim()) {
                Util.aviso("Descreva as atividades realizadas.");
                return;
            }

            const corpo = {
                bolsistaId: Sessao.gerencia() && !idFreq ? Number(campo("bolsistaSelect").value) : null,
                data: campo("data").value,
                horasTrabalhadas: horas,
                descricao: campo("descricao").value.trim()
            };

            btnSalvar.classList.add("is-loading");
            btnSalvar.disabled = true;

            try {
                if (idFreq) {
                    await Api.put(`/frequencias/${idFreq}`, corpo);
                    Util.fecharModal("modal-frequencia");
                    Util.aviso("Frequência atualizada com sucesso!", "sucesso");
                } else {
                    await Api.post("/frequencias", corpo);
                    Util.fecharModal("modal-frequencia");
                    Util.aviso("Frequência registrada com sucesso!", "sucesso");
                }
                await carregarResumo();
                await carregar();
            } catch (erro) {
                Util.aviso(erro.message);
            } finally {
                btnSalvar.classList.remove("is-loading");
                btnSalvar.disabled = false;
            }
        });
    }

    function montarPaginacao(dados) {
        const alvo = document.getElementById("paginacao");
        if (dados.totalPaginas <= 1) {
            alvo.innerHTML = "";
            return;
        }
        const url = (p) => {
            const q = new URLSearchParams({ pagina: p });
            if (filtro) q.set("bolsistaId", filtro);
            return `/frequencia.html?${q}`;
        };
        alvo.innerHTML = `
            ${dados.pagina > 1 ? `
                <a href="${url(dados.pagina - 1)}" class="btn-pagination" aria-label="Página anterior">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>Anterior</span>
                </a>` : ""}
            <span style="font-size:0.875rem;color:var(--text-secondary);">Página <strong>${dados.pagina}</strong> de ${dados.totalPaginas}</span>
            ${dados.pagina < dados.totalPaginas ? `
                <a href="${url(dados.pagina + 1)}" class="btn-pagination" aria-label="Próxima página">
                    <span>Próxima</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                </a>` : ""}`;
    }
})();
