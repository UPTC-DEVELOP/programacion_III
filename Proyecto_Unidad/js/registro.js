// Registro de usuarios/talleres — preparado para Backend.
// Reutiliza el patrón de UI del login (alertas, toggle de contraseña, estados de carga).

const LONGITUD_MIN_CONTRASENA = 8;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[\d\s+\-()]{7,20}$/;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro');
    const alerta = document.getElementById('registro-alerta');
    const btnRegistro = document.getElementById('btn-registro');
    const btnTexto = btnRegistro.querySelector('.btn-texto');

    const campos = {
        fullName: document.getElementById('nombre-completo'),
        workshopName: document.getElementById('nombre-taller'),
        email: document.getElementById('correo'),
        phone: document.getElementById('telefono'),
        password: document.getElementById('contrasena'),
        confirmPassword: document.getElementById('confirmar-contrasena'),
        acceptTerms: document.getElementById('acepto-terminos'),
    };

    const errores = {
        fullName: document.getElementById('error-nombre-completo'),
        workshopName: document.getElementById('error-nombre-taller'),
        email: document.getElementById('error-correo'),
        phone: document.getElementById('error-telefono'),
        password: document.getElementById('error-contrasena'),
        confirmPassword: document.getElementById('error-confirmar-contrasena'),
        acceptTerms: document.getElementById('error-acepto-terminos'),
    };

    // --- UI auxiliar ---
    function mostrarAlerta(mensaje, tipo) {
        alerta.className = 'login-alerta ' + tipo;
        alerta.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
        alerta.textContent = mensaje;
        alerta.hidden = false;
    }

    function ocultarAlerta() {
        alerta.hidden = true;
        alerta.textContent = '';
    }

    function mostrarErrorCampo(clave, mensaje) {
        const input = campos[clave];
        const nodoError = errores[clave];
        if (!nodoError) return;

        nodoError.textContent = mensaje;
        nodoError.hidden = !mensaje;

        if (input && input.type !== 'checkbox') {
            input.classList.toggle('campo-invalido', Boolean(mensaje));
            input.setAttribute('aria-invalid', String(Boolean(mensaje)));
        }
    }

    function limpiarErrores() {
        Object.keys(errores).forEach((clave) => mostrarErrorCampo(clave, ''));
    }

    function estadoCargando(cargando) {
        btnRegistro.disabled = cargando;
        btnRegistro.classList.toggle('cargando', cargando);
        btnRegistro.setAttribute('aria-busy', String(cargando));
        btnTexto.textContent = cargando ? 'Creando cuenta...' : 'Crear cuenta';
    }

    function configurarToggle(input, boton, etiquetaBase) {
        boton.addEventListener('click', function () {
            const visible = input.type === 'text';
            input.type = visible ? 'password' : 'text';
            this.setAttribute(
                'aria-label',
                visible ? `Mostrar ${etiquetaBase}` : `Ocultar ${etiquetaBase}`
            );
        });
    }

    configurarToggle(campos.password, document.getElementById('toggle-contrasena'), 'contraseña');
    configurarToggle(campos.confirmPassword, document.getElementById('toggle-confirmar'), 'confirmación de contraseña');

    ['btn-google', 'btn-apple'].forEach((id) => {
        const boton = document.getElementById(id);
        boton.addEventListener('click', () => {
            mostrarAlerta(
                'El registro con ' + boton.textContent.trim() + ' estará disponible pronto.',
                'info'
            );
        });
    });

    // Enlaces legales aún no disponibles: evitar salto de ancla.
    document.querySelectorAll('.login-opciones--terminos a').forEach((enlace) => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mostrarAlerta('Los documentos legales estarán disponibles pronto.', 'info');
        });
    });

    // --- Validación ---
    function validarFormulario() {
        limpiarErrores();
        let valido = true;
        let primerInvalido = null;

        const fullName = campos.fullName.value.trim();
        const workshopName = campos.workshopName.value.trim();
        const email = campos.email.value.trim();
        const phone = campos.phone.value.trim();
        const password = campos.password.value;
        const confirmPassword = campos.confirmPassword.value;

        function marcar(clave, mensaje) {
            mostrarErrorCampo(clave, mensaje);
            if (!primerInvalido) primerInvalido = campos[clave];
            valido = false;
        }

        if (!fullName) marcar('fullName', 'Ingresa tu nombre completo.');
        if (!workshopName) marcar('workshopName', 'Ingresa el nombre del taller.');

        if (!email) {
            marcar('email', 'Ingresa tu correo electrónico.');
        } else if (!REGEX_CORREO.test(email)) {
            marcar('email', 'El correo electrónico no tiene un formato válido.');
        }

        if (!phone) {
            marcar('phone', 'Ingresa un teléfono de contacto.');
        } else if (!REGEX_TELEFONO.test(phone) || phone.replace(/\D/g, '').length < 7) {
            marcar('phone', 'Ingresa un teléfono válido (mínimo 7 dígitos).');
        }

        if (!password) {
            marcar('password', 'Ingresa una contraseña.');
        } else if (password.length < LONGITUD_MIN_CONTRASENA) {
            marcar('password', `La contraseña debe tener al menos ${LONGITUD_MIN_CONTRASENA} caracteres.`);
        }

        if (!confirmPassword) {
            marcar('confirmPassword', 'Confirma tu contraseña.');
        } else if (password !== confirmPassword) {
            marcar('confirmPassword', 'Las contraseñas no coinciden.');
        }

        if (!campos.acceptTerms.checked) {
            marcar('acceptTerms', 'Debes aceptar los Términos de servicio y la Política de privacidad.');
        }

        if (primerInvalido && typeof primerInvalido.focus === 'function') {
            primerInvalido.focus();
        }

        return valido;
    }

    /**
     * Construye el payload listo para el backend.
     * @param {object} datos
     * @returns {object}
     */
    function construirPayload(datos) {
        return {
            fullName: datos.fullName,
            workshopName: datos.workshopName,
            email: datos.email,
            phone: datos.phone,
            password: datos.password,
        };
    }

    /**
     * Envía el registro del taller al backend.
     * Por ahora solo valida y deja el contrato listo para la API.
     * @param {object} userData
     */
    async function registerWorkshop(userData) {
        // TODO: Conectar con endpoint POST del backend
        // Ejemplo futuro:
        // const respuesta = await fetch('/api/auth/register', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(userData),
        // });
        // if (!respuesta.ok) throw new Error('No se pudo crear la cuenta.');
        // return await respuesta.json();

        console.log('[AutoTech] Payload de registro validado:', userData);
        return { ok: true, userData };
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarAlerta();

        if (!validarFormulario()) {
            mostrarAlerta('Revisa los campos marcados e inténtalo de nuevo.', 'error');
            return;
        }

        const payload = construirPayload({
            fullName: campos.fullName.value.trim(),
            workshopName: campos.workshopName.value.trim(),
            email: campos.email.value.trim().toLowerCase(),
            phone: campos.phone.value.trim(),
            password: campos.password.value,
        });

        estadoCargando(true);

        try {
            await registerWorkshop(payload);
            mostrarAlerta(
                'Datos validados correctamente. Tu cuenta está lista para conectarse al backend.',
                'success'
            );
            form.reset();
            limpiarErrores();
        } catch (error) {
            mostrarAlerta(error.message || 'No se pudo completar el registro.', 'error');
        } finally {
            estadoCargando(false);
        }
    });
});
