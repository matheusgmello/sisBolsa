(async () => {
    await Sessao.iniciar();

    if (!Sessao.ehAdmin()) {
        window.location.href = "/dashboard.html";
        return;
    }

    const cartoesEl = document.getElementById("cartoes");
    const secoesEl = document.getElementById("secoes");

    /* Skeleton Loading inicial */
    cartoesEl.innerHTML = `
        <div class="skeleton-card"><div class="skeleton-box" style="height: 14px; width: 60%; margin-bottom: 12px;"></div><div class="skeleton-box" style="height: 32px; width: 40%; margin-bottom: 8px;"></div><div class="skeleton-box" style="height: 12px; width: 50%;"></div></div>
        <div class="skeleton-card"><div class="skeleton-box" style="height: 14px; width: 60%; margin-bottom: 12px;"></div><div class="skeleton-box" style="height: 32px; width: 40%; margin-bottom: 8px;"></div><div class="skeleton-box" style="height: 12px; width: 50%;"></div></div>
        <div class="skeleton-card"><div class="skeleton-box" style="height: 14px; width: 60%; margin-bottom: 12px;"></div><div class="skeleton-box" style="height: 32px; width: 40%; margin-bottom: 8px;"></div><div class="skeleton-box" style="height: 12px; width: 50%;"></div></div>`;

    secoesEl.innerHTML = `
        <div class="report-sections">
            <div class="report-card"><div class="skeleton-box" style="height: 24px; width: 50%; margin-bottom: 20px;"></div><div class="skeleton-box" style="height: 100px; width: 100%;"></div></div>
            <div class="report-card"><div class="skeleton-box" style="height: 24px; width: 50%; margin-bottom: 20px;"></div><div class="skeleton-box" style="height: 100px; width: 100%;"></div></div>
        </div>`;

    let usuarios, labs, horas, projetosPorLab, porCargo, ocupacao;
    try {
        [usuarios, labs, horas, projetosPorLab, porCargo, ocupacao] = await Promise.all([
            Api.get("/usuarios?tipo=BOLSISTA&tamanho=200"),
            Api.get("/laboratorios"),
            Api.get("/relatorios/horas-mes"),
            Api.get("/relatorios/projetos-por-laboratorio"),
            Api.get("/relatorios/bolsistas-por-cargo"),
            Api.get("/relatorios/ocupacao")
        ]);
    } catch (e) {
        Util.aviso(e.message);
        return;
    }

    const bolsistas = usuarios.itens;
    const ativos = bolsistas.filter(b => b.ativo).length;

    cartoesEl.innerHTML = `
        <div class="stat-card">
            <h3>Total de Bolsistas</h3>
            <div class="value">${bolsistas.length}</div>
            <p class="stat-desc">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <span>Cadastrados no Sistema</span>
            </p>
        </div>
        <div class="stat-card">
            <h3>Bolsistas Ativos</h3>
            <div class="value" style="color: var(--success-color);">${ativos}</div>
            <p class="stat-desc">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Em Atividade Regular</span>
            </p>
        </div>
        <div class="stat-card">
            <h3>Total de Laboratórios</h3>
            <div class="value">${labs.length}</div>
            <p class="stat-desc">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
                <span>Unidades Cadastradas</span>
            </p>
        </div>`;

    /* agrupamentos simples ficam no cliente; os que exigem SUM/GROUP BY vem da api */
    const porCurso = agrupar(bolsistas, b => b.curso || "Sem curso");
    const porStatus = agrupar(labs, l => l.status || "Sem status");
    const lotados = ocupacao.filter(o => o.percentualOcupacao >= 85);

    const iconeCurso = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
    const iconeLab = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`;
    const iconeHoras = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const iconeProj = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`;
    const iconeCargo = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
    const iconeAlerta = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--danger-color);"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

    secoesEl.innerHTML = `
        <div class="report-sections">
            ${cartao(iconeCurso, "Bolsistas por Curso", ["Curso", "Quantidade"],
                [...porCurso].map(([k, v]) => `<tr><td>${Util.escapar(k)}</td><td class="cell-right"><span class="count-badge">${v}</span></td></tr>`).join(""),
                "Nenhum bolsista cadastrado.", 2)}
            ${cartao(iconeLab, "Laboratórios por Status", ["Status", "Quantidade"],
                [...porStatus].map(([k, v]) => `<tr><td>${Util.escapar(k)}</td><td class="cell-right"><span class="count-badge count-badge-warning">${v}</span></td></tr>`).join(""),
                "Nenhum laboratório cadastrado.", 2)}
        </div>

        <div class="report-sections">
            ${cartao(iconeHoras, "Horas Registradas no Mês Corrente", ["Bolsista", "Total de Horas"],
                horas.map(h => `<tr><td><strong>${Util.escapar(h.nome)}</strong></td><td class="cell-right"><span class="count-badge">${Util.numero(h.totalHoras)} hrs</span></td></tr>`).join(""),
                "Nenhuma hora lançada no mês corrente.", 2)}
            ${cartao(iconeProj, "Projetos Ativos por Laboratório", ["Laboratório", "Projetos Ativos"],
                projetosPorLab.map(p => `<tr><td><strong>${Util.escapar(p.nome)}</strong></td><td class="cell-right"><span class="count-badge count-badge-warning">${p.totalProjetos}</span></td></tr>`).join(""),
                "Nenhum projeto ativo cadastrado.", 2)}
        </div>

        <div class="report-sections">
            ${cartao(iconeCargo, "Bolsistas por Cargo", ["Cargo", "Total de Bolsistas"],
                porCargo.map(c => `<tr><td><strong>${Util.escapar(c.cargo)}</strong></td><td class="cell-right"><span class="count-badge count-badge-purple">${c.totalBolsistas}</span></td></tr>`).join(""),
                "Nenhum bolsista associado a cargo.", 2)}

            <div class="report-card">
                <h2 class="section-title">
                    ${iconeAlerta}
                    <span>Alerta de Vagas (Ocupação &ge; 85%)</span>
                </h2>
                <table>
                    <thead><tr><th>Laboratório</th><th>Ocupação</th><th class="cell-right">Bolsistas / Vagas</th></tr></thead>
                    <tbody>
                        ${lotados.length
                            ? lotados.map(l => `
                                <tr>
                                    <td><strong>${Util.escapar(l.nome)}</strong></td>
                                    <td><span class="badge-occupancy-danger">${Util.numero(l.percentualOcupacao)}%</span></td>
                                    <td class="cell-right"><strong>${l.totalBolsistas}</strong> / ${l.capacidade}</td>
                                </tr>`).join("")
                            : `<tr>
                                <td colspan="3" class="empty-state-cell empty-state-success">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                    <span>Todos os laboratórios estão operando com folga (&lt; 85% de ocupação).</span>
                                </td>
                               </tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;

    function agrupar(lista, chave) {
        const mapa = new Map();
        lista.forEach(item => {
            const k = chave(item);
            mapa.set(k, (mapa.get(k) || 0) + 1);
        });
        return mapa;
    }

    function cartao(iconeSvg, titulo, colunas, linhas, vazio, span) {
        return `
            <div class="report-card">
                <h2 class="section-title">
                    ${iconeSvg}
                    <span>${titulo}</span>
                </h2>
                <table>
                    <thead><tr>${colunas.map((c, i) => `<th${i > 0 ? ' class="cell-right"' : ""}>${c}</th>`).join("")}</tr></thead>
                    <tbody>${linhas || `<tr><td colspan="${span}" class="empty-state-cell">${vazio}</td></tr>`}</tbody>
                </table>
            </div>`;
    }
})();
