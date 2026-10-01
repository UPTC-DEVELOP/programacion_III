document.addEventListener("DOMContentLoaded", function () {
  const formContacto = document.getElementById("formContacto");
  if (!formContacto) {
    return;
  }

  const emailInput = document.getElementById("emailContacto");
  const telefonoInput = document.getElementById("telefonoContacto");

  emailInput.addEventListener("input", function () {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validarCampoContacto(this, regexEmail.test(this.value));
  });

  telefonoInput.addEventListener("input", function () {
    const regexTel = /^[0-9]{10}$/;
    validarCampoContacto(this, regexTel.test(this.value));
  });

  formContacto.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombreTaller = document.getElementById("nombreTaller").value.trim();
    const propietario = document.getElementById("propietario").value.trim();
    const email = emailInput.value.trim();
    const telefono = telefonoInput.value.trim();

    if (!nombreTaller || !propietario || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9]{10}$/.test(telefono)) {
      mostrarMensajeContacto("Por favor complete todos los campos con un formato válido.", "red");
      return;
    }

    mostrarMensajeContacto("Mensaje enviado. Nos pondremos en contacto pronto.", "green");
    formContacto.reset();
  });
});

function validarCampoContacto(input, esValido) {
  if (esValido) {
    input.style.borderColor = "green";
  } else {
    input.style.borderColor = "red";
  }
}

function mostrarMensajeContacto(mensaje, color) {
  const caja = document.getElementById("mensajeContacto");
  if (caja) {
    caja.innerText = mensaje;
    caja.style.color = color;
  }
}
