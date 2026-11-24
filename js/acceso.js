Sesion.exigir();

window.addEventListener("pageshow", () => Sesion.exigir());
document.addEventListener("DOMContentLoaded", () => {
    const botonSalir = document.getElementById("btnSalir");
    if (botonSalir) {
        botonSalir.addEventListener("click", () => Sesion.cerrar());
    }
});
