(function () {
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

  function sincronizarBotonesAcceso() {
    if (typeof window.actualizarBotonAccesoPublico === "function") {
      window.actualizarBotonAccesoPublico("#btnAccesoPublico");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    sincronizarBotonesAcceso();
    actualizarScrollNavbar();
    window.addEventListener("scroll", actualizarScrollNavbar, { passive: true });
  });
})();
