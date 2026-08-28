(async () => {
    const usuario = await Sessao.iniciar();
    Util.configurarModais();

    if (Sessao.ehBolsista()) {
        window.location.href = "/dashboard.html";
        return;
    }

    const rotulo = Sessao.ehAdmin() ? "Usuário" : "Bolsista";
    document.getElementById("titulo").textContent = `Gerenciar ${rotulo}s`;
    document.getElementById("rotulo-novo").textContent = `Novo ${rotulo}`;

    /* so admin enxerga professores e admins, entao so ele ganha os filtros de tipo */
    if (Sessao.ehAdmin()) {
        document.getElementById("filtros").hidden = false;
    }

    const filtroTipo = Util.parametro("tipo") || "";
    const buscaNome = Util.parametro("buscaNome") || "";
    const buscaCurso = Util.parametro("buscaCurso") || "";
    document.getElementById("busca-nome").value = buscaNome;
    document.getElementById("busca-curso").value = buscaCurso;
    document.querySelectorAll(".pill-btn").forEach(p => {
        if (p.dataset.tipo === filtroTipo) p.classList.add("active");
    });

    const formBusca = document.getElementById("form-busca");
    if (formBusca) {
        formBusca.addEventListener("submit", e => {
            e.preventDefault();
            const query = new URLSearchParams();
            const nomeVal = document.getElementById("busca-nome").value.trim();
            const cursoVal = document.getElementById("busca-curso").value.trim();
            if (filtroTipo) query.set("tipo", filtroTipo);
            if (nomeVal) query.set("buscaNome", nomeVal);
            if (cursoVal) query.set("buscaCurso", cursoVal);
            window.location.href = `/usuarios.html?${query.toString()}`;
        });
    }

    /* Carrega listas auxiliares para o modal */
    let labs = [];
    let cargos = [];
    try {
        [labs, cargos] = await Promise.all([
            Api.get("/laboratorios"),
            Api.get("/usuarios/cargos")
        ]);
        const selectLab = document.getElementById("modal-lab");
        selectLab.innerHTML = `<option value="">Selecione um laboratório...</option>` +
            labs.map(l => `<option value="${l.id}">${Util.escapar(l.nome)}</option>`).join("");

        const selectCargo = document.getElementById("modal-cargo");
        selectCargo.innerHTML = `<option value="">Selecione um cargo...</option>` +
            cargos.map(c => `<option value="${c.valor}">${Util.escapar(c.descricao)}</option>`).join("");
    } catch {
        /* se falhar prossegue sem quebrar a listagem */
    }

    let paginaAtual = Number(Util.parametro("pagina")) || 1;
    await carregar(paginaAtual);
    configurarModalUsuario();

    async function carregar(pagina) {
        paginaAtual = pagina;
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

        const query = new URLSearchParams({ pagina });
        if (filtroTipo) query.set("tipo", filtroTipo);
        if (buscaNome) query.set("buscaNome", buscaNome);
        if (buscaCurso) query.set("buscaCurso", buscaCurso);

        let dados;
        try {
            dados = await Api.get(`/usuarios?${query}`);
        } catch (e) {
            Util.aviso(e.message);
            corpo.innerHTML = `<tr><td colspan="6" class="empty-state-cell">Erro ao carregar usuários.</td></tr>`;
            return;
        }

        corpo.innerHTML = dados.itens.length
            ? dados.itens.map(linha).join("")
            : `<tr>
                <td colspan="6" class="empty-state-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    <p style="margin: 0; font-weight: 500;">Nenhum usuário encontrado com os filtros aplicados.</p>
                </td>
               </tr>`;

        corpo.querySelectorAll("[data-editar]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.preventDefault();
                const id = btn.dataset.editar;
                const tipo = btn.dataset.tipo;
                try {
                    const u = await Api.get(`/usuarios/${id}?tipo=${tipo}`);
                    abrirModalEdicao(u);
                } catch (erro) {
                    Util.aviso(erro.message);
                }
            });
        });

        corpo.querySelectorAll("[data-excluir]").forEach(botao => {
            botao.addEventListener("click", async (e) => {
                e.preventDefault();
                const nomeUsuario = botao.dataset.nome || "este usuário";
                if (!confirm(`Deseja realmente desativar o cadastro de ${nomeUsuario}?`)) return;
                try {
                    await Api.delete(`/usuarios/${botao.dataset.excluir}?tipo=${botao.dataset.tipo}`);
                    Util.aviso("Usuário desativado com sucesso.", "sucesso");
                    await carregar(pagina);
                } catch (erro) {
                    Util.aviso(erro.message);
                }
            });
        });

        montarPaginacao(dados, pagina);
    }

    function linha(u) {
        const ehPessoaComCurso = u.tipoUsuario === "BOLSISTA" || u.tipoUsuario === "ADMIN";
        const classeBadge = u.tipoUsuario === "ADMIN" ? "badge-admin"
                          : u.tipoUsuario === "PROFESSOR" ? "badge-professor" : "badge-bolsista";

        const podeEditar = Sessao.gerencia() || u.id === usuario.id;
        const podeExcluir = Sessao.gerencia() && u.id !== usuario.id;

        return `
            <tr>
                <td><strong>${Util.escapar(u.nome)}</strong></td>
                <td>${ehPessoaComCurso ? Util.escapar(u.curso || "---") : "---"}</td>
                <td>${ehPessoaComCurso && u.cargo ? Util.escapar(u.cargo) : "---"}</td>
                <td>${Util.escapar(u.nomeLaboratorio || "---")}</td>
                <td><span class="badge ${classeBadge}">${Util.escapar(u.tipoUsuario)}</span></td>
                <td>
                    <div class="actions-cell">
                        ${podeEditar ? `
                            <a href="#" class="action-link action-link-edit" data-editar="${u.id}" data-tipo="${u.tipoUsuario}" title="Editar ${Util.escapar(u.nome)}" aria-label="Editar ${Util.escapar(u.nome)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </a>` : ""}
                        ${podeExcluir ? `
                            <a href="#" class="action-link action-link-delete" data-excluir="${u.id}" data-tipo="${u.tipoUsuario}" data-nome="${Util.escapar(u.nome)}" title="Excluir ${Util.escapar(u.nome)}" aria-label="Excluir ${Util.escapar(u.nome)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </a>` : ""}
                    </div>
                </td>
            </tr>`;
    }

    function configurarModalUsuario() {
        const btnNovo = document.getElementById("btn-novo");
        btnNovo.addEventListener("click", () => abrirModalCriacao());

        const selectTipo = document.getElementById("modal-tipo");
        selectTipo.addEventListener("change", () => {
            ajustarCamposPorTipo(selectTipo.value);
        });

        /* Password visibility toggles */
        document.querySelectorAll(".password-toggle-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (!input) return;
                const ehPassword = input.type === "password";
                input.type = ehPassword ? "text" : "password";
                btn.innerHTML = ehPassword
                    ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
                    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
            });
        });

        const form = document.getElementById("form-modal-usuario");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("modal-user-id").value;
            const edicao = Boolean(id);
            const nome = document.getElementById("modal-nome").value.trim();
            const email = document.getElementById("modal-email").value.trim();
            const senha = document.getElementById("modal-senha").value;
            const tipo = document.getElementById("modal-tipo").value;

            if (nome.length < 3) {
                Util.aviso("O nome deve ter pelo menos 3 caracteres.");
                return;
            }
            if (!edicao && senha.length < 6) {
                Util.aviso("A senha inicial deve ter pelo menos 6 caracteres.");
                return;
            }
            if (edicao && senha.length > 0 && senha.length < 6) {
                Util.aviso("A nova senha deve ter pelo menos 6 caracteres.");
                return;
            }

            const ehProf = tipo === "PROFESSOR";
            const ehAdm = tipo === "ADMIN";
            const labId = document.getElementById("modal-lab").value;

            const corpo = {
                nome,
                email,
                senha: senha || null,
                tipoUsuario: tipo,
                fotoUrl: document.getElementById("modal-foto").value || null,
                dataNascimento: (ehProf || ehAdm) ? null : (document.getElementById("modal-dataNasc").value || null),
                curso: (ehProf || ehAdm) ? null : document.getElementById("modal-curso").value,
                matricula: (ehProf || ehAdm) ? null : document.getElementById("modal-matricula").value,
                cpf: (ehProf || ehAdm) ? null : document.getElementById("modal-cpf").value,
                telefone: (ehProf || ehAdm) ? null : document.getElementById("modal-telefone").value,
                laboratorioId: (ehProf || ehAdm || !labId) ? null : Number(labId),
                cargo: (ehProf || ehAdm) ? null : (document.getElementById("modal-cargo").value || null)
            };

            const btn = document.getElementById("btn-modal-salvar-user");
            if (btn) {
                btn.classList.add("is-loading");
                btn.disabled = true;
            }

            try {
                if (edicao) {
                    await Api.put(`/usuarios/${id}`, corpo);
                    Util.fecharModal("modal-usuario");
                    Util.aviso("Usuário atualizado com sucesso!", "sucesso");
                } else {
                    await Api.post("/usuarios", corpo);
                    Util.fecharModal("modal-usuario");
                    Util.aviso("Usuário cadastrado com sucesso!", "sucesso");
                }
                await carregar(paginaAtual);
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

    function ajustarCamposPorTipo(tipo) {
        const secaoBolsista = document.getElementById("modal-secao-bolsista");
        const groupLab = document.getElementById("modal-group-lab");
        const selectLab = document.getElementById("modal-lab");

        if (tipo === "BOLSISTA") {
            secaoBolsista.hidden = false;
            groupLab.hidden = !Sessao.ehAdmin();
            selectLab.required = Sessao.ehAdmin();
        } else {
            secaoBolsista.hidden = true;
            selectLab.required = false;
        }
    }

    function abrirModalCriacao() {
        document.getElementById("modal-user-id").value = "";
        document.getElementById("modal-user-tipo-original").value = "";
        document.getElementById("modal-nome").value = "";
        document.getElementById("modal-email").value = "";
        document.getElementById("modal-senha").value = "";
        document.getElementById("modal-foto").value = "";
        document.getElementById("modal-curso").value = "";
        document.getElementById("modal-matricula").value = "";
        document.getElementById("modal-cpf").value = "";
        document.getElementById("modal-telefone").value = "";
        document.getElementById("modal-dataNasc").value = "";
        document.getElementById("modal-cargo").value = "";
        document.getElementById("modal-lab").value = "";

        document.getElementById("modal-group-tipo").hidden = !Sessao.ehAdmin();
        document.getElementById("modal-tipo").value = "BOLSISTA";

        document.getElementById("modal-senha-asterisco").hidden = false;
        document.getElementById("modal-senha").required = true;
        document.getElementById("modal-senha").placeholder = "Mínimo de 6 caracteres";

        const rotulo = Sessao.ehAdmin() ? "Usuário" : "Bolsista";
        document.getElementById("label-modal-usuario").textContent = `Cadastrar Novo ${rotulo}`;
        document.getElementById("label-btn-salvar-user").textContent = `Cadastrar ${rotulo}`;

        ajustarCamposPorTipo("BOLSISTA");
        Util.abrirModal("modal-usuario");
    }

    function abrirModalEdicao(u) {
        document.getElementById("modal-user-id").value = u.id;
        document.getElementById("modal-user-tipo-original").value = u.tipoUsuario;
        document.getElementById("modal-nome").value = u.nome || "";
        document.getElementById("modal-email").value = u.email || "";
        document.getElementById("modal-senha").value = "";
        document.getElementById("modal-foto").value = u.fotoUrl || "";
        document.getElementById("modal-curso").value = u.curso || "";
        document.getElementById("modal-matricula").value = u.matricula || "";
        document.getElementById("modal-cpf").value = u.cpf || "";
        document.getElementById("modal-telefone").value = u.telefone || "";
        document.getElementById("modal-dataNasc").value = u.dataNascimento || "";
        document.getElementById("modal-cargo").value = u.cargo || "";
        document.getElementById("modal-lab").value = u.laboratorioId || "";

        document.getElementById("modal-group-tipo").hidden = !Sessao.ehAdmin();
        document.getElementById("modal-tipo").value = u.tipoUsuario || "BOLSISTA";

        document.getElementById("modal-senha-asterisco").hidden = true;
        document.getElementById("modal-senha").required = false;
        document.getElementById("modal-senha").placeholder = "Deixe em branco para não alterar";

        document.getElementById("label-modal-usuario").textContent = `Editar Usuário — ${u.nome}`;
        document.getElementById("label-btn-salvar-user").textContent = "Salvar Alterações";

        ajustarCamposPorTipo(u.tipoUsuario || "BOLSISTA");
        Util.abrirModal("modal-usuario");
    }

    function montarPaginacao(dados, pagina) {
        const alvo = document.getElementById("paginacao");
        if (dados.totalPaginas <= 1) {
            alvo.innerHTML = "";
            return;
        }
        const url = (p) => {
            const q = new URLSearchParams({ pagina: p });
            if (filtroTipo) q.set("tipo", filtroTipo);
            if (buscaNome) q.set("buscaNome", buscaNome);
            if (buscaCurso) q.set("buscaCurso", buscaCurso);
            return `/usuarios.html?${q}`;
        };
        alvo.innerHTML = `
            ${pagina > 1 ? `<a href="${url(pagina - 1)}" class="btn-pagination" aria-label="Página anterior"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg> <span>Anterior</span></a>` : ""}
            <span class="pagination-info">Página <strong>${dados.pagina}</strong> de <strong>${dados.totalPaginas}</strong></span>
            ${pagina < dados.totalPaginas ? `<a href="${url(pagina + 1)}" class="btn-pagination" aria-label="Próxima página"><span>Próxima</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg></a>` : ""}`;
    }
})();
