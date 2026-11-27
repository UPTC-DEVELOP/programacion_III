Sesion.exigir();

window.addEventListener("pageshow", () => Sesion.exigir());
document.addEventListener("DOMContentLoaded", () => {
    const cabecera = document.querySelector("[data-cabecera-sesion]");
    if (cabecera) {
        cabecera.innerHTML = `
        <div class="header-logo">
            <img src="img/logo.jpeg" alt="Logo de AutoGestión ERP">
        </div>
        <nav aria-label="Sesión">
            <span class="sesion-info" id="usuarioSesion"></span>
            <a class="btn-nav" href="modulos.html">Volver a módulos</a>
            <button type="button" class="btn-salir" id="btnSalir">Cerrar sesión</button>
        </nav>`;
        if (cabecera.hasAttribute("data-panel")) {
            const volver = cabecera.querySelector("nav a");
            volver.href = "index.html";
            volver.textContent = "Volver al inicio";
        }
        cabecera.querySelector("#usuarioSesion").textContent = Sesion.usuario() || "";
    }
    const botonSalir = document.getElementById("btnSalir");
    if (botonSalir) {
        botonSalir.addEventListener("click", () => Sesion.cerrar());
    }
});
