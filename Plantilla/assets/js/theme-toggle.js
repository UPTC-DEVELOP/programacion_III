(function () {
  var CLAVE = "olimac_theme_mode";

  function aplicarTema(modoOscuro) {
    var root = document.documentElement;
    if (modoOscuro) {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }

    var botones = document.querySelectorAll(".ors-theme-toggle");
    for (var i = 0; i < botones.length; i++) {
      var btn = botones[i];
      btn.setAttribute("aria-pressed", modoOscuro ? "true" : "false");
      btn.setAttribute("title", modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      btn.setAttribute(
        "aria-label",
        modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      );
    }
  }

  function leerPreferencia() {
    try {
      return localStorage.getItem(CLAVE) === "dark";
    } catch (e) {
      return false;
    }
  }

  function guardarPreferencia(modoOscuro) {
    try {
      localStorage.setItem(CLAVE, modoOscuro ? "dark" : "light");
    } catch (e) {}
  }

  function alternarTema() {
    var oscuro = !document.documentElement.classList.contains("theme-dark");
    aplicarTema(oscuro);
    guardarPreferencia(oscuro);
  }

  aplicarTema(leerPreferencia());

  document.addEventListener("DOMContentLoaded", function () {
    aplicarTema(leerPreferencia());
    var botones = document.querySelectorAll(".ors-theme-toggle");
    for (var i = 0; i < botones.length; i++) {
      botones[i].addEventListener("click", function (evento) {
        evento.preventDefault();
        alternarTema();
      });
    }
  });
})();
