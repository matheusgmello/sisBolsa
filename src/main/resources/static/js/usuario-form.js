/*
 * mesma tela serve para criar e editar. o que muda e a presenca do parametro id
 * na url e a senha, que na edicao pode ficar em branco para nao alterar.
 */
(async () => {
    const usuario = await Sessao.iniciar();

    const id = Util.parametro("id");
    const tipoUrl = Util.parametro("tipo") || "BOLSISTA";
    const edicao = Boolean(id);

    const campo = (nome) => document.getElementById(nome);
    const grupo = (nome) => document.getElementById("group-" + nome);

    if (Sessao.ehBolsista() && (!edicao || Number(id) !== usuario.id)) {
        window.location.href = "/dashboard.html";
        return;
    }

    const rotulo = Sessao.ehAdmin() ? "Usuário" : "Bolsista";
    document.getElementById("titulo").textContent =
        `${edicao ? "Editar" : "Cadastrar Novo"} ${rotulo}`;

    if (Sessao.ehAdmin()) {
        grupo("tipo").hidden = false;
    }
    if (edicao) {
        grupo("foto").hidden = false;
        campo("senha-obrigatoria").hidden = true;
        campo("senha").placeholder = "Deixe em branco para não alterar";
    } else {
        campo("senha").required = true;
    }

    /* os selects saem da api: cargo vem do enum e laboratorio do que o usuario alcanca */
    const [labs, cargos] = await Promise.all([
        Api.get("/laboratorios"),
        Api.get("/usuarios/cargos")
    ]);
    campo("laboratorioId").innerHTML =
        `<option value="">Selecione um laboratório...</option>` +
        labs.map(l => `<option value="${l.id}">${Util.escapar(l.nome)}</option>`).join("");
    campo("cargo").innerHTML =
        `<option value="">Selecione um cargo...</option>` +
        cargos.map(c => `<option value="${c.valor}">${Util.escapar(c.descricao)}</option>`).join("");

    if (edicao) {
        try {
            const u = await Api.get(`/usuarios/${id}?tipo=${tipoUrl}`);
            campo("nome").value = u.nome || "";
            campo("email").value = u.email || "";
            campo("dataNascimento").value = u.dataNascimento || "";
            campo("curso").value = u.curso || "";
            campo("matricula").value = u.matricula || "";
            campo("fotoUrl").value = u.fotoUrl || "";
            campo("tipoUsuario").value = u.tipoUsuario;
            campo("laboratorioId").value = u.laboratorioId || "";
            campo("cargo").value = u.cargo || "";
        } catch (e) {
            Util.aviso(e.message);
            return;
        }
    } else {
        campo("tipoUsuario").value = Sessao.ehAdmin() ? "BOLSISTA" : "BOLSISTA";
    }

    alternarCampos();
    campo("tipoUsuario").addEventListener("change", alternarCampos);
    campo("laboratorioId").addEventListener("change", alternarCampos);

    /*
     * professor nao tem curso, matricula, data de nascimento nem lab proprio -
     * esconder e desligar evita mandar dado que a api ignoraria de qualquer jeito.
     */
    function alternarCampos() {
        const ehProfessor = campo("tipoUsuario").value === "PROFESSOR";
        const temLab = campo("laboratorioId").value !== "";

        [["dataNascimento", "dataNascimento"], ["curso", "curso"], ["matricula", "matricula"]]
            .forEach(([g, c]) => {
                grupo(g).style.display = ehProfessor ? "none" : "";
                campo(c).disabled = ehProfessor;
                campo(c).required = !ehProfessor;
            });

        grupo("laboratorio").style.display = ehProfessor ? "none" : "";
        campo("laboratorioId").disabled = ehProfessor;

        const mostraCargo = !ehProfessor && temLab;
        grupo("cargo").style.display = mostraCargo ? "" : "none";
        campo("cargo").disabled = !mostraCargo;
        if (!mostraCargo) campo("cargo").value = "";
    }

    /* Mostrar / Ocultar Senha */
    document.querySelectorAll(".password-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            const ehPassword = input.type === "password";
            input.type = ehPassword ? "text" : "password";

            btn.innerHTML = ehPassword
                ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
                : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
        });
    });

    document.getElementById("formBolsista").addEventListener("submit", async (e) => {
        e.preventDefault();
        Util.limpaAviso();

        const nome = campo("nome").value.trim();
        const senha = campo("senha").value;
        if (nome.length < 3) {
            Util.aviso("O nome deve ter pelo menos 3 caracteres.");
            return;
        }
        if (!edicao && senha.length < 6) {
            Util.aviso("A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        if (edicao && senha.length > 0 && senha.length < 6) {
            Util.aviso("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        const ehProfessor = campo("tipoUsuario").value === "PROFESSOR";
        const corpo = {
            nome,
            email: campo("email").value.trim(),
            senha: senha || null,
            tipoUsuario: campo("tipoUsuario").value,
            fotoUrl: campo("fotoUrl").value || null,
            dataNascimento: ehProfessor ? null : (campo("dataNascimento").value || null),
            curso: ehProfessor ? null : campo("curso").value,
            matricula: ehProfessor ? null : campo("matricula").value,
            laboratorioId: ehProfessor || !campo("laboratorioId").value ? null : Number(campo("laboratorioId").value),
            cargo: campo("cargo").value || null
        };

        const btnSubmit = document.getElementById("btn-submit");
        if (btnSubmit) {
            btnSubmit.classList.add("is-loading");
            btnSubmit.disabled = true;
        }

        try {
            if (edicao) {
                await Api.put(`/usuarios/${id}`, corpo);
            } else {
                await Api.post("/usuarios", corpo);
            }
            window.location.href = "/usuarios.html";
        } catch (erro) {
            if (btnSubmit) {
                btnSubmit.classList.remove("is-loading");
                btnSubmit.disabled = false;
            }
            Util.aviso(erro.message);
        }
    });
})();
