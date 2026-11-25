// Lógica simplificada: Admin va por Clarisa (Facturación). Empleados van por Panther (CRUDs).

const CLAVE_USUARIO_RECORDADO = 'autotech-usuario';
const PAGINA_FACTURACION = 'pages/factura.html';
const PAGINA_INDEX = 'pages/clientes.html'; 
const URL_LOGIN_PANTHER = 'http://localhost/panther/backend_panther/panther/rest/useraction/login';

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
          
            if (valorUsuario.toLowerCase() === 'demo_api') {
                const { ok, data } = await ClarisaApi.login(valorUsuario, valorContrasena);
                
                if (!ok || data?.success !== true) {
                    throw new Error('Credenciales incorrectas de facturación.');
                }
                
                // Guardamos el token de Clarisa
                const rawToken = data.data?.token;
                Sesion.iniciar(rawToken, valorUsuario);
                
                // Lo mandamos directo a facturar
                setTimeout(() => window.location.assign(PAGINA_FACTURACION), 800);
                return; // Terminamos aquí, no validamos en Panther
            }

       
            const resPanther = await fetch(URL_LOGIN_PANTHER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: valorUsuario, password: valorContrasena })
            });
            const dataPanther = await resPanther.json();

            if (!resPanther.ok || dataPanther.code !== 200) {
                throw new Error('Usuario o contraseña incorrectos (Empleado).');
            }

            // Guardamos el token local y el rol del empleado
            sessionStorage.setItem('pantherToken', dataPanther.data.keyAPI);
            sessionStorage.setItem('userRole', dataPanther.data.roles);
            sessionStorage.setItem('userName', dataPanther.data.user);

            if (recordarme.checked) {
                localStorage.setItem(CLAVE_USUARIO_RECORDADO, valorUsuario);
            }

            mostrarAlerta(`Bienvenido, ${dataPanther.data.user}. Redirigiendo...`, 'success');
            
            // Los empleados van al index (sus CRUDs)
            setTimeout(() => window.location.assign(PAGINA_INDEX), 800);

        } catch (error) {
            mostrarAlerta(error.message, 'error');
            estadoCargando(false);
        }
    });
});