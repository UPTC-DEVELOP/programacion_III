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


    /* -----------------------------------------------
       OBTENER DATOS
       ----------------------------------------------- */

    const nombre =
      document.getElementById("nombre").value.trim();

    const correo =
      document.getElementById("correo").value.trim();

    const telefono =
      document.getElementById("telefono").value.trim();

    const fecha =
      document.getElementById("fecha").value;

    const servicio =
      document.getElementById("servicio").value;

    const descripcion =
      document.getElementById("mensaje").value.trim();


    /* -----------------------------------------------
       VALIDACIÓN ADICIONAL
       ----------------------------------------------- */

    if (nombre.length < 3) {

      mostrarMensaje(
        "El nombre debe tener mínimo 3 caracteres."
      );

      return;
    }


    if (descripcion.length < 10) {

      mostrarMensaje(
        "La descripción debe tener mínimo 10 caracteres."
      );

      return;
    }


    /* -----------------------------------------------
       CONVERTIR SERVICIO
       ----------------------------------------------- */

    const nombresServicios = {

      mecanica: "Mecánica general",

      aceite: "Cambio de aceite",

      frenos: "Revisión de frenos",

      neumaticos: "Cambio de neumáticos",

      bateria: "Cambio de batería",

      averia: "Reparación de avería"

    };


    const nombreServicio =
      nombresServicios[servicio] || servicio;


    /* -----------------------------------------------
       MENSAJE DE CONFIRMACIÓN
       ----------------------------------------------- */

    const mensajeFinal =
      `Solicitud registrada correctamente. ` +
      `Gracias, ${nombre}. ` +
      `Has solicitado ${nombreServicio} ` +
      `para el día ${fecha}. ` +
      `Nos pondremos en contacto contigo al correo ${correo}.`;


    mostrarMensaje(mensajeFinal);


    /* -----------------------------------------------
       GUARDAR DATOS LOCALMENTE
       ----------------------------------------------- */

    const solicitud = {

      nombre: nombre,

      correo: correo,

      telefono: telefono,

      fecha: fecha,

      servicio: nombreServicio,

      descripcion: descripcion,

      fechaRegistro: new Date().toISOString()

    };


    localStorage.setItem(
      "ultimaSolicitudServiAuto",
      JSON.stringify(solicitud)
    );


    /*
     * Limpiar el formulario después del envío.
     */

    formulario.reset();


    inicializarFecha();

  });

}
