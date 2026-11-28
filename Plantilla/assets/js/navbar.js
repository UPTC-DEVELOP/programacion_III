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

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("ors-app");

    if (typeof window.montarNavbarApp === "function" && document.getElementById("orsNavLinks")) {
      window.montarNavbarApp({
        incluirInicio: true,
        incluirPanel: true,
        destinoLogout: "index.html"
      });
    }

    actualizarScrollNavbar();
    window.addEventListener("scroll", actualizarScrollNavbar, { passive: true });
  });
})();
