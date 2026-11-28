(function () {
  function mostrarMensaje(texto, tipo) {
    var caja = document.getElementById("mensajeLogin");
    if (!caja) {
      return;
    }
    caja.hidden = !texto;
    caja.textContent = texto || "";
    caja.className = "login-mensaje" + (tipo === "ok" ? " login-mensaje-ok" : " login-mensaje-error");
  }

  function setCargando(activo) {
    var btn = document.getElementById("btnIngresar");
    if (!btn) {
      return;
    }
    btn.disabled = Boolean(activo);
    btn.textContent = activo ? "Ingresando..." : "Ingresar";
  }

  function activarTemaPastel() {
    document.body.classList.add("theme-pastel-pink");
  }

  function desactivarTemaPastel() {
    document.body.classList.remove("theme-pastel-pink");
  }

  function enlazarTemaPastel(nodo) {
    if (!nodo) {
      return;
    }
    nodo.addEventListener("mouseenter", activarTemaPastel);
    nodo.addEventListener("mouseleave", desactivarTemaPastel);
    nodo.addEventListener("focus", activarTemaPastel);
    nodo.addEventListener("blur", desactivarTemaPastel);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var sesion = typeof window.obtenerSesion === "function" ? window.obtenerSesion() : null;
    if (sesion) {
      window.location.replace("panel-control.html");
      return;
    }

    enlazarTemaPastel(document.getElementById("btnNavInicio"));
    enlazarTemaPastel(document.getElementById("enlaceVolverInicio"));

    var form = document.getElementById("formLogin");
    var campoUsuario = document.getElementById("usuarioLogin");
    var campoPass = document.getElementById("contrasenaLogin");
    var btnVer = document.getElementById("btnMostrarPass");

    if (btnVer && campoPass) {
      btnVer.addEventListener("click", function () {
        var visible = campoPass.type === "text";
        campoPass.type = visible ? "password" : "text";
        btnVer.textContent = visible ? "Ver" : "Ocultar";
        btnVer.setAttribute("aria-pressed", visible ? "false" : "true");
        btnVer.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
      });
    }

    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (evento) {
      evento.preventDefault();
      mostrarMensaje("", "");

      var usuario = (campoUsuario.value || "").trim();
      var contrasena = campoPass.value || "";

      if (!usuario || !contrasena) {
        mostrarMensaje("Escribe tu usuario y contraseña para continuar.", "error");
        if (!usuario) {
          campoUsuario.focus();
        } else {
          campoPass.focus();
        }
        return;
      }

      if (typeof window.pantherFetch !== "function") {
        mostrarMensaje("No se pudo preparar la conexión con el servidor. Recarga la página e inténtalo de nuevo.", "error");
        return;
      }

      setCargando(true);
      try {
        var resultado = await window.pantherFetch("useraction/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ user: usuario, password: contrasena })
        });

        var data = resultado.json && resultado.json.data ? resultado.json.data : null;
        var keyAPI = data && data.keyAPI ? data.keyAPI : "";
        var nombreUsuario = (data && data.user) || usuario;
        var rol = (data && (data.rol || data.roles)) || "";

        if (!resultado.respuesta.ok || !keyAPI || !rol) {
          var detalle =
            (resultado.json && typeof resultado.json.data === "string" && resultado.json.data) ||
            "Usuario o contraseña incorrectos. Verifica tus datos e inténtalo otra vez.";
          mostrarMensaje(detalle, "error");
          return;
        }

        var clarisaExtra = {
          clarisaAuth: data && data.clarisaAuth ? data.clarisaAuth : null,
          clarisaToken: data && data.clarisaToken ? data.clarisaToken : null
        };

        if (
          typeof window.guardarSesion !== "function" ||
          !window.guardarSesion(keyAPI, nombreUsuario, rol, clarisaExtra)
        ) {
          mostrarMensaje("No fue posible guardar la sesión. Inténtalo nuevamente.", "error");
          return;
        }

        var msgOk = "Acceso correcto. Redirigiendo al panel…";
        if (String(rol).toUpperCase() === "ADMIN" && clarisaExtra.clarisaAuth) {
          msgOk = clarisaExtra.clarisaAuth.ok
            ? "Acceso correcto. Clarisa conectada. Redirigiendo…"
            : "Acceso correcto. Clarisa no disponible por ahora. Redirigiendo…";
        }
        mostrarMensaje(msgOk, "ok");
        window.location.replace("panel-control.html");
      } catch (error) {
        var mensaje =
          (error && error.message) ||
          "No hay conexión con el servidor del taller. Abre la página desde http://localhost/taller/Plantilla/ e inicia Apache.";
        mostrarMensaje(mensaje, "error");
      } finally {
        setCargando(false);
      }
    });
  });
})();
