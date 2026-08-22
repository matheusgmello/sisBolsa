/*
 * o dashboard tem tres caras diferentes conforme o perfil. cada uma monta o
 * proprio html e busca so o que precisa.
 */
(async () => {
    const usuario = await Sessao.iniciar();
    document.getElementById("nome-usuario").textContent = usuario.nome;

    const titulos = { BOLSISTA: "Área do Bolsista", PROFESSOR: "Área do Professor", ADMIN: "Painel de Controle" };
    document.getElementById("titulo").textContent = titulos[usuario.tipoUsuario] || "Painel";

    const alvo = document.getElementById("conteudo");

    function atalho(href, icone, titulo, texto, extra = "") {
        return `<a href="${href}" class="card">
                    <i class="fas ${icone}"></i>
                    <h3>${titulo}</h3>
                    <p>${texto}</p>
                    ${extra}
                </a>`;
    }

    function avatarCelula(pessoa) {
        return pessoa.fotoUrl
            ? `<img src="${Util.escapar(pessoa.fotoUrl)}" alt="Avatar" class="avatar-small">`
            : `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`;
    }

    function vazio(colunas, texto) {
        return `<tr><td colspan="${colunas}" class="empty-state">${texto}</td></tr>`;
    }

    if (Sessao.ehBolsista()) {
        await montarBolsista();
    } else if (Sessao.ehProfessor()) {
        await montarProfessor();
    } else {
        await montarAdmin();
    }

    async function montarBolsista() {
        const projetos = await Api.get(`/usuarios/${usuario.id}/projetos`);
        let lab = null;
        let equipe = [];
        if (usuario.laboratorioId) {
            lab = await Api.get(`/laboratorios/${usuario.laboratorioId}`);
            equipe = await Api.get(`/laboratorios/${usuario.laboratorioId}/bolsistas`);
        }

        const linhasEquipe = equipe.length
            ? equipe.map(m => `
                <tr class="${m.id === usuario.id ? "highlight-self" : ""}">
                    <td>
                        <div class="user-cell">
                            ${avatarCelula(m)}
                            <div class="user-info-wrapper">
                                <strong class="user-name">${Util.escapar(m.nome)} ${m.id === usuario.id ? "(Você)" : ""}</strong>
                                ${m.bio ? `<p class="user-bio-small" title="${Util.escapar(m.bio)}">${Util.escapar(m.bio)}</p>` : ""}
                            </div>
                        </div>
                    </td>
                    <td>${Util.escapar(m.email)}</td>
                    <td><span class="membro-cargo">${Util.escapar(m.cargo || "Bolsista")}</span></td>
                </tr>`).join("")
            : vazio(3, "Nenhum outro participante no laboratório.");

        const linhasProjetos = projetos.length
            ? projetos.map(p => `
                <tr>
                    <td><strong>${Util.escapar(p.nome)}</strong></td>
                    <td>${Util.escapar(p.descricao)}</td>
                    <td>${Util.escapar(p.nomeLaboratorio)}</td>
                    <td><a href="/projeto-detalhes.html?id=${p.id}" class="btn-detalhes-link"
                           style="color: var(--primary-color); font-weight: bold;">
                           <i class="fas fa-info-circle"></i> Detalhes</a></td>
                </tr>`).join("")
            : vazio(4, "Você não está vinculado a nenhum projeto no momento.");

        alvo.innerHTML = `
            <h2><i class="fas fa-rocket"></i> Atalhos Rápidos</h2>
            <div class="cards-container bolsista-shortcuts">
                ${atalho("/frequencia.html", "fa-calendar-check", "Lançar Frequência", "Registre suas horas trabalhadas e descreva suas atividades diárias.")}
                ${usuario.laboratorioId ? atalho(`/laboratorio-detalhes.html?id=${usuario.laboratorioId}`, "fa-flask", "Meu Laboratório", "Veja detalhes da sua equipe, coordenador e projetos vinculados.") : ""}
                ${atalho("/projetos.html", "fa-project-diagram", "Visualizar Projetos", "Consulte a listagem de todos os projetos ativos no sistema.")}
                ${atalho("/perfil.html", "fa-user-cog", "Editar Perfil", "Gerencie suas informações cadastrais, senha e foto de perfil.")}
            </div>

            <div class="equipe-container">
                <h2><i class="fas fa-users"></i> Minha Equipe ${lab ? `(${Util.escapar(lab.nome)})` : ""}</h2>
                ${lab && lab.coordenador ? `<div class="coordenador-info"><i class="fas fa-user-tie"></i> Coordenador do Laboratório: <strong>${Util.escapar(lab.coordenador)}</strong></div>` : ""}
                <div class="table-container">
                    <table>
                        <thead><tr><th>Nome</th><th>E-mail</th><th>Função</th></tr></thead>
                        <tbody>${linhasEquipe}</tbody>
                    </table>
                </div>
            </div>

            <div class="equipe-container" style="margin-top: 30px;">
                <h2><i class="fas fa-project-diagram"></i> Meus Projetos Vinculados</h2>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Projeto</th><th>Descrição</th><th>Laboratório</th><th>Ações</th></tr></thead>
                        <tbody>${linhasProjetos}</tbody>
                    </table>
                </div>
            </div>`;
    }

    async function montarProfessor() {
        const labs = await Api.get("/laboratorios");
        const totalBolsistas = labs.reduce((soma, l) => soma + l.totalBolsistas, 0);

        const linhas = labs.length
            ? labs.map(l => `
                <tr>
                    <td><strong>${Util.escapar(l.nome)}</strong></td>
                    <td>${Util.escapar(l.areaPesquisa)}</td>
                    <td><span class="badge ${String(l.status).toUpperCase() === "ATIVO" ? "badge-success" : "badge-danger"}">${Util.escapar(l.status)}</span></td>
                    <td><strong>${l.capacidade}</strong> vagas totais</td>
                    <td>
                        <a href="/laboratorio-detalhes.html?id=${l.id}" class="btn-detalhes-link"
                           style="color: var(--primary-color); font-weight: bold; margin-right: 15px;"><i class="fas fa-eye"></i> Detalhes</a>
                        <a href="/laboratorio-form.html?id=${l.id}" class="btn-detalhes-link"
                           style="color: #f39c12; font-weight: bold;"><i class="fas fa-edit"></i> Editar</a>
                    </td>
                </tr>`).join("")
            : vazio(5, "Você não coordena nenhum laboratório ativo cadastrado.");

        alvo.innerHTML = `
            <h2><i class="fas fa-rocket"></i> Atalhos Rápidos</h2>
            <div class="cards-container">
                ${atalho("/usuarios.html", "fa-user-graduate", "Gerenciar Bolsistas", "Gerencie os bolsistas vinculados aos laboratórios sob sua coordenação.")}
                ${atalho("/laboratorios.html", "fa-flask", "Meus Laboratórios", "Visualize os laboratórios que você coordena e seus respectivos projetos.")}
                ${atalho("/frequencia.html", "fa-calendar-alt", "Frequências da Equipe", "Acompanhe e valide a folha de frequências dos bolsistas sob sua supervisão.")}
                ${atalho("/perfil.html", "fa-user-cog", "Editar Perfil", "Gerencie suas informações cadastrais, biografia e foto de perfil.")}
            </div>

            <div class="equipe-container" style="margin-top: 30px;">
                <h2><i class="fas fa-university"></i> Meus Laboratórios Coordenados (Total de Bolsistas: ${totalBolsistas})</h2>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Laboratório</th><th>Área de Pesquisa</th><th>Status</th><th>Capacidade Ocupada</th><th>Ações</th></tr></thead>
                        <tbody>${linhas}</tbody>
                    </table>
                </div>
            </div>`;
    }

    async function montarAdmin() {
        const resumo = await Api.get("/relatorios/resumo");
        alvo.innerHTML = `
            <h2><i class="fas fa-rocket"></i> Atalhos Rápidos</h2>
            <div class="cards-container">
                ${atalho("/usuarios.html", "fa-user-graduate", "Gerenciar Usuários", "Cadastre, edite e pesquise bolsistas, professores e administradores.", `<div class="card-stat">${resumo.totalBolsistas} cadastrados</div>`)}
                ${atalho("/laboratorios.html", "fa-flask", "Laboratórios", "Gerencie os laboratórios de pesquisa, coordenadores e vagas.", `<div class="card-stat">${resumo.totalLaboratorios} cadastrados</div>`)}
                ${atalho("/projetos.html", "fa-project-diagram", "Projetos", "Gerencie todos os projetos ativos e o vínculo de bolsistas.", `<div class="card-stat">${resumo.totalProjetos} cadastrados</div>`)}
                ${atalho("/frequencia.html", "fa-calendar-check", "Frequências", "Visualize e gerencie a folha de horas e atividades de todos os bolsistas.")}
                ${atalho("/relatorios.html", "fa-chart-line", "Relatórios", "Visualize estatísticas e relatórios avançados sobre a plataforma.")}
            </div>`;
    }
})();
