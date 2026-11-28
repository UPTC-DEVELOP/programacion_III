(function () {
  "use strict";

  function actualizarScrollNavbar() {
    var barra = document.getElementById("orsNavbar");
    if (!barra) {
      return;
    }
    if (window.scrollY > 20) {
      barra.classList.add("navbar-scrolled");
    } else {
      barra.classList.remove("navbar-scrolled");
    }
  }

  function cerrarDropdowns(excepto) {
    var abiertos = document.querySelectorAll(".ors-nav__dropdown.is-open");
    for (var i = 0; i < abiertos.length; i++) {
      if (excepto && abiertos[i] === excepto) {
        continue;
      }
      abiertos[i].classList.remove("is-open");
      var toggle = abiertos[i].querySelector(".ors-nav__dropdown-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    }
  }

  function eliminarBurgerResidual() {
    var burgers = document.querySelectorAll(".ors-nav__burger");
    for (var i = 0; i < burgers.length; i++) {
      if (burgers[i].parentNode) {
        burgers[i].parentNode.removeChild(burgers[i]);
      }
    }
    document.body.classList.remove("ors-nav-open");
    var nav = document.querySelector(".ors-nav.ors-nav--app");
    if (nav) {
      nav.classList.remove("is-mobile-open");
    }
  }

  function enlazarInteracciones() {
    var nav = document.querySelector(".ors-nav.ors-nav--app");
    if (!nav || nav._orsNavBound) {
      return;
    }
    nav._orsNavBound = true;

    nav.addEventListener("click", function (evento) {
      var toggle = evento.target.closest(".ors-nav__dropdown-toggle");
      if (toggle && nav.contains(toggle)) {
        evento.preventDefault();
        var dropdown = toggle.closest(".ors-nav__dropdown");
        var abierto = dropdown.classList.contains("is-open");
        cerrarDropdowns();
        if (!abierto) {
          dropdown.classList.add("is-open");
          toggle.setAttribute("aria-expanded", "true");
        }
      }
    });

    nav.addEventListener("mouseover", function (evento) {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches === false) {
        return;
      }
      if (window.innerWidth < 981) {
        return;
      }
      var dropdown = evento.target.closest(".ors-nav__dropdown");
      if (!dropdown || !nav.contains(dropdown)) {
        return;
      }
      cerrarDropdowns(dropdown);
      dropdown.classList.add("is-open");
      var toggle = dropdown.querySelector(".ors-nav__dropdown-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
      }
    });

    nav.addEventListener("mouseleave", function () {
      if (window.innerWidth < 981) {
        return;
      }
      cerrarDropdowns();
    });

    document.addEventListener("click", function (evento) {
      if (!evento.target.closest(".ors-nav__dropdown")) {
        cerrarDropdowns();
      }
    });

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") {
        cerrarDropdowns();
      }
    });
  }

  function iniciarNavbarApp() {
    document.body.classList.add("ors-app");
    eliminarBurgerResidual();

    if (typeof window.montarNavbarApp === "function" && document.getElementById("orsNavLinks")) {
      window.montarNavbarApp({
        incluirInicio: true,
        incluirPanel: true,
        destinoLogout: "index.html"
      });
    }

    eliminarBurgerResidual();
    enlazarInteracciones();
    actualizarScrollNavbar();
  }

  document.addEventListener("DOMContentLoaded", function () {
    iniciarNavbarApp();
    window.addEventListener("scroll", actualizarScrollNavbar, { passive: true });
  });

  window.addEventListener("ors-navbar-ready", function () {
    eliminarBurgerResidual();
    enlazarInteracciones();
  });
})();
