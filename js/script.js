// ============================================
// TallerMax - script.js
// Interactividad: validación de formulario, contadores animados,
// menú móvil y panel de detalles.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initMobileNav();
  initAnimatedCounters();
  initFormValidation();
  initToggleDetalleServicio(); // mostrar/ocultar detalle por servicio
});

// ---------------------------------------------
// Año dinámico en el footer (manipulación del DOM)
// ---------------------------------------------
function setFooterYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// ---------------------------------------------
// Menú móvil (addEventListener + manipulación del DOM)
// ---------------------------------------------
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  if (!toggle || !navList) return;

  toggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Cierra el menú al hacer clic en un enlace (mejora UX en móvil)
  navList.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------------------------------------------
// Contadores animados (hero + tablero de beneficios)
// Se activan cuando el elemento entra en pantalla (IntersectionObserver)
// ---------------------------------------------
function initAnimatedCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1200; // ms
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // easing suave (easeOutQuad)
      const eased = 1 - (1 - progress) * (1 - progress);
      const value = Math.floor(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target); // solo se anima una vez
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(counter => observer.observe(counter));
}

// Nota: el panel "Ver cómo se calculan estos beneficios" ahora es un
// elemento nativo <details>/<summary> en el HTML. El navegador se encarga
// de abrirlo/cerrarlo y de actualizar aria-expanded automáticamente,
// así que ya no hace falta JavaScript para esa parte.

// ---------------------------------------------
// Validación de formulario (evento submit + addEventListener)
// Sin usar alert(): los mensajes se inyectan en el DOM.
// ---------------------------------------------
function initFormValidation() {
  const form = document.getElementById('formulario-cliente');
  if (!form) return;

  const statusEl = document.getElementById('formStatus');

  const validators = {
    nombre: (value) => value.trim().length >= 2,
    correo: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    telefono: (value) => /^[0-9+\s]{7,15}$/.test(value.trim()),
    mensaje: (value) => value.trim().length >= 2,
    
    
  };

  const errorMessages = {
    nombre: 'Escribe tu nombre (mínimo 2 caracteres).',
    correo: 'Escribe tu correo electronico valido.',
    telefono: 'Ingresa un teléfono válido (solo números, 7 a 15 dígitos).',
    mensaje: 'Tu opinion es importante para nosotros.',
    
  };

  // Validación en tiempo real por campo
  Object.keys(validators).forEach(fieldName => {
    const input = form.elements[fieldName];
    if (!input) return;

    input.addEventListener('input', () => validateField(input));
    input.addEventListener('blur', () => validateField(input));
  });

  function validateField(input) {
    const fieldName = input.name;
    const isValid = validators[fieldName](input.value);
    const errorSpan = form.querySelector(`[data-error-for="${fieldName}"]`);

    input.classList.toggle('valid', isValid);
    input.classList.toggle('invalid', !isValid && input.value.length > 0);

    if (errorSpan) {
      errorSpan.textContent = (!isValid && input.value.length > 0) ? errorMessages[fieldName] : '';
    }
    return isValid;
  }

  // Evento submit
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let formIsValid = true;
    Object.keys(validators).forEach(fieldName => {
      const input = form.elements[fieldName];
      const fieldValid = validateField(input);
      if (!fieldValid) formIsValid = false;
    });

    if (!formIsValid) {
      statusEl.textContent = 'Revisa los campos marcados en rojo antes de enviar.';
      statusEl.style.color = '#e5484d';
      return;
    }

    // Simulación de envío (no hay backend real en esta landing)
    const nombreTaller = form.elements['taller'].value.trim();
    statusEl.style.color = 'var(--accent-2)';
    statusEl.textContent = `¡Gracias! Un asesor contactará al taller "${nombreTaller}" muy pronto.`;

    form.reset();
    form.querySelectorAll('input').forEach(input => {
      input.classList.remove('valid', 'invalid');
    });
  });
  
}

// Cada tarjeta de servicio tiene su propio botón para desplegar o esconder los detalles
function initToggleDetalleServicio() {
  const botonesDetalle = document.querySelectorAll('.boton-detalle-servicio');
  if (!botonesDetalle.length) return;

  botonesDetalle.forEach(boton => {
    boton.addEventListener('click', () => {
      const idPanel = boton.getAttribute('aria-controls');
      const panelDetalle = document.getElementById(idPanel);
      if (!panelDetalle) return;

      const estaAbierto = boton.getAttribute('aria-expanded') === 'true';

      // Cambia el estado accesible del botón (para lectores de pantalla)
      boton.setAttribute('aria-expanded', String(!estaAbierto));

      // Muestra u oculta la lista usando el atributo nativo "hidden"
      panelDetalle.hidden = estaAbierto;

      // Cambia el texto del botón según el estado, sin tocar el ícono de flecha
      boton.firstChild.textContent = estaAbierto ? 'Ver detalles ' : 'Ocultar detalles ';
    });
  });
}
