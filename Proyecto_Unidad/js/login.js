// Inicio de sesion contra el API de pruebas de Clarisa.
const URL_LOGIN = 'https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/';
const PERMISO_FACTURACION = 'GESTIONAR_FACTURACION_ELECTRONICA';
const CLAVE_USUARIO_RECORDADO = 'autotech-usuario';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login');
    const usuario = document.getElementById('usuario');
    const contrasena = document.getElementById('contrasena');
    const recordarme = document.getElementById('recordarme');
    const btnSesion = document.getElementById('btn-sesion');
    const btnTexto = btnSesion.querySelector('.btn-texto');
    const alerta = document.getElementById('login-alerta');

    if (sessionStorage.getItem('authToken')) {
        window.location.replace('factura.html');
        return;
    }

    const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO_RECORDADO);
    if (usuarioGuardado) {
        usuario.value = usuarioGuardado;
        recordarme.checked = true;
    }

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

    // Clarisa envia `errores` como arreglo o como { errores: [{ codError, errorMessage }] }.
    function mensajeDeError(data) {
        const lista = Array.isArray(data?.errores) ? data.errores : data?.errores?.errores;
        const primero = Array.isArray(lista) ? lista[0] : null;
        const textoError = typeof primero === 'string'
            ? primero
            : primero?.errorMessage || primero?.mensaje || primero?.message;
        return textoError || data?.textResponse || 'Credenciales incorrectas.';
    }

    async function leerJson(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

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
            const response = await fetch(URL_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: valorUsuario, contrasenia: valorContrasena })
            });
            const data = await leerJson(response);

            if (!response.ok || data?.success !== true) {
                throw new Error(mensajeDeError(data));
            }

            const rawToken = data.data?.token;
            if (!rawToken) {
                throw new Error('El servidor no devolvió un token de autenticación.');
            }

            const permisos = data.data?.permisos || [];
            if (!permisos.includes(PERMISO_FACTURACION)) {
                throw new Error('El usuario no cuenta con permisos de facturación electrónica.');
            }

            const authToken = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
            const userName = data.data?.usuario?.userName || valorUsuario;

            sessionStorage.setItem('authToken', authToken);
            sessionStorage.setItem('userLogged', userName);

            if (recordarme.checked) {
                localStorage.setItem(CLAVE_USUARIO_RECORDADO, valorUsuario);
            } else {
                localStorage.removeItem(CLAVE_USUARIO_RECORDADO);
            }

            mostrarAlerta(`${data.textResponse || 'Bienvenido'}, ${userName}. Redirigiendo a facturación...`, 'success');
            btnTexto.textContent = 'Ingresando...';
            setTimeout(() => window.location.assign('factura.html'), 800);
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
