(async () => {
    await Sessao.iniciar();

    if (!Sessao.ehAdmin()) {
        window.location.href = "/dashboard.html";
        return;
    }

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

    document.getElementById("cartoes").innerHTML = `
        <div class="stat-card">
            <h3>Total de Bolsistas</h3>
            <div class="value">${bolsistas.length}</div>
            <p><i class="fas fa-user-graduate"></i> Cadastrados</p>
        </div>
        <div class="stat-card stat-card-success">
            <h3>Bolsistas Ativos</h3>
            <div class="value">${ativos}</div>
            <p><i class="fas fa-check-circle"></i> Em atividade</p>
        </div>
        <div class="stat-card stat-card-warning">
            <h3>Total de Laboratórios</h3>
            <div class="value">${labs.length}</div>
            <p><i class="fas fa-flask"></i> Unidades</p>
        </div>`;

    /* agrupamentos simples ficam no cliente; os que exigem SUM/GROUP BY vem da api */
    const porCurso = agrupar(bolsistas, b => b.curso || "Sem curso");
    const porStatus = agrupar(labs, l => l.status || "Sem status");
    const lotados = ocupacao.filter(o => o.percentualOcupacao >= 85);

    document.getElementById("secoes").innerHTML = `
        <div class="report-sections">
            ${cartao("fa-graduation-cap", "Bolsistas por Curso", ["Curso", "Quantidade"],
                [...porCurso].map(([k, v]) => `<tr><td>${Util.escapar(k)}</td><td class="cell-right"><span class="count-badge">${v}</span></td></tr>`).join(""),
                "Nenhum bolsista cadastrado.", 2)}
            ${cartao("fa-vial", "Laboratórios por Status", ["Status", "Quantidade"],
                [...porStatus].map(([k, v]) => `<tr><td>${Util.escapar(k)}</td><td class="cell-right"><span class="count-badge count-badge-warning">${v}</span></td></tr>`).join(""),
                "Nenhum laboratório cadastrado.", 2)}
        </div>

        <div class="report-sections" style="margin-top:25px;">
            ${cartao("fa-clock", "Horas Registradas no Mês Corrente", ["Bolsista", "Total de Horas"],
                horas.map(h => `<tr><td>${Util.escapar(h.nome)}</td><td class="cell-right"><span class="count-badge" style="background-color:var(--primary-color);">${Util.numero(h.totalHoras)} hrs</span></td></tr>`).join(""),
                "Nenhuma hora lançada no mês corrente.", 2)}
            ${cartao("fa-project-diagram", "Projetos Ativos por Laboratório", ["Laboratório", "Projetos Ativos"],
                projetosPorLab.map(p => `<tr><td>${Util.escapar(p.nome)}</td><td class="cell-right"><span class="count-badge count-badge-warning">${p.totalProjetos}</span></td></tr>`).join(""),
                "Nenhum projeto ativo cadastrado.", 2)}
        </div>

        <div class="report-sections" style="margin-top:25px;">
            ${cartao("fa-briefcase", "Bolsistas por Cargo", ["Cargo", "Total de Bolsistas"],
                porCargo.map(c => `<tr><td>${Util.escapar(c.cargo)}</td><td class="cell-right"><span class="count-badge" style="background-color:#9b59b6;color:white;">${c.totalBolsistas}</span></td></tr>`).join(""),
                "Nenhum bolsista associado a cargo.", 2)}

            <div class="report-card">
                <h2><i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> Alerta de Vagas (Ocupação >= 85%)</h2>
                <table>
                    <thead><tr><th>Laboratório</th><th>Ocupação</th><th class="cell-right">Bolsistas / Total</th></tr></thead>
                    <tbody>
                        ${lotados.length
                            ? lotados.map(l => `
                                <tr>
                                    <td><strong>${Util.escapar(l.nome)}</strong></td>
                                    <td><span class="badge badge-danger" style="background-color:#e74c3c;color:white;padding:3px 8px;border-radius:4px;font-size:0.8rem;">${Util.numero(l.percentualOcupacao)}%</span></td>
                                    <td class="cell-right"><strong>${l.totalBolsistas}</strong> / ${l.capacidade}</td>
                                </tr>`).join("")
                            : `<tr><td colspan="3" class="empty-state" style="text-align:center;color:#2ecc71;padding:15px;font-weight:bold;">
                                   <i class="fas fa-check-circle"></i> Todos os laboratórios estão operando com folga (&lt; 85% de ocupação).
                               </td></tr>`}
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

    function cartao(icone, titulo, colunas, linhas, vazio, span) {
        return `
            <div class="report-card">
                <h2><i class="fas ${icone}"></i> ${titulo}</h2>
                <table>
                    <thead><tr>${colunas.map((c, i) => `<th${i > 0 ? ' class="cell-right"' : ""}>${c}</th>`).join("")}</tr></thead>
                    <tbody>${linhas || `<tr><td colspan="${span}" class="empty-state" style="text-align:center;color:#666;padding:15px;">${vazio}</td></tr>`}</tbody>
                </table>
            </div>`;
    }
})();
