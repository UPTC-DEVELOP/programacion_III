// Inicio de sesion contra el API de pruebas de Clarisa.
// Depende de js/servicios/clarisa.js (Sesion y ClarisaApi).

// --- Constantes ---
const CLAVE_USUARIO_RECORDADO = 'autotech-usuario';
const PAGINA_FACTURACION = 'pages/factura.html';

// --- Ciclo de vida ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias del DOM ---
    const form = document.getElementById('form-login');
    const usuario = document.getElementById('usuario');
    const contrasena = document.getElementById('contrasena');
    const recordarme = document.getElementById('recordarme');
    const btnSesion = document.getElementById('btn-sesion');
    const btnTexto = btnSesion.querySelector('.btn-texto');
    const alerta = document.getElementById('login-alerta');

    if (Sesion.activa()) {
        window.location.replace(PAGINA_FACTURACION);
        return;
    }

    const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO_RECORDADO);
    if (usuarioGuardado) {
        usuario.value = usuarioGuardado;
        recordarme.checked = true;
    }

    // --- Funciones auxiliares ---
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

    function estadoCargando(cargando) {
        btnSesion.disabled = cargando;
        btnSesion.classList.toggle('cargando', cargando);
        btnSesion.setAttribute('aria-busy', String(cargando));
        btnTexto.textContent = cargando ? 'Validando credenciales...' : 'Iniciar Sesión';
    }

    // --- Manejadores de eventos ---
    document.getElementById('toggle-contrasena').addEventListener('click', function () {
        const visible = contrasena.type === 'text';
        contrasena.type = visible ? 'password' : 'text';
        this.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });

    document.getElementById('olvide-contrasena').addEventListener('click', (e) => {
        e.preventDefault();
        mostrarAlerta('Comunícate con el administrador de Clarisa para restablecer tu contraseña.', 'info');
    });

    ['btn-google', 'btn-apple'].forEach((id) => {
        const boton = document.getElementById(id);
        boton.addEventListener('click', () => {
            mostrarAlerta('El inicio de sesión con ' + boton.textContent.trim() + ' estará disponible pronto.', 'info');
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarAlerta();

        const valorUsuario = usuario.value.trim();
        const valorContrasena = contrasena.value;

        if (!valorUsuario || !valorContrasena.trim()) {
            mostrarAlerta('Ingresa tu usuario y tu contraseña.', 'error');
            (valorUsuario ? contrasena : usuario).focus();
            return;
        }

        estadoCargando(true);

        try {
            const { ok, data } = await ClarisaApi.login(valorUsuario, valorContrasena);

            if (!ok || data?.success !== true) {
                throw new Error(ClarisaApi.mensajeDeError(data) || 'Credenciales incorrectas.');
            }

            const rawToken = data.data?.token;
            if (!rawToken) {
                throw new Error('El servidor no devolvió un token de autenticación.');
            }

            const permisos = data.data?.permisos || [];
            if (!permisos.includes(ClarisaApi.PERMISO_FACTURACION)) {
                throw new Error('El usuario no cuenta con permisos de facturación electrónica.');
            }

            const userName = data.data?.usuario?.userName || valorUsuario;
            Sesion.iniciar(rawToken, userName);

            if (recordarme.checked) {
                localStorage.setItem(CLAVE_USUARIO_RECORDADO, valorUsuario);
            } else {
                localStorage.removeItem(CLAVE_USUARIO_RECORDADO);
            }

            mostrarAlerta(`${data.textResponse || 'Bienvenido'}, ${userName}. Redirigiendo a facturación...`, 'success');
            btnTexto.textContent = 'Ingresando...';
            setTimeout(() => window.location.assign(PAGINA_FACTURACION), 800);
        } catch (error) {
            const sinConexion = error instanceof TypeError;
            mostrarAlerta(
                sinConexion
                    ? 'No fue posible conectar con el servidor de Clarisa. Verifica tu conexión e inténtalo de nuevo.'
                    : error.message,
                'error'
            );
            estadoCargando(false);
        }
    });
});
