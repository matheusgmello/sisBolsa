/*
 * wrapper unico sobre o fetch. concentra tres coisas que senao ficariam
 * repetidas em toda tela: mandar o cookie, tratar 401 e extrair a mensagem
 * de erro que a api devolve em {"mensagem": "..."}.
 */
const Api = (() => {

    async function requisicao(metodo, rota, corpo) {
        const opcoes = {
            method: metodo,
            /* o jwt vive num cookie httpOnly: precisa ser enviado explicitamente */
            credentials: "same-origin",
            headers: {}
        };
        if (corpo !== undefined) {
            opcoes.headers["Content-Type"] = "application/json";
            opcoes.body = JSON.stringify(corpo);
        }

        const resposta = await fetch("/api" + rota, opcoes);

        if (resposta.status === 401) {
            /* token expirou ou nao existe: volta pro login sem deixar a tela quebrada */
            window.location.href = "/index.html";
            throw new Error("Nao autenticado.");
        }

        if (resposta.status === 204) {
            return null;
        }

        const texto = await resposta.text();
        const dados = texto ? JSON.parse(texto) : null;

        if (!resposta.ok) {
            throw new Error(dados && dados.mensagem ? dados.mensagem : "Erro na requisicao.");
        }
        return dados;
    }

    return {
        get: (rota) => requisicao("GET", rota),
        post: (rota, corpo) => requisicao("POST", rota, corpo),
        put: (rota, corpo) => requisicao("PUT", rota, corpo),
        delete: (rota) => requisicao("DELETE", rota)
    };
})();
