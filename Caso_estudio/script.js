
document.addEventListener('DOMContentLoaded', () => {
    // 1) Validación y mensaje dinámico del formulario de reserva
    const bookingForm = document.getElementById('form-reserva');
    const notificationArea = document.getElementById('notificacion-reserva');

    if (bookingForm && notificationArea) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!bookingForm.checkValidity()) {
                notificationArea.className = 'form-feedback error';
                notificationArea.textContent = 'Por favor, completa correctamente todos los campos obligatorios.';
                return;
            }

            const nombre = (document.getElementById('nombre') || {}).value || 'Cliente';
            const servicio = (document.getElementById('servicio') || {}).value || 'Servicio General';
            const fecha = (document.getElementById('fecha') || {}).value || '';
            const telefono = (document.getElementById('telefono') || {}).value || '';

            notificationArea.className = 'form-feedback success';
            notificationArea.textContent = `¡Solicitud enviada con éxito! Estimado(a) ${nombre}, hemos registrado tu reserva para "${servicio}" el día ${fecha}. Un asesor técnico te contactará al ${telefono} en menos de 15 minutos.`;

            bookingForm.reset();
        });
    }

    // 2) Activar enlace destacado en la navegación
    const navLinks = document.querySelectorAll('nav ul li a');

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 3) Scroll suave accesible entre anclas
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href')?.substring(1);
            if (!targetId) return;

            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });

                targetElement.setAttribute('tabindex', '-1');
                targetElement.focus({ preventScroll: true });
            }
        });
    });
});