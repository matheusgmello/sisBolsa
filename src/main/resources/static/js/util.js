/*
 * helpers de tela. o escapar() e o mais importante: todo dado que vem da api
 * passa por ele antes de virar html, senao um nome com "<script>" vira xss.
 */
const Util = {

    escapar(valor) {
        if (valor === null || valor === undefined) {
            return "";
        }
        return String(valor)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    },

    /* a api devolve data ISO (2026-08-21); a tela mostra no formato brasileiro */
    data(iso) {
        if (!iso) {
            return "";
        }
        const [ano, mes, dia] = iso.split("-");
        return `${dia}/${mes}/${ano}`;
    },

    numero(valor, casas = 1) {
        return Number(valor || 0).toFixed(casas).replace(".", ",");
    },

    parametro(nome) {
        return new URLSearchParams(window.location.search).get(nome);
    },

    /* mensagem de erro/sucesso no topo do conteudo, some sozinha no sucesso */
    aviso(texto, tipo = "erro") {
        const alvo = document.getElementById("avisos");
        if (!alvo) {
            alert(texto);
            return;
        }
        const classe = tipo === "sucesso" ? "success-msg" : "error-msg";
        const icone = tipo === "sucesso" ? "fa-check-circle" : "fa-exclamation-triangle";
        alvo.innerHTML = `<div class="${classe}"><i class="fas ${icone}"></i> ${Util.escapar(texto)}</div>`;
        if (tipo === "sucesso") {
            setTimeout(() => { alvo.innerHTML = ""; }, 4000);
        }
    },

    limpaAviso() {
        const alvo = document.getElementById("avisos");
        if (alvo) {
            alvo.innerHTML = "";
        }
    }
};
