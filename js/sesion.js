// Manejo de la sesion se guarda solo el token (nunca la contraseña) y vence a las 12 h
// sessionStorage se borra al cerrar la pestaña
const Sesion = {
    guardar(token, usuario) {
        try {
            sessionStorage.setItem("ag_panther_token", token);
            sessionStorage.setItem("ag_panther_usuario", usuario);
            sessionStorage.setItem("ag_panther_expira", String(Date.now() + CONFIG.SESION_MS));
        } catch (e) {
            this.limpiar();
            throw new Error("Habilita el almacenamiento de sesión en este navegador.");
        }
    },
    token() {
        try { return sessionStorage.getItem("ag_panther_token"); } catch (e) { return null; }
    },
    usuario() {
        try { return sessionStorage.getItem("ag_panther_usuario"); } catch (e) { return null; }
    },
    activa() {
        try {
            const expira = Number(sessionStorage.getItem("ag_panther_expira") || 0);
            return Boolean(this.token()) && Date.now() < expira;
        } catch (e) { return false; }
    },
    limpiar() {
        try {
            ["ag_panther_token", "ag_panther_usuario", "ag_panther_expira"].forEach((k) => sessionStorage.removeItem(k));
        } catch (e) { }
    },
    async cerrar() {
        const token = this.token();
        if (token) {
            const control = new AbortController();
            const limite = setTimeout(() => control.abort(), CONFIG.TIEMPO_MAXIMO_MS);
            try {
                const respuesta = await fetch(CONFIG.API_BASE + "useraction/logout", {
                    method: "POST",
                    headers: { authorization: token },
                    signal: control.signal
                });
                if (!respuesta.ok && respuesta.status !== 401) throw new Error("Cierre pendiente");
            } catch (error) {
                window.alert("Panther no pudo confirmar el cierre. Comprueba la conexión y vuelve a pulsar Cerrar sesión.");
                return;
            } finally {
                clearTimeout(limite);
            }
        }
        this.limpiar();
        window.location.href = CONFIG.PAGINA_LOGIN;
    },
    // Llamar al inicio de las paginas protegidas
    exigir() {
        if (!this.activa()) {
            this.limpiar();
            window.location.replace(CONFIG.PAGINA_LOGIN);
        }
    }
};
