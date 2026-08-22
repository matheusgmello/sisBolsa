/*
 * menu lateral e barra do topo, iguais em todas as telas internas.
 * substitui o antigo sidebar.tag do jsp.
 */
const Sidebar = (() => {

    function avatar(usuario) {
        if (usuario.fotoUrl) {
            return `<img src="${Util.escapar(usuario.fotoUrl)}" alt="Avatar" class="profile-img"
                         style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--primary-color);">`;
        }
        return `<div class="profile-placeholder"
                     style="width:40px;height:40px;border-radius:50%;background-color:#e2e8f0;color:var(--text-muted);
                            display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">
                    <i class="fas fa-user"></i>
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
            { href: "/dashboard.html", icone: "fa-home", texto: "Dashboard" }
        ];

        if (gerencia) {
            lista.push({
                href: "/usuarios.html",
                icone: "fa-user-graduate",
                texto: usuario.tipoUsuario === "ADMIN" ? "Usuários" : "Bolsistas"
            });
            lista.push({ href: "/laboratorios.html", icone: "fa-flask", texto: "Laboratórios" });
        } else if (usuario.laboratorioId) {
            lista.push({
                href: `/laboratorio-detalhes.html?id=${usuario.laboratorioId}`,
                icone: "fa-flask",
                texto: "Meu Laboratório"
            });
        }

        lista.push({ href: "/projetos.html", icone: "fa-project-diagram", texto: "Projetos" });
        lista.push({ href: "/frequencia.html", icone: "fa-calendar-check", texto: "Frequência" });
        if (usuario.tipoUsuario === "ADMIN") {
            lista.push({ href: "/relatorios.html", icone: "fa-chart-bar", texto: "Relatórios" });
        }
        lista.push({ href: "/perfil.html", icone: "fa-user-cog", texto: "Editar Perfil" });
        return lista;
    }

    function montar(usuario) {
        const atual = window.location.pathname;
        const links = itens(usuario).map(i => {
            const ativo = atual === i.href.split("?")[0] ? ' class="active"' : "";
            return `<li${ativo}><a href="${i.href}"><i class="fas ${i.icone}"></i> ${i.texto}</a></li>`;
        }).join("");

        document.body.insertAdjacentHTML("afterbegin", `
            <div class="topbar">
                <div class="topbar-left">
                    <span>[SYS: SISBOLSA]</span>
                    <div class="topbar-status">
                        <span class="status-dot"></span>
                        <span>LIVE</span>
                    </div>
                </div>
                <div class="topbar-right">
                    <span>[OP: ${Util.escapar((usuario.nome || "DESCONHECIDO").toUpperCase())} // ROLE: ${Util.escapar(usuario.tipoUsuario)}]</span>
                </div>
            </div>

            <div class="sidebar">
                <h2>SisBolsa</h2>
                <div class="user-profile-widget">
                    ${avatar(usuario)}
                    <div class="profile-info">
                        <span class="profile-name">${Util.escapar(usuario.nome)}</span>
                        <span class="profile-role">${Util.escapar(papel(usuario))}</span>
                    </div>
                </div>
                <ul>${links}</ul>
                <a href="#" id="btn-sair" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Sair</a>
            </div>
        `);

        document.getElementById("btn-sair").addEventListener("click", (e) => {
            e.preventDefault();
            Sessao.sair();
        });
    }

    return { montar };
})();
