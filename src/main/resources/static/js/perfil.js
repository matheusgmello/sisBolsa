(async () => {
    const usuario = await Sessao.iniciar();
    const campo = (n) => document.getElementById(n);

    const avatarContainer = document.getElementById("avatar-container");
    const metaNome = document.getElementById("meta-nome");
    const metaTipo = document.getElementById("meta-tipo");
    const btnSalvar = document.getElementById("btn-salvar-perfil");
    const formPerfil = document.getElementById("formPerfil");

    preencher(usuario);

    function preencher(u) {
        metaNome.textContent = u.nome || "Usuário";
        
        let classeBadge = "badge-bolsista";
        if (u.tipoUsuario === "ADMIN") classeBadge = "badge-admin";
        else if (u.tipoUsuario === "PROFESSOR") classeBadge = "badge-professor";
        
        metaTipo.className = `badge ${classeBadge}`;
        metaTipo.textContent = u.tipoUsuario || "BOLSISTA";

        campo("nome").value = u.nome || "";
        campo("email").value = u.email || "";
        campo("fotoUrl").value = u.fotoUrl || "";

        atualizarAvatar(u.fotoUrl);
    }

    function atualizarAvatar(url) {
        const placeholderHtml = `
            <div class="avatar-placeholder-large" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>`;

        if (url && url.trim()) {
            const img = document.createElement("img");
            img.src = url.trim();
            img.alt = "Foto de perfil";
            img.className = "avatar-large";
            img.onload = () => {
                avatarContainer.innerHTML = "";
                avatarContainer.appendChild(img);
            };
            img.onerror = () => {
                avatarContainer.innerHTML = placeholderHtml;
            };
        } else {
            avatarContainer.innerHTML = placeholderHtml;
        }
    }

    /* Atualização ao vivo da foto ao digitar a URL */
    campo("fotoUrl").addEventListener("input", (e) => {
        atualizarAvatar(e.target.value);
    });

    /* Mostrar / Ocultar Senhas */
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

    formPerfil.addEventListener("submit", async (e) => {
        e.preventDefault();
        Util.limpaAviso();

        const nome = campo("nome").value.trim();
        const email = campo("email").value.trim();
        const senhaAtual = campo("senhaAtual").value;
        const novaSenha = campo("senha").value;
        const confirmaSenha = campo("confirmaSenha").value;

        if (!nome || nome.length < 3) {
            Util.aviso("O nome completo deve ter pelo menos 3 caracteres.");
            return;
        }

        if (!email) {
            Util.aviso("Informe um e-mail válido.");
            return;
        }

        if (novaSenha || confirmaSenha || senhaAtual) {
            if (!senhaAtual) {
                Util.aviso("Informe a senha atual para autorizar a alteração.");
                campo("senhaAtual").focus();
                return;
            }
            if (novaSenha.length < 6) {
                Util.aviso("A nova senha deve ter pelo menos 6 caracteres.");
                campo("senha").focus();
                return;
            }
            if (novaSenha !== confirmaSenha) {
                Util.aviso("A confirmação da nova senha não confere.");
                campo("confirmaSenha").focus();
                return;
            }
        }

        btnSalvar.classList.add("is-loading");
        btnSalvar.disabled = true;

        try {
            const atualizado = await Api.put("/auth/perfil", {
                nome,
                email,
                fotoUrl: campo("fotoUrl").value.trim(),
                senhaAtual,
                senha: novaSenha,
                confirmaSenha
            });

            preencher(atualizado);
            ["senhaAtual", "senha", "confirmaSenha"].forEach(c => campo(c).value = "");
            Util.aviso("Perfil atualizado com sucesso!", "sucesso");
        } catch (erro) {
            Util.aviso(erro.message);
        } finally {
            btnSalvar.classList.remove("is-loading");
            btnSalvar.disabled = false;
        }
    });
})();
