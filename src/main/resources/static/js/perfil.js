(async () => {
    const usuario = await Sessao.iniciar();
    const campo = (n) => document.getElementById(n);

    preencher(usuario);

    function preencher(u) {
        document.getElementById("cabecalho").innerHTML = `
            ${u.fotoUrl
                ? `<img src="${Util.escapar(u.fotoUrl)}" alt="Foto de perfil" class="avatar-large">`
                : `<div class="avatar-placeholder-large"><i class="fas fa-user"></i></div>`}
            <div class="profile-meta">
                <h2>${Util.escapar(u.nome)}</h2>
                <span class="badge badge-role">${Util.escapar(u.tipoUsuario)}</span>
            </div>`;
        campo("nome").value = u.nome || "";
        campo("email").value = u.email || "";
        campo("fotoUrl").value = u.fotoUrl || "";
        campo("bio").value = u.bio || "";
    }

    document.getElementById("formPerfil").addEventListener("submit", async (e) => {
        e.preventDefault();
        Util.limpaAviso();

        try {
            const atualizado = await Api.put("/auth/perfil", {
                nome: campo("nome").value,
                email: campo("email").value,
                fotoUrl: campo("fotoUrl").value,
                bio: campo("bio").value,
                senhaAtual: campo("senhaAtual").value,
                senha: campo("senha").value,
                confirmaSenha: campo("confirmaSenha").value
            });
            preencher(atualizado);
            ["senhaAtual", "senha", "confirmaSenha"].forEach(c => campo(c).value = "");
            Util.aviso("Perfil atualizado com sucesso.", "sucesso");
        } catch (erro) {
            Util.aviso(erro.message);
        }
    });
})();
