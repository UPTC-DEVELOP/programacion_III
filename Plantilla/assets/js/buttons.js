(function () {
  var SELECTOR =
    'a.button, .button, button:not(.ors-theme-toggle), .btn, input[type="submit"], input[type="button"], input[type="reset"], .login-boton, .login-toggle-pass, .panel-btn-salir, .rep-boton, .inv-boton, .ord-boton, .ors-nav__cta';
  var DURACION_PRESIONADO = 250;

  function esExcluido(nodo) {
    if (!nodo || !nodo.closest) {
      return true;
    }
    if (
      nodo.classList &&
      (nodo.classList.contains("ors-theme-toggle") ||
        nodo.classList.contains("btn-theme-toggle"))
    ) {
      return true;
    }
    if (document.body.classList.contains("homepage") && nodo.closest(".ors-navbar")) {
      return true;
    }
    return false;
  }

  function resolverDesdeNodo(nodo) {
    if (!nodo || nodo.nodeType !== 1 || !nodo.closest) {
      return null;
    }
    var boton = nodo.matches(SELECTOR) ? nodo : nodo.closest(SELECTOR);
    if (!boton || esExcluido(boton)) {
      return null;
    }
    return boton;
  }

  function lanzarRipple(boton, evento) {
    var tag = (boton.tagName || "").toUpperCase();
    if (tag === "INPUT") {
      return;
    }
    var estilo = window.getComputedStyle(boton);
    if (estilo.position === "static") {
      boton.style.position = "relative";
    }
    if (estilo.overflow === "visible") {
      boton.style.overflow = "hidden";
    }

    var rect = boton.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var ripple = document.createElement("span");
    ripple.className = "btn-ripple";
    ripple.style.width = size + "px";
    ripple.style.height = size + "px";

    var clientX = evento.clientX;
    var clientY = evento.clientY;
    if ((evento.touches && evento.touches[0]) || (evento.changedTouches && evento.changedTouches[0])) {
      var touch = (evento.touches && evento.touches[0]) || evento.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    }

    var x = (typeof clientX === "number" ? clientX : rect.left + rect.width / 2) - rect.left - size / 2;
    var y = (typeof clientY === "number" ? clientY : rect.top + rect.height / 2) - rect.top - size / 2;
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";

    boton.appendChild(ripple);
    window.setTimeout(function () {
      if (ripple && ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 560);
  }

  function activarPresionado(boton, evento) {
    if (boton.disabled || boton.getAttribute("aria-disabled") === "true") {
      return;
    }
    boton.classList.add("btn-pressed");
    lanzarRipple(boton, evento || {});
    window.clearTimeout(boton._orsBtnTimer);
    boton._orsBtnTimer = window.setTimeout(function () {
      boton.classList.remove("btn-pressed");
    }, DURACION_PRESIONADO);
  }

  document.addEventListener(
    "pointerdown",
    function (evento) {
      var boton = resolverDesdeNodo(evento.target);
      if (!boton) {
        return;
      }
      activarPresionado(boton, evento);
    },
    true
  );

  document.addEventListener(
    "keydown",
    function (evento) {
      if (evento.key !== "Enter" && evento.key !== " ") {
        return;
      }
      var boton = resolverDesdeNodo(evento.target);
      if (!boton) {
        return;
      }
      activarPresionado(boton, evento);
    },
    true
  );
})();
