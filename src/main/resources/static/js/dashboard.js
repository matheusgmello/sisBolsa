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

    function avatarCelula(pessoa) {
        return pessoa.fotoUrl
            ? `<img src="${Util.escapar(pessoa.fotoUrl)}" alt="Avatar" class="avatar-small">`
            : `<div class="avatar-placeholder"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
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
                    <td><a href="/projeto-detalhes.html?id=${p.id}" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">Ver Detalhes &rarr;</a></td>
                </tr>`).join("")
            : vazio(4, "Você não está vinculado a nenhum projeto no momento.");

        alvo.innerHTML = `
            <h2 class="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Atalhos Rápidos
            </h2>
            <div class="actions-grid">
                <a href="/frequencia.html" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Lançar Frequência</h3>
                        <p>Registre suas horas trabalhadas e descreva suas atividades diárias.</p>
                    </div>
                </a>

                ${usuario.laboratorioId ? `
                <a href="/laboratorio-detalhes.html?id=${usuario.laboratorioId}" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Meu Laboratório</h3>
                        <p>Veja detalhes da sua equipe, coordenador e projetos vinculados.</p>
                    </div>
                </a>` : ""}

                <a href="/projetos.html" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Visualizar Projetos</h3>
                        <p>Consulte a listagem de todos os projetos ativos no sistema.</p>
                    </div>
                </a>

                <a href="/perfil.html" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Meu Perfil</h3>
                        <p>Gerencie suas informações cadastrais, senha e foto de perfil.</p>
                    </div>
                </a>
            </div>

            <div class="equipe-container">
                <h2 class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Minha Equipe ${lab ? `(${Util.escapar(lab.nome)})` : ""}
                </h2>
                ${lab && lab.coordenador ? `<div class="coordenador-info"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Coordenador: <strong>${Util.escapar(lab.coordenador)}</strong></div>` : ""}
                <div class="table-container">
                    <table>
                        <thead><tr><th>Nome</th><th>E-mail</th><th>Função</th></tr></thead>
                        <tbody>${linhasEquipe}</tbody>
                    </table>
                </div>
            </div>

            <div class="equipe-container">
                <h2 class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    Meus Projetos Vinculados
                </h2>
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
                    <td><span class="badge ${String(l.status).toUpperCase() === "ATIVO" ? "badge-admin" : "badge-danger"}">${Util.escapar(l.status)}</span></td>
                    <td><strong>${l.capacidade}</strong> vagas totais</td>
                    <td>
                        <a href="/laboratorio-detalhes.html?id=${l.id}" style="color: var(--primary-color); font-weight: 600; text-decoration: none; margin-right: 15px;">Detalhes &rarr;</a>
                        <a href="/laboratorio-form.html?id=${l.id}" style="color: var(--warning-color); font-weight: 600; text-decoration: none;">Editar</a>
                    </td>
                </tr>`).join("")
            : vazio(5, "Você não coordena nenhum laboratório ativo cadastrado.");

        alvo.innerHTML = `
            <h2 class="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Atalhos Rápidos
            </h2>
            <div class="actions-grid">
                <a href="/usuarios.html" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Gerenciar Bolsistas</h3>
                        <p>Gerencie os bolsistas vinculados aos laboratórios sob sua coordenação.</p>
                    </div>
                </a>

                <a href="/laboratorios.html" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Meus Laboratórios</h3>
                        <p>Visualize os laboratórios que você coordena e seus respectivos projetos.</p>
                    </div>
                </a>

                <a href="/frequencia.html" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Frequências da Equipe</h3>
                        <p>Acompanhe e valide a folha de frequências dos bolsistas sob sua supervisão.</p>
                    </div>
                </a>

                <a href="/perfil.html" class="action-card">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="action-info">
                        <h3>Editar Perfil</h3>
                        <p>Gerencie suas informações cadastrais e foto de perfil.</p>
                    </div>
                </a>
            </div>

            <div class="equipe-container">
                <h2 class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                    Meus Laboratórios Coordenados (Total de Bolsistas: ${totalBolsistas})
                </h2>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Laboratório</th><th>Área de Pesquisa</th><th>Status</th><th>Capacidade Ocupada</th><th>Ações</th></tr></thead>
                        <tbody>${linhas}</tbody>
                    </table>
                </div>
            </div>`;
    }

    async function montarAdmin() {
        alvo.innerHTML = `
            <h2 class="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                Visão Geral da Plataforma
            </h2>
            <div class="kpi-grid">
                <div class="skeleton-box"></div>
                <div class="skeleton-box"></div>
                <div class="skeleton-box"></div>
            </div>
            <h2 class="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Ações Rápidas de Administração
            </h2>
            <div class="actions-grid">
                <div class="skeleton-box" style="height: 90px;"></div>
                <div class="skeleton-box" style="height: 90px;"></div>
                <div class="skeleton-box" style="height: 90px;"></div>
            </div>
        `;

        try {
            const resumo = await Api.get("/relatorios/resumo");
            alvo.innerHTML = `
                <h2 class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    Visão Geral da Plataforma
                </h2>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-top">
                            <div>
                                <div class="kpi-value">${resumo.totalBolsistas}</div>
                                <p class="kpi-label">Bolsistas Cadastrados</p>
                            </div>
                            <div class="kpi-icon-badge indigo">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                            </div>
                        </div>
                        <a href="/usuarios.html" class="kpi-link">Gerenciar bolsistas &rarr;</a>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-top">
                            <div>
                                <div class="kpi-value">${resumo.totalLaboratorios}</div>
                                <p class="kpi-label">Laboratórios Ativos</p>
                            </div>
                            <div class="kpi-icon-badge teal">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                            </div>
                        </div>
                        <a href="/laboratorios.html" class="kpi-link">Ver laboratórios &rarr;</a>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-top">
                            <div>
                                <div class="kpi-value">${resumo.totalProjetos}</div>
                                <p class="kpi-label">Projetos de Pesquisa</p>
                            </div>
                            <div class="kpi-icon-badge amber">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                            </div>
                        </div>
                        <a href="/projetos.html" class="kpi-link">Consultar projetos &rarr;</a>
                    </div>
                </div>

                <h2 class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    Ações Rápidas de Administração
                </h2>
                <div class="actions-grid">
                    <a href="/usuarios.html" class="action-card">
                        <div class="action-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div class="action-info">
                            <h3>Gestão de Usuários</h3>
                            <p>Cadastre, pesquise e gerencie permissões de bolsistas, professores e administradores.</p>
                        </div>
                    </a>

                    <a href="/laboratorios.html" class="action-card">
                        <div class="action-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                        </div>
                        <div class="action-info">
                            <h3>Laboratórios</h3>
                            <p>Cadastre novos laboratórios, atribua coordenadores e controle o teto de vagas.</p>
                        </div>
                    </a>

                    <a href="/projetos.html" class="action-card">
                        <div class="action-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                        </div>
                        <div class="action-info">
                            <h3>Projetos de Pesquisa</h3>
                            <p>Gerencie projetos institucionais e vincule bolsistas aos seus respectivos labs.</p>
                        </div>
                    </a>

                    <a href="/frequencia.html" class="action-card">
                        <div class="action-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                        </div>
                        <div class="action-info">
                            <h3>Folha de Frequência</h3>
                            <p>Acompanhe e audite o registro de horas e as atividades desempenhadas pelos bolsistas.</p>
                        </div>
                    </a>

                    <a href="/relatorios.html" class="action-card">
                        <div class="action-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                        </div>
                        <div class="action-info">
                            <h3>Relatórios & Métricas</h3>
                            <p>Acesse estatísticas consolidadas e relatórios gerenciais da instituição.</p>
                        </div>
                    </a>

                    <a href="/perfil.html" class="action-card">
                        <div class="action-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div class="action-info">
                            <h3>Meu Perfil</h3>
                            <p>Altere seus dados cadastrais, e-mail de acesso e senha de administrador.</p>
                        </div>
                    </a>
                </div>
            `;
        } catch (e) {
            Util.aviso("Não foi possível carregar os dados do painel: " + e.message);
        }
    }
})();
