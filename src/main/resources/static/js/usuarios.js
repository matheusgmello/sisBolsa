(async () => {
    const usuario = await Sessao.iniciar();

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

    document.getElementById("form-nome").addEventListener("submit", e => {
        e.preventDefault();
        window.location.href = `/usuarios.html?buscaNome=${encodeURIComponent(document.getElementById("busca-nome").value)}`;
    });
    document.getElementById("form-curso").addEventListener("submit", e => {
        e.preventDefault();
        window.location.href = `/usuarios.html?buscaCurso=${encodeURIComponent(document.getElementById("busca-curso").value)}`;
    });

    await carregar(Number(Util.parametro("pagina")) || 1);

    async function carregar(pagina) {
        const query = new URLSearchParams({ pagina });
        if (filtroTipo) query.set("tipo", filtroTipo);
        if (buscaNome) query.set("buscaNome", buscaNome);
        if (buscaCurso) query.set("buscaCurso", buscaCurso);

        let dados;
        try {
            dados = await Api.get(`/usuarios?${query}`);
        } catch (e) {
            Util.aviso(e.message);
            return;
        }

        const corpo = document.getElementById("corpo");
        corpo.innerHTML = dados.itens.length
            ? dados.itens.map(linha).join("")
            : `<tr><td colspan="6" class="empty-state">Nenhum usuário encontrado.</td></tr>`;

        corpo.querySelectorAll("[data-excluir]").forEach(botao => {
            botao.addEventListener("click", async (e) => {
                e.preventDefault();
                if (!confirm(`Excluir este ${rotulo.toLowerCase()}?`)) return;
                try {
                    await Api.delete(`/usuarios/${botao.dataset.excluir}?tipo=${botao.dataset.tipo}`);
                    Util.aviso("Usuário excluído com sucesso.", "sucesso");
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
                    ${podeEditar ? `<a href="/usuario-form.html?id=${u.id}&tipo=${u.tipoUsuario}" class="action-link action-link-edit"><i class="fas fa-edit"></i></a>` : ""}
                    ${podeExcluir ? `<a href="#" class="action-link action-link-delete" data-excluir="${u.id}" data-tipo="${u.tipoUsuario}"><i class="fas fa-trash"></i></a>` : ""}
                </td>
            </tr>`;
    }

    function montarPaginacao(dados, pagina) {
        const alvo = document.getElementById("paginacao");
        if (dados.totalPaginas <= 1) {
            alvo.innerHTML = "";
            return;
        }
        const estilo = "padding:8px 16px;background-color:var(--primary-color);color:white;border-radius:4px;text-decoration:none;font-size:0.9rem;font-weight:bold;";
        const url = (p) => {
            const q = new URLSearchParams({ pagina: p });
            if (filtroTipo) q.set("tipo", filtroTipo);
            if (buscaNome) q.set("buscaNome", buscaNome);
            if (buscaCurso) q.set("buscaCurso", buscaCurso);
            return `/usuarios.html?${q}`;
        };
        alvo.innerHTML = `
            ${pagina > 1 ? `<a href="${url(pagina - 1)}" class="btn-pagination" style="${estilo}"><i class="fas fa-chevron-left"></i> Anterior</a>` : ""}
            <span style="font-size:0.9rem;color:#555;">Página <strong>${dados.pagina}</strong> de ${dados.totalPaginas}</span>
            ${pagina < dados.totalPaginas ? `<a href="${url(pagina + 1)}" class="btn-pagination" style="${estilo}">Próxima <i class="fas fa-chevron-right"></i></a>` : ""}`;
    }
})();
