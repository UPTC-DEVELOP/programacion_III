
document.addEventListener("DOMContentLoaded", () => {

  inicializarFecha();
  inicializarFormulario();
  inicializarBotonesReserva();
  inicializarNavegacion();
  actualizarAnio();

});


/* =====================================================
   FECHA MÍNIMA PARA RESERVAS
   ===================================================== */

function inicializarFecha() {

  const campoFecha = document.getElementById("fecha");

  if (!campoFecha) {
    return;
  }

  const hoy = new Date();

  const anio = hoy.getFullYear();

  const mes = String(hoy.getMonth() + 1).padStart(2, "0");

  const dia = String(hoy.getDate()).padStart(2, "0");

  const fechaActual = `${anio}-${mes}-${dia}`;

  campoFecha.min = fechaActual;

}


/* =====================================================
   FORMULARIO
   ===================================================== */

function inicializarFormulario() {

  const formulario = document.querySelector(
    'form[data-form="reserva"]'
  );

  if (!formulario) {
    return;
  }


  formulario.addEventListener("submit", (evento) => {

    evento.preventDefault();


    const mensaje = document.getElementById(
      "mensaje-formulario"
    );


    /*
     * Se comprueba la validación nativa
     * del navegador.
     */

    if (!formulario.checkValidity()) {

      formulario.reportValidity();

      if (mensaje) {

        mensaje.textContent =
          "Por favor, complete correctamente todos los campos.";

      }

      return;
    }
