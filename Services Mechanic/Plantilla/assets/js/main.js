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
