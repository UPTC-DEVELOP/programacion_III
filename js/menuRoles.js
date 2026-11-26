document.addEventListener("DOMContentLoaded", async () => {
    const lista = document.querySelector(".lista-crud");
    const aviso = document.createElement("p");
    aviso.setAttribute("role", "status");
    lista.before(aviso);
    lista.style.display = "none";
    try {
        const r = await fetch(CONFIG.API_BASE + "perfil", {
            headers: { authorization: Sesion.token(), Accept: "application/json" }, cache: "no-store"
        });
        const json = await r.json();
        if (!r.ok || json.state !== "OK") throw new Error("No se pudo verificar tu acceso. Vuelve a iniciar sesión.");
        const rol = json.data.rol;
        let visibles = 0;
        for (const item of lista.querySelectorAll("li")) {
            const enlace = item.querySelector("a");
            const pagina = enlace && new URL(enlace.href).pathname.split("/").pop();
            const permitido = rol === "admin" || (rol === "recepcion" && pagina === "facturacion.html");
            item.style.display = permitido ? "" : "none";
            if (permitido) visibles++;
        }
        aviso.textContent = visibles ? "" : "Todavía no hay módulos habilitados para tu rol.";
        lista.style.display = "";
    } catch (error) {
        aviso.textContent = error.message;
    }
});
