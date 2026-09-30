document.addEventListener("DOMContentLoaded", function () {

    inicializarFecha();
    inicializarFormulario();
    inicializarBotonesReserva();
    inicializarNavegacion();
    actualizarAnio();

});


/* =========================================================
   FECHA MÍNIMA
   ========================================================= */

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


/* =========================================================
   FORMULARIO DE RESERVA
   ========================================================= */

function inicializarFormulario() {

    const formulario = document.getElementById("form-reserva");

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", function (evento) {

        evento.preventDefault();

        const nombre = document.getElementById("nombre");
        const correo = document.getElementById("email");
        const telefono = document.getElementById("telefono");
        const fecha = document.getElementById("fecha");
        const servicio = document.getElementById("servicio");
        const vehiculo = document.getElementById("vehiculo");
        const mensaje = document.getElementById("mensaje");

        const notificacion =
            document.getElementById("notificacion-reserva");


        /* Validación HTML */

        if (!formulario.checkValidity()) {

            formulario.reportValidity();

            mostrarMensaje(
                "Por favor, completa correctamente los campos obligatorios.",
                "error"
            );

            return;
        }


        /* Validación adicional del nombre */

        if (nombre.value.trim().length < 3) {

            mostrarMensaje(
                "El nombre debe tener mínimo 3 caracteres.",
                "error"
            );

            nombre.focus();

            return;
        }


        /* Validación de teléfono */

        if (telefono.value.trim().length < 7) {

            mostrarMensaje(
                "Ingresa un número de teléfono válido.",
                "error"
            );

            telefono.focus();

            return;
        }


        /* Validación de fecha */

        if (!fecha.value) {

            mostrarMensaje(
                "Debes seleccionar una fecha para la reserva.",
                "error"
            );

            fecha.focus();

            return;
        }


        /* Validación del servicio */

        if (!servicio.value) {

            mostrarMensaje(
                "Debes seleccionar un servicio.",
                "error"
            );

            servicio.focus();

            return;
        }


        /* =================================================
           CREAR INFORMACIÓN DE LA RESERVA
           ================================================= */

        const datosReserva = {

            nombre: nombre.value.trim(),

            correo: correo.value.trim(),

            telefono: telefono.value.trim(),

            fecha: fecha.value,

            servicio: servicio.value,

            vehiculo: vehiculo.value.trim(),

            mensaje: mensaje.value.trim(),

            fechaRegistro: new Date().toISOString()

        };


        /* =================================================
           GUARDAR EN LOCAL STORAGE
           ================================================= */

        localStorage.setItem(
            "ultimaSolicitudServiAuto",
            JSON.stringify(datosReserva)
        );


        /* =================================================
           MENSAJE DE CONFIRMACIÓN
           ================================================= */

        const mensajeConfirmacion =
            `¡Reserva enviada correctamente, ${datosReserva.nombre}! 
            
Servicio: ${datosReserva.servicio}

Fecha solicitada: ${datosReserva.fecha}

Nos comunicaremos contigo al correo ${datosReserva.correo} o al teléfono ${datosReserva.telefono}.`;


        mostrarMensaje(
            mensajeConfirmacion,
            "exito"
        );


        /* =================================================
           LIMPIAR FORMULARIO
           ================================================= */

        formulario.reset();

        inicializarFecha();

    });
}


/* =========================================================
   MOSTRAR MENSAJES
   ========================================================= */

function mostrarMensaje(texto, tipo) {

    const notificacion =
        document.getElementById("notificacion-reserva");

    if (!notificacion) {
        return;
    }

    notificacion.textContent = texto;

    notificacion.style.display = "block";

    if (tipo === "exito") {

        notificacion.style.backgroundColor = "#e8f5e9";
        notificacion.style.color = "#1b5e20";
        notificacion.style.border =
            "1px solid #4caf50";

    } else {

        notificacion.style.backgroundColor = "#ffebee";
        notificacion.style.color = "#b71c1c";
        notificacion.style.border =
            "1px solid #e21b23";
    }
}


/* =========================================================
   BOTONES DE RESERVA
   ========================================================= */

function inicializarBotonesReserva() {

    const botonesReserva =
        document.querySelectorAll('a[href="#reserva"]');

    botonesReserva.forEach(function (boton) {

        boton.addEventListener("click", function (evento) {

            const seccionReserva =
                document.getElementById("reserva");

            if (seccionReserva) {

                evento.preventDefault();

                seccionReserva.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });

}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function inicializarNavegacion() {

    const enlaces =
        document.querySelectorAll('a[href^="#"]');

    enlaces.forEach(function (enlace) {

        enlace.addEventListener("click", function (evento) {

            const destino =
                enlace.getAttribute("href");

            if (
                !destino ||
                destino === "#" ||
                destino === "#reserva"
            ) {
                return;
            }

            const elemento =
                document.querySelector(destino);

            if (elemento) {

                evento.preventDefault();

                elemento.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });

}


/* =========================================================
   AÑO AUTOMÁTICO
   ========================================================= */

function actualizarAnio() {

    const elementoAnio =
        document.getElementById("anio");

    if (!elementoAnio) {
        return;
    }

    const anioActual =
        new Date().getFullYear();

    elementoAnio.textContent = anioActual;
}
