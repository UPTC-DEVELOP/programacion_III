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

  function activarHoverRosadoModulos() {
    var grid = document.getElementById("gridModulos");
    if (!grid) return;

    var tarjetas = grid.querySelectorAll(".panel-tarjeta[data-modulo]");
    for (var i = 0; i < tarjetas.length; i++) {
      (function (tarjeta) {
        tarjeta.addEventListener("mouseenter", function () {
          tarjeta.classList.add("is-rosa-hover");
        });
        tarjeta.addEventListener("mouseleave", function () {
          tarjeta.classList.remove("is-rosa-hover");
        });
        tarjeta.addEventListener("focusin", function () {
          tarjeta.classList.add("is-rosa-hover");
        });
        tarjeta.addEventListener("focusout", function () {
          tarjeta.classList.remove("is-rosa-hover");
        });
      })(tarjetas[i]);
    }
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

    activarHoverRosadoModulos();
  });
})();
