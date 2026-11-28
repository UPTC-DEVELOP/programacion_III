(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var banner = document.getElementById("banner");
    var card = document.getElementById("heroFranja");
    var fondo = banner ? banner.querySelector(".hero-bg-shift") : null;

    if (card) {
      function activar() {
        card.classList.add("hero-neon-pink");
      }

      function desactivar() {
        card.classList.remove("hero-neon-pink");
      }

      card.addEventListener("mouseenter", activar);
      card.addEventListener("mouseleave", desactivar);
      card.addEventListener("focusin", activar);
      card.addEventListener("focusout", function (evento) {
        if (!card.contains(evento.relatedTarget)) {
          desactivar();
        }
      });
      card.addEventListener("touchstart", activar, { passive: true });
      card.addEventListener("touchend", desactivar, { passive: true });
      card.addEventListener("touchcancel", desactivar, { passive: true });
    }

    if (!banner || !fondo) {
      return;
    }

    banner.addEventListener("mousemove", function (evento) {
      var rect = banner.getBoundingClientRect();
      var x = (evento.clientX - rect.left) / rect.width - 0.5;
      var y = (evento.clientY - rect.top) / rect.height - 0.5;
      banner.classList.add("is-zooming");
      fondo.style.transform =
        "scale(1.12) translate(" + (x * 14).toFixed(2) + "px, " + (y * 10).toFixed(2) + "px)";
    });

    banner.addEventListener("mouseleave", function () {
      banner.classList.remove("is-zooming");
      fondo.style.transform = "scale(1.05) translate(0, 0)";
    });
  });
})();
