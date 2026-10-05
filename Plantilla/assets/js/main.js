/*
	TXT by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$nav = $('#nav');

	// Breakpoints.
		breakpoints({
			xlarge:  [ '1281px',  '1680px' ],
			large:   [ '981px',   '1280px' ],
			medium:  [ '737px',   '980px'  ],
			small:   [ '361px',   '736px'  ],
			xsmall:  [ null,      '360px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Dropdowns.
		$('#nav > ul').dropotron({
			mode: 'fade',
			noOpenerFade: true,
			speed: 300,
			alignment: 'center'
		});

	// Scrolly
		$('.scrolly').scrolly({
			speed: 1000,
			offset: function() { return $nav.height() - 5; }
		});

		function offsetNav() {
			return ($nav.length ? $nav.height() : 52) - 5;
		}

		function irASeccion(hash) {
			var $el = $(hash);
			if (!$el.length) {
				return false;
			}
			$('html, body').stop(true).animate({
				scrollTop: $el.offset().top - offsetNav()
			}, 600);
			return true;
		}

		$window.on('load', function() {
			window.setTimeout(function() {
				if (window.location.hash === '#servicios' || window.location.hash === '#nosotros' || window.location.hash === '#contacto') {
					irASeccion(window.location.hash);
				}
			}, 200);
		});

		$(document).on('click', 'a[href*="#servicios"], a[href*="#nosotros"], a[href*="#contacto"]', function(e) {
			var href = this.getAttribute('href') || '';
			var hash = href.substring(href.indexOf('#'));
			if (document.getElementById(hash.replace('#', ''))) {
				e.preventDefault();
				irASeccion(hash);
			}
		});

	// Nav.

		// Title Bar.
			$(
				'<div id="titleBar">' +
					'<a href="#navPanel" class="toggle"></a>' +
					'<span class="title">' + $('#logo').html() + '</span>' +
				'</div>'
			)
				.appendTo($body);

		// Panel.
			$(
				'<div id="navPanel">' +
					'<nav>' +
						$('#nav').navList() +
					'</nav>' +
				'</div>'
			)
				.appendTo($body)
				.panel({
					delay: 500,
					hideOnClick: true,
					hideOnSwipe: true,
					resetScroll: true,
					resetForms: true,
					side: 'left',
					target: $body,
					visibleClass: 'navPanel-visible'
				});

})(jQuery);