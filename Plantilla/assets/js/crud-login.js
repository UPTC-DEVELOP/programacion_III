document.addEventListener("DOMContentLoaded", function () {
  redirigirSiHaySesion();

  const formLogin = document.getElementById("formLogin");
  const usuarioInput = document.getElementById("loginUser");
  const claveInput = document.getElementById("loginPass");
  const btnLogin = document.getElementById("btnLogin");

  usuarioInput.addEventListener("input", function () {
    validarCampoLogin(this, /^.{5,255}$/.test(this.value.trim()));
  });

  claveInput.addEventListener("input", function () {
    validarCampoLogin(this, /^.{5,255}$/.test(this.value));
  });

  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    const usuario = usuarioInput.value.trim();
    const contrasenia = claveInput.value;

    if (!/^.{5,255}$/.test(usuario) || !/^.{5,255}$/.test(contrasenia)) {
      validarCampoLogin(usuarioInput, /^.{5,255}$/.test(usuario));
      validarCampoLogin(claveInput, /^.{5,255}$/.test(contrasenia));
      mostrarAlertaLogin("Usuario y contraseña deben tener entre 5 y 255 caracteres.", "danger");
      return;
    }

    btnLogin.disabled = true;
    btnLogin.innerText = "Ingresando...";
    mostrarAlertaLogin("Validando credenciales con Clarisa...", "info");

    try {
      const resultado = await loginClarisa(usuario, contrasenia);
      const json = resultado.json || {};
      if (resultado.status === 200 && json.success && json.data && json.data.token) {
        const usuarioRespuesta = json.data.usuario || {};
        guardarSesionTaller({
          token: json.data.token,
          userName: usuarioRespuesta.userName || usuario,
          permisos: json.data.permisos || []
        });
        mostrarAlertaLogin("Acceso correcto. Redirigiendo a facturación...", "success");
        window.location.replace("factura.html");
        return;
      }
      mostrarAlertaLogin(extraerMensajeClarisa(json, "Credenciales inválidas o sesión rechazada."), "danger");
    } catch (error) {
      mostrarAlertaLogin(error.message || "No fue posible iniciar sesión.", "danger");
    } finally {
      btnLogin.disabled = false;
      btnLogin.innerText = "Iniciar sesión";
    }
  });
});

function validarCampoLogin(input, esValido) {
  if (esValido) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  } else {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
  }
}

function mostrarAlertaLogin(mensaje, tipo) {
  const alerta = document.getElementById("alertaLogin");
  if (alerta) {
    alerta.className = "alert alert-" + tipo + " animate__animated animate__fadeIn d-block mb-3";
    alerta.innerText = mensaje;
    alerta.classList.remove("d-none");
  }
}
