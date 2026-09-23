

(() => {
  const imagenes = document.querySelectorAll("#inicio .imagen-carrusel");
  const anterior = document.getElementById("foto-anterior");
  const siguiente = document.getElementById("foto-siguiente");
  const pausa = document.getElementById("pausar-carrusel");
  const indicadores = document.querySelectorAll("#inicio .indicador");

  // Verifica que existan los elementos necesarios 
  if (!imagenes.length || !anterior || !siguiente || !pausa) {
    return;
  }

  let posicion = 0;
  let temporizador = null;


  // Cambia la imagen visible
  function mostrarImagen(nuevaPosicion) {
    posicion = (nuevaPosicion + imagenes.length) % imagenes.length;

    imagenes.forEach((imagen, indice) => {
      imagen.hidden = indice !== posicion;
    });

    indicadores.forEach((indicador, indice) => {
      const estaActivo = indice === posicion;

      indicador.classList.toggle("activo", estaActivo);

      if (estaActivo) {
        indicador.setAttribute("aria-current", "true");
      } else {
        indicador.removeAttribute("aria-current");
      }
    });
  }


  // Reproducción automática
  function iniciarCarrusel() {
    clearInterval(temporizador);

    temporizador = setInterval(() => {
      mostrarImagen(posicion + 1);
    }, 5000);

    pausa.textContent = "⏸";
    pausa.setAttribute("aria-label", "Pausar carrusel");
  }


  // Detiene la reproducción automática
  function detenerCarrusel() {
    clearInterval(temporizador);
    temporizador = null;

    pausa.textContent = "▶";
    pausa.setAttribute("aria-label", "Reanudar carrusel");
  }


  // imagen anterior
  anterior.addEventListener("click", () => {
    mostrarImagen(posicion - 1);

    if (temporizador !== null) {
      iniciarCarrusel();
    }
  });


  // imagen siguiente
  siguiente.addEventListener("click", () => {
    mostrarImagen(posicion + 1);

    if (temporizador !== null) {
      iniciarCarrusel();
    }
  });


  // pausar o reanudar el carrusel
  pausa.addEventListener("click", () => {
    if (temporizador !== null) {
      detenerCarrusel();
    } else {
      iniciarCarrusel();
    }
  });


  // indicadores inferiores
  indicadores.forEach((indicador, indice) => {
    indicador.addEventListener("click", () => {
      mostrarImagen(indice);

      if (temporizador !== null) {
        iniciarCarrusel();
      }
    });
  });


  // estado inicial
  mostrarImagen(0);



  const reducirMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if (reducirMovimiento.matches) {
    detenerCarrusel();
  } else {
    iniciarCarrusel();
  }
})();

// VALIDACIÓN DEL FORMULARIO DE SOLICITUD DE INFORMACIÓN

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-solicitud");
  const estadoSistema = document.getElementById("estado-sistema");


  if (!formulario) return;

  // Mensajes de error personalizados por campo
  const mensajesError = {
    nombre: "Ingresa un nombre válido (mínimo 3 caracteres).",
    taller: "Ingresa el nombre del taller (mínimo 3 caracteres).",
    correo: "Ingresa un correo electrónico válido.",
    telefono: "Ingresa un teléfono válido (solo números, +, espacios, guiones).",
    "num-empleados": "El número de empleados no puede ser negativo.",
    "plan-interes": "Selecciona un plan de interés.",
    mensaje: "Escribe tu mensaje con al menos 10 caracteres.",
  };


  // Valida cada campo
  
  function validarCampo(campo) {
    const spanError = document.getElementById(`error-${campo.id}`);
    const esValido = campo.checkValidity();

    if (!esValido) {
      campo.classList.add("campo-invalido");
      if (spanError) {
        spanError.textContent = mensajesError[campo.id] || "Este campo no es válido.";
      }
    } else {
      campo.classList.remove("campo-invalido");
      if (spanError) {
        spanError.textContent = "";
      }
    }

    return esValido;
  }

  
  // Validación al salir o modificar un campo 
  const campos = formulario.querySelectorAll("input, select, textarea");
  campos.forEach((campo) => {
    campo.addEventListener("blur", () => validarCampo(campo));

    // Actualiza la validación mientras escribe
    campo.addEventListener("input", () => {
      if (campo.classList.contains("campo-invalido")) {
        validarCampo(campo);
      }
    });
  });

    
  // Muestra un mensaje de estado (éxito o error)

  function mostrarMensajeEstado(texto, tipo) {
    estadoSistema.textContent = texto;
    estadoSistema.classList.remove("exito", "error");
    estadoSistema.classList.add(tipo);

    
    estadoSistema.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  // Evento submit: valida todo el formulario antes de enviarlo
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    let formularioValido = true;
    let primerCampoInvalido = null;

    campos.forEach((campo) => {
      const esValido = validarCampo(campo);
      if (!esValido) {
        formularioValido = false;
        if (!primerCampoInvalido) {
          primerCampoInvalido = campo;
        }
      }
    });

    if (!formularioValido) {
      mostrarMensajeEstado(
        "Revisa los campos marcados en rojo antes de enviar la solicitud.",
        "error"
      );
      if (primerCampoInvalido) {
        primerCampoInvalido.focus();
      }
      return;
    }


    const nombre = formulario.querySelector("#nombre").value.trim();
    const taller = formulario.querySelector("#taller").value.trim();

    mostrarMensajeEstado(
      `¡Gracias, ${nombre}! Registramos la solicitud de "${taller}". Un asesor te contactará pronto.`,
      "exito"
    );

    formulario.reset();
    campos.forEach((campo) => campo.classList.remove("campo-invalido"));
  });
});