/*
 * menu lateral e barra do topo, iguais em todas as telas internas.
 * substitui o antigo sidebar.tag do jsp.
 */
const Sidebar = (() => {

    const iconesSvg = {
        dashboard: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        usuarios: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        laboratorios: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
        projetos: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
        frequencia: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>`,
        relatorios: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
        perfil: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        sair: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
    };

    function avatar(usuario) {
        if (usuario.fotoUrl) {
            return `<img src="${Util.escapar(usuario.fotoUrl)}" alt="Avatar de ${Util.escapar(usuario.nome)}" class="profile-img"
                         style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--primary-color);">`;
        }
        return `<div class="profile-placeholder"
                     style="width:40px;height:40px;border-radius:50%;background-color:var(--primary-subtle);color:var(--primary-color);
                            display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>`;
    }

    function papel(usuario) {
        if (usuario.tipoUsuario === "ADMIN") return "ADMINISTRADOR";
        if (usuario.tipoUsuario === "PROFESSOR") return "PROFESSOR";
        return usuario.cargo || "BOLSISTA";
    }

    function itens(usuario) {
        const gerencia = usuario.tipoUsuario === "ADMIN" || usuario.tipoUsuario === "PROFESSOR";
        const lista = [
            { href: "/dashboard.html", iconeKey: "dashboard", texto: "Dashboard" }
        ];

        if (gerencia) {
            lista.push({
                href: "/usuarios.html",
                iconeKey: "usuarios",
                texto: usuario.tipoUsuario === "ADMIN" ? "Usuários" : "Bolsistas"
            });
            lista.push({ href: "/laboratorios.html", iconeKey: "laboratorios", texto: "Laboratórios" });
        } else if (usuario.laboratorioId) {
            lista.push({
                href: `/laboratorio-detalhes.html?id=${usuario.laboratorioId}`,
                iconeKey: "laboratorios",
                texto: "Meu Laboratório"
            });
        }

        lista.push({ href: "/projetos.html", iconeKey: "projetos", texto: "Projetos" });
        lista.push({ href: "/frequencia.html", iconeKey: "frequencia", texto: "Frequência" });
        if (usuario.tipoUsuario === "ADMIN") {
            lista.push({ href: "/relatorios.html", iconeKey: "relatorios", texto: "Relatórios" });
        }
        lista.push({ href: "/perfil.html", iconeKey: "perfil", texto: "Meu Perfil" });
        return lista;
    }

    function montar(usuario) {
        const atual = window.location.pathname;
        const links = itens(usuario).map(i => {
            const ativo = atual === i.href.split("?")[0] ? ' class="active"' : "";
            const iconeSvg = iconesSvg[i.iconeKey] || "";
            return `<li${ativo}><a href="${i.href}">${iconeSvg} <span>${i.texto}</span></a></li>`;
        }).join("");

        document.body.insertAdjacentHTML("afterbegin", `
            <div class="topbar">
                <div class="topbar-left">
                    <strong>SisBolsa</strong>
                    <div class="topbar-status">
                        <span class="status-dot"></span>
                        <span>SISTEMA ATIVO</span>
                    </div>
                </div>
                <div class="topbar-right">
                    <span>${Util.escapar(usuario.nome || "Usuário")} &bull; <strong>${Util.escapar(papel(usuario))}</strong></span>
                </div>
            </div>

            <aside class="sidebar">
                <h2>SisBolsa</h2>
                <div class="user-profile-widget">
                    ${avatar(usuario)}
                    <div class="profile-info">
                        <span class="profile-name">${Util.escapar(usuario.nome)}</span>
                        <span class="profile-role">${Util.escapar(papel(usuario))}</span>
                    </div>
                </div>
                <ul>${links}</ul>
                <a href="#" id="btn-sair" class="logout-btn">
                    ${iconesSvg.sair}
                    <span>Sair da conta</span>
                </a>
            </aside>
        `);

        document.getElementById("btn-sair").addEventListener("click", (e) => {
            e.preventDefault();
            Sessao.sair();
        });
    }

    return { montar };
})();
