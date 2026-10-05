/*
	Stellar by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$main = $('#main');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ '361px',   '480px'  ],
			xxsmall:  [ null,      '360px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Nav.
		var $nav = $('#nav');

		if ($nav.length > 0) {

			// Shrink effect.
				$main
					.scrollex({
						mode: 'top',
						enter: function() {
							$nav.addClass('alt');
						},
						leave: function() {
							$nav.removeClass('alt');
						},
					});

			// Links.
				var $nav_a = $nav.find('a');

				$nav_a
					.scrolly({
						speed: 1000,
						offset: function() { return $nav.height(); }
					})
					.on('click', function() {

						var $this = $(this);

						// External link? Bail.
							if ($this.attr('href').charAt(0) != '#')
								return;

						// Deactivate all links.
							$nav_a
								.removeClass('active')
								.removeClass('active-locked');

						// Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
							$this
								.addClass('active')
								.addClass('active-locked');

					})
					.each(function() {

						var	$this = $(this),
							id = $this.attr('href'),
							$section = $(id);

						// No section for this link? Bail.
							if ($section.length < 1)
								return;

						// Scrollex.
							$section.scrollex({
								mode: 'middle',
								initialize: function() {

									// Deactivate section.
										if (browser.canUse('transition'))
											$section.addClass('inactive');

								},
								enter: function() {

									// Activate section.
										$section.removeClass('inactive');

									// No locked links? Deactivate all links and activate this section's one.
										if ($nav_a.filter('.active-locked').length == 0) {

											$nav_a.removeClass('active');
											$this.addClass('active');

										}

									// Otherwise, if this section's link is the one that's locked, unlock it.
										else if ($this.hasClass('active-locked'))
											$this.removeClass('active-locked');

								}
							});

					});

		}

	// Scrolly.
		$('.scrolly').scrolly({
			speed: 1000
		});

})(jQuery);

/* Carrusel del hero de Services Mechanic. */

(() => {
	const hero = document.querySelector('.hero-inicio');

	if (!hero)
		return;

	const imagenes = hero.querySelectorAll('.imagen-carrusel');
	const anterior = hero.querySelector('#foto-anterior');
	const siguiente = hero.querySelector('#foto-siguiente');
	const pausa = hero.querySelector('#pausar-carrusel');
	const indicadores = hero.querySelectorAll('.indicador');

	if (!imagenes.length || !anterior || !siguiente || !pausa)
		return;

	let posicion = 0;
	let temporizador = null;

	function mostrarImagen(nuevaPosicion) {
		posicion = (nuevaPosicion + imagenes.length) % imagenes.length;

		imagenes.forEach((imagen, indice) => {
			imagen.hidden = indice !== posicion;
		});

		indicadores.forEach((indicador, indice) => {
			const estaActivo = indice === posicion;

			indicador.classList.toggle('activo', estaActivo);

			if (estaActivo)
				indicador.setAttribute('aria-current', 'true');
			else
				indicador.removeAttribute('aria-current');
		});
	}

	function iniciarCarrusel() {
		clearInterval(temporizador);

		temporizador = setInterval(() => {
			mostrarImagen(posicion + 1);
		}, 5000);

		pausa.textContent = '⏸';
		pausa.setAttribute('aria-label', 'Pausar carrusel');
	}

	function detenerCarrusel() {
		clearInterval(temporizador);
		temporizador = null;

		pausa.textContent = '▶';
		pausa.setAttribute('aria-label', 'Reanudar carrusel');
	}

	anterior.addEventListener('click', () => {
		mostrarImagen(posicion - 1);

		if (temporizador !== null)
			iniciarCarrusel();
	});

	siguiente.addEventListener('click', () => {
		mostrarImagen(posicion + 1);

		if (temporizador !== null)
			iniciarCarrusel();
	});

	pausa.addEventListener('click', () => {
		if (temporizador !== null)
			detenerCarrusel();
		else
			iniciarCarrusel();
	});

	indicadores.forEach((indicador, indice) => {
		indicador.addEventListener('click', () => {
			mostrarImagen(indice);

			if (temporizador !== null)
				iniciarCarrusel();
		});
	});

	mostrarImagen(0);

	const reducirMovimiento = window.matchMedia(
		'(prefers-reduced-motion: reduce)'
	);

	if (reducirMovimiento.matches)
		detenerCarrusel();
	else
		iniciarCarrusel();
})();
// VALIDACIÓN DEL FORMULARIO DE SOLICITUD DE INFORMACIÓN

document.addEventListener("DOMContentLoaded", () => {

  const formulario = document.getElementById("form-solicitud");
  const estadoSistema = document.getElementById("estado-sistema");

  if (!formulario) return;

  const mensajesError = {
    nombre: "Ingresa un nombre válido (mínimo 3 caracteres).",
    taller: "Ingresa el nombre del taller (mínimo 3 caracteres).",
    correo: "Ingresa un correo electrónico válido.",
    telefono: "Ingresa un teléfono válido (solo números, +, espacios, guiones).",
    "num-empleados": "El número de empleados no puede ser negativo.",
    "plan-interes": "Selecciona un plan de interés.",
    mensaje: "Escribe tu mensaje con al menos 10 caracteres."
  };

  function validarCampo(campo) {
    const spanError = document.getElementById(`error-${campo.id}`);
    const esValido = campo.checkValidity();

    if (!esValido) {
      campo.classList.add("campo-invalido");

      if (spanError) {
        spanError.textContent =
          mensajesError[campo.id] || "Este campo no es válido.";
      }
    } else {
      campo.classList.remove("campo-invalido");

      if (spanError) {
        spanError.textContent = "";
      }
    }

    return esValido;
  }

  const campos = formulario.querySelectorAll(
    "input, select, textarea"
  );

  campos.forEach((campo) => {

    campo.addEventListener("blur", () => {
      validarCampo(campo);
    });

    campo.addEventListener("input", () => {
      if (campo.classList.contains("campo-invalido")) {
        validarCampo(campo);
      }
    });

  });

  function mostrarMensajeEstado(texto, tipo) {

    if (!estadoSistema) return;

    estadoSistema.textContent = texto;
    estadoSistema.classList.remove("exito", "error");
    estadoSistema.classList.add(tipo);
  }

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

    const nombre =
      formulario.querySelector("#nombre").value.trim();

    const taller =
      formulario.querySelector("#taller").value.trim();

    mostrarMensajeEstado(
      `¡Gracias, ${nombre}! Registramos la solicitud de "${taller}". Un asesor te contactará pronto.`,
      "exito"
    );

    formulario.reset();

    campos.forEach((campo) => {
      campo.classList.remove("campo-invalido");
    });

  });

});