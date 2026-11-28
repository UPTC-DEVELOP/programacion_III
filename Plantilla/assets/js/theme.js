(function () {
  "use strict";

  var CLAVE = "olimac-theme";
  var CLAVE_LEGACY = "olimac_theme_mode";

  function leerTema() {
    try {
      var actual = localStorage.getItem(CLAVE);
      if (actual === "dark" || actual === "light") {
        return actual;
      }
      var legacy = localStorage.getItem(CLAVE_LEGACY);
      if (legacy === "dark" || legacy === "light") {
        localStorage.setItem(CLAVE, legacy);
        return legacy;
      }
    } catch (e) {}
    return "light";
  }

  function guardarTema(modo) {
    try {
      localStorage.setItem(CLAVE, modo);
      localStorage.setItem(CLAVE_LEGACY, modo);
    } catch (e) {}
  }

  function esOscuro() {
    return (
      document.documentElement.classList.contains("dark-mode") ||
      document.documentElement.classList.contains("theme-dark") ||
      (document.body && document.body.classList.contains("dark-mode"))
    );
  }

  function aplicarTema(modoOscuro) {
    var root = document.documentElement;
    var body = document.body;
    if (modoOscuro) {
      root.classList.add("dark-mode", "theme-dark");
      if (body) body.classList.add("dark-mode");
    } else {
      root.classList.remove("dark-mode", "theme-dark");
      if (body) body.classList.remove("dark-mode");
    }
    sincronizarBotones(modoOscuro);
  }

  function sincronizarBotones(modoOscuro) {
    var botones = document.querySelectorAll(".ors-theme-toggle, .btn-theme-toggle");
    for (var i = 0; i < botones.length; i++) {
      var btn = botones[i];
      btn.classList.add("btn-theme-toggle", "ors-theme-toggle");
      btn.setAttribute("aria-pressed", modoOscuro ? "true" : "false");
      btn.setAttribute("title", modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      btn.setAttribute(
        "aria-label",
        modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      );
    }
  }

  function crearBotonTema() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ors-theme-toggle btn-theme-toggle";
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML =
      '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="12" r="4"></circle>' +
      '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6"></path>' +
      "</svg>" +
      '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M19.5 13.2A7.5 7.5 0 0 1 10.8 4.5 6.8 6.8 0 1 0 19.5 13.2z"></path>' +
      "</svg>";
    return btn;
  }

  function asegurarToggleEnNavbar() {
    if (document.querySelector(".ors-theme-toggle, .btn-theme-toggle")) {
      return;
    }
    var inner = document.querySelector(".ors-navbar__inner");
    if (!inner) return;

    var brand = inner.querySelector(".ors-brand");
    if (!brand) return;

    var btn = crearBotonTema();
    var cluster = document.createElement("div");
    cluster.className = "ors-brand-cluster";
    brand.parentNode.insertBefore(cluster, brand);
    cluster.appendChild(btn);
    cluster.appendChild(brand);
  }

  function enlazarBotones() {
    var botones = document.querySelectorAll(".ors-theme-toggle, .btn-theme-toggle");
    for (var i = 0; i < botones.length; i++) {
      (function (boton) {
        if (boton._orsThemeBound) return;
        boton._orsThemeBound = true;
        boton.addEventListener("click", function (evento) {
          evento.preventDefault();
          var siguiente = !esOscuro();
          aplicarTema(siguiente);
          guardarTema(siguiente ? "dark" : "light");
        });
      })(botones[i]);
    }
  }

  function iniciar() {
    aplicarTema(leerTema() === "dark");
    asegurarToggleEnNavbar();
    sincronizarBotones(esOscuro());
    enlazarBotones();
  }

  aplicarTema(leerTema() === "dark");

  if (!document.body) {
    document.addEventListener(
      "readystatechange",
      function onReady() {
        if (document.body) {
          aplicarTema(leerTema() === "dark");
          document.removeEventListener("readystatechange", onReady);
        }
      },
      false
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

  window.orsTheme = {
    apply: aplicarTema,
    toggle: function () {
      var siguiente = !esOscuro();
      aplicarTema(siguiente);
      guardarTema(siguiente ? "dark" : "light");
    },
    isDark: esOscuro
  };
})();
