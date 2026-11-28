

const URL_SCRIPT = 'http://localhost/panther/rest/useraction/Script.php';

const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

document.addEventListener('DOMContentLoaded', function() {

    const carro = document.querySelector(".hero__visual");

    if (carro) {
        // Empieza invisible y MUY lejos por la derecha
        carro.style.opacity = "0";
        carro.style.transform = "translateX(800px)";

        // Más velocidad: 0.4 segundos en lugar de 1s
        carro.style.transition = "opacity 0.4s ease, transform 0.2s ease";

        setTimeout(function () {
            // Aparece y cruza casi hasta el otro lado
            carro.style.opacity = "1";
            carro.style.transform = "translateX(-150px)";
        }, 250);
    }

    // Tarjeta beneficios
    const tarjetas = document.querySelectorAll('.benefit-card');
    if (tarjetas.length > 0) {
        tarjetas.forEach((tarjeta, indice) => {
            tarjeta.style.transition = `opacity 0.6s ease ${indice * 0.15}s, transform 0.6s ease ${indice * 0.15}s`;
        });

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.style.opacity = "1";
                    entrada.target.style.transform = "translateY(0)";
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: "0px 0px -50px 0px"
        });

        tarjetas.forEach(tarjeta => observador.observe(tarjeta));
    }

    // ===== LOGIN: selección de tipo de usuario =====
    const loginOpen = document.getElementById('loginOpen');
    const loginClose = document.getElementById('loginClose');
    const loginModal = document.getElementById('loginModal');

    // Rutas relativas desde Login/LoginPanther.html hacia cada CRUD
    const PAGINAS = {
        administrador: '../crud_administrador/administradores.html',
        empleado: '../crud_empleados/empleados.html',
        cliente: '../crud_clientes/clientes_2.html'
    };

    if (loginOpen && loginModal) {

        function abrirLogin() {
            loginModal.hidden = false;
            requestAnimationFrame(() => loginModal.classList.add('is-open'));
            document.body.style.overflow = 'hidden';
            const primero = loginModal.querySelector('.role-btn');
            if (primero) primero.focus();
        }

        function cerrarLogin() {
            loginModal.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => { loginModal.hidden = true; }, 200);
            loginOpen.focus();
        }

        loginOpen.addEventListener('click', abrirLogin);
        loginClose.addEventListener('click', cerrarLogin);

        // Cerrar al hacer clic fuera de la tarjeta
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) cerrarLogin();
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !loginModal.hidden) cerrarLogin();
        });

        // Clic en cada tipo de usuario: lleva a LoginPanther.html con la ruta de destino
        loginModal.querySelectorAll('.role-btn').forEach((boton) => {
            boton.addEventListener('click', () => {
                const rol = boton.dataset.role; // "cliente", "empleado" o "administrador"
                const destino = PAGINAS[rol];
                if (!destino) return;

                try {
                    sessionStorage.setItem('tallerpro_rol', rol);
                } catch (e) { /* sin acceso */ }

                // Redirige al login de Panther indicando a dónde volver al autenticarse
                window.location.href = `Login/LoginPanther.html?volver=${encodeURIComponent(destino)}`;
            });
        });
    }
});
// ===== REGISTRO DE CITAS TALLERPRO =====

document.addEventListener('DOMContentLoaded', function () {

    const formulario = document.getElementById('leadForm');
    const confirmacion = document.getElementById('formConfirm');

    if (!formulario || !confirmacion) return;

    const boton = formulario.querySelector('button[type="submit"]');
    const URL_CITAS = window.location.origin + '/panther/rest/citas';

    formulario.addEventListener('submit', async function (e) {

        e.preventDefault();

        confirmacion.textContent = '';

        if (!formulario.reportValidity()) return;

        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            servicio: document.getElementById('servicio').value,
            mensaje: document.getElementById('mensaje').value.trim(),
            fecha_cita: document.getElementById('fecha_cita').value,
            hora_cita: document.getElementById('hora_cita').value
        };

        boton.disabled = true;
        boton.textContent = 'Enviando solicitud...';

        try {
            const respuesta = await fetch(URL_CITAS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || resultado.code !== 201) {
                throw new Error(
                    typeof resultado.data === 'string'
                        ? resultado.data
                        : 'No fue posible registrar la cita.'
                );
            }

            confirmacion.style.color = '#86efac';
            confirmacion.textContent =
                '¡Solicitud registrada correctamente! Cita N.º ' +
                resultado.data.id_cita +
                '. Pendiente de confirmación.';

            formulario.reset();

        } catch (error) {

            confirmacion.style.color = '#fca5a5';
            confirmacion.textContent = error.message;

        } finally {

            boton.disabled = false;
            boton.textContent = 'Solicitar cita';

        }
    });
});