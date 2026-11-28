(function () {
  function redirigirLogin() {
    var aviso = document.getElementById("avisoSinSesion");
    var pagina = document.getElementById("page-wrapper");
    if (pagina) {
      pagina.hidden = true;
    }
    if (aviso) {
      aviso.hidden = false;
    }
    window.location.replace("login.html");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var sesion = typeof window.obtenerSesion === "function" ? window.obtenerSesion() : null;
    if (!sesion) {
      redirigirLogin();
      return;
    }

    var aviso = document.getElementById("avisoSinSesion");
    var pagina = document.getElementById("page-wrapper");
    if (aviso) {
      aviso.hidden = true;
    }
    if (pagina) {
      pagina.hidden = false;
    }

    var info = document.getElementById("infoSesionPanel");
    if (info) {
      info.textContent = "Usuario: " + (sesion.usuario || "—") + " | Rol: " + sesion.rol;
    }

    if (typeof window.aplicarVisibilidadModulos === "function") {
      window.aplicarVisibilidadModulos("#gridModulos", "[data-modulo]");
    }

    if (typeof window.montarNavbarApp === "function" && document.getElementById("orsNavLinks")) {
      window.montarNavbarApp({
        incluirInicio: true,
        incluirPanel: true,
        destinoLogout: "index.html"
      });
    }

    var btnSalir = document.getElementById("btnCerrarSesionPanel");
    if (btnSalir) {
      btnSalir.addEventListener("click", function () {
        if (typeof window.cerrarSesion === "function") {
          window.cerrarSesion("index.html");
        } else {
          window.location.replace("index.html");
        }
      });
    }
  });
})();
