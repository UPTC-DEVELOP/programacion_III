// Login dual: Clarisa (demo_api) o Panther (taller)

const CLAVE_USUARIO_RECORDADO = 'autotech-usuario';
const PAGINA_PANEL = 'pages/panel-principal.html';
const URL_LOGIN_PANTHER = pantherUrl('useraction/login');
const KEY_API_SEED = '750e8b43e5ed564462c90ef0d382db26';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login');
    const usuario = document.getElementById('usuario');
    const contrasena = document.getElementById('contrasena');
    const recordarme = document.getElementById('recordarme');
    const btnSesion = document.getElementById('btn-sesion');
    const btnTexto = btnSesion.querySelector('.btn-texto');
    const alerta = document.getElementById('login-alerta');

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

    function estadoCargando(cargando) {
        btnSesion.disabled = cargando;
        btnSesion.classList.toggle('cargando', cargando);
        btnTexto.textContent = cargando ? 'Validando...' : 'Iniciar Sesión';
    }

    document.getElementById('toggle-contrasena').addEventListener('click', function () {
        const visible = contrasena.type === 'text';
        contrasena.type = visible ? 'password' : 'text';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alerta.hidden = true;

        const valorUsuario = usuario.value.trim();
        const valorContrasena = contrasena.value;

        if (!valorUsuario || !valorContrasena.trim()) {
            mostrarAlerta('Ingresa usuario y contraseña.', 'error');
            return;
        }

        estadoCargando(true);

        try {
            if (recordarme.checked) {
                localStorage.setItem(CLAVE_USUARIO_RECORDADO, valorUsuario);
            } else {
                localStorage.removeItem(CLAVE_USUARIO_RECORDADO);
            }

            if (valorUsuario.toLowerCase() === 'demo_api') {
                const { ok, data } = await ClarisaApi.login(valorUsuario, valorContrasena);
                if (!ok || data?.success !== true) {
                    throw new Error(ClarisaApi.mensajeDeError(data) || 'Credenciales incorrectas de facturación.');
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
                sessionStorage.removeItem('pantherKeyAPI');
                sessionStorage.removeItem('userRole');
                sessionStorage.setItem('userName', userName);
                mostrarAlerta(`${data.textResponse || 'Bienvenido'}, ${userName}. Redirigiendo al panel...`, 'success');
                btnTexto.textContent = 'Ingresando...';
                setTimeout(() => window.location.assign(PAGINA_PANEL), 800);
                return;
            }

            const response = await fetch(URL_LOGIN_PANTHER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: KEY_API_SEED
                },
                body: JSON.stringify({ user: valorUsuario, password: valorContrasena })
            });

            const data = await response.json().catch(() => null);
            const usuarioPanther = data && (data.data || data);
            const keyAPI = usuarioPanther && usuarioPanther.keyAPI;

            if (!response.ok || !keyAPI) {
                const msg = (data && (data.data || data.message || data.mensaje)) || 'Usuario o contraseña incorrectos.';
                throw new Error(typeof msg === 'string' ? msg : 'Usuario o contraseña incorrectos.');
            }

            const rol = parseInt(usuarioPanther.roles, 10) || 1;
            sessionStorage.setItem('pantherKeyAPI', keyAPI);
            sessionStorage.setItem('userName', usuarioPanther.user || valorUsuario);
            sessionStorage.setItem('userRole', String(rol));

            mostrarAlerta(`Bienvenido, ${usuarioPanther.user || valorUsuario}. Redirigiendo al panel...`, 'success');
            btnTexto.textContent = 'Ingresando...';
            setTimeout(() => window.location.assign(PAGINA_PANEL), 800);
        } catch (error) {
            mostrarAlerta(error.message || 'No se pudo iniciar sesión.', 'error');
            estadoCargando(false);
        }
    });
});
