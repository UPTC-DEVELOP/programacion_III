// Login dual: demo_api → Clarisa (facturación); resto → Panther (CRUDs del taller).

const CLAVE_USUARIO_RECORDADO = 'autotech-usuario';
const PAGINA_FACTURACION = 'pages/factura.html';
const PAGINA_TALLER = 'pages/clientes.html';

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

            // demo_api entra por Clarisa y va a facturación. El resto entra por Panther.
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
                mostrarAlerta(`${data.textResponse || 'Bienvenido'}, ${userName}. Redirigiendo a facturación...`, 'success');
                btnTexto.textContent = 'Ingresando...';
                setTimeout(() => window.location.assign(PAGINA_FACTURACION), 800);
                return;
            }

            const respuesta = await pantherApi.post('useraction/login', {
                user: valorUsuario,
                password: valorContrasena
            });
            const usuarioPanther = respuesta.data && respuesta.data.data;
            if (!respuesta.ok || !usuarioPanther || !usuarioPanther.keyAPI) {
                throw new Error(respuesta.mensaje || 'Usuario o contraseña incorrectos.');
            }

            PantherApi.setKeyAPI(usuarioPanther.keyAPI);
            sessionStorage.setItem('userRole', usuarioPanther.roles);
            sessionStorage.setItem('userName', usuarioPanther.user);
            mostrarAlerta(`Bienvenido, ${usuarioPanther.user}. Redirigiendo al taller...`, 'success');
            btnTexto.textContent = 'Ingresando...';
            setTimeout(() => window.location.assign(PAGINA_TALLER), 800);
        } catch (error) {
            mostrarAlerta(error.message, 'error');
            estadoCargando(false);
        }
    });
});
