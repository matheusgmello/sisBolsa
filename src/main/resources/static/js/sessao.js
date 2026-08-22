/*
 * guarda de sessao das telas internas.
 *
 * as paginas sao estaticas e publicas - elas nao carregam dado nenhum sozinhas.
 * quem protege de verdade e a api, que devolve 401 sem token valido. aqui so
 * descobrimos quem esta logado para montar o menu e esconder o que nao interessa.
 */
const Sessao = (() => {

    let usuario = null;

    async function iniciar() {
        try {
            usuario = await Api.get("/auth/me");
        } catch (e) {
            window.location.href = "/index.html";
            throw e;
        }
        Sidebar.montar(usuario);
        return usuario;
    }

    return {
        iniciar,
        get: () => usuario,
        ehAdmin: () => usuario && usuario.tipoUsuario === "ADMIN",
        ehProfessor: () => usuario && usuario.tipoUsuario === "PROFESSOR",
        ehBolsista: () => usuario && usuario.tipoUsuario === "BOLSISTA",
        gerencia: () => usuario && (usuario.tipoUsuario === "ADMIN" || usuario.tipoUsuario === "PROFESSOR"),

        async sair() {
            try {
                await Api.post("/auth/logout");
            } finally {
                window.location.href = "/index.html";
            }
        }
    };
})();
