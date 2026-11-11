const URL_LOGIN ='https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/';
const form = document.getElementById('formLogin');
const inputUsuario = document.getElementById('usuario');
const inputPassword = document.getElementById('contrasenia');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('btnEntrar');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Iniciando sesión...';

    try{
        const res = await fetch(URL_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario: inputUsuario.value.trim(),
                contrasenia: inputPassword.value
            })
        });
        const json = await res.json();

        if (res.ok && json.success ) {
            sessionStorage.setItem('clarisa_token', json.data.token);  
            sessionStorage.setItem('clarisa_usuario',
    json.data.usuario.userName);
    window.location.href = 'Factura/Factura.html';
            }else {
                mensaje.textContent = json.errores?.errores?.[0]?.errorMessage
                || json.textResponse || 'No se pudo iniciar sesion';
            }
        }catch (error) {
            mensaje.textContent = 'Error al iniciar sesión o el servidor no responde.';
        } finally {
            boton.disabled = false;
            boton.textContent = 'Iniciar sesión';

        }
        });
    