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
        const iconeSvg = tipo === "sucesso"
            ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
            : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

        alvo.innerHTML = `<div class="${classe}">${iconeSvg} <span>${Util.escapar(texto)}</span></div>`;
        if (tipo === "sucesso") {
            setTimeout(() => { alvo.innerHTML = ""; }, 4000);
        }
    },

    limpaAviso() {
        const alvo = document.getElementById("avisos");
        if (alvo) {
            alvo.innerHTML = "";
        }
    },

    /* Controle de Modal Acessivel */
    abrirModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
        const primeiroCampo = modal.querySelector("input:not([type=hidden]), select, textarea, button:not(.modal-close-btn)");
        if (primeiroCampo) primeiroCampo.focus();
    },

    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove("active");
        document.body.style.overflow = "";
    },

    configurarModais() {
        document.querySelectorAll(".modal-overlay").forEach(overlay => {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) {
                    Util.fecharModal(overlay.id);
                }
            });
        });
        document.querySelectorAll("[data-fecha-modal]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const modalId = btn.dataset.fechaModal;
                Util.fecharModal(modalId);
            });
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                const modalAtivo = document.querySelector(".modal-overlay.active");
                if (modalAtivo) Util.fecharModal(modalAtivo.id);
            }
        });
    }
};

