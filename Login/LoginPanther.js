/* Login contra Panther: guarda la keyAPI y vuelve a la página que la pidió */

const form = document.getElementById('formLogin');
const inputUsuario = document.getElementById('usuario');
const inputPassword = document.getElementById('contrasenia');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('btnEntrar');
const botonVer = document.getElementById('verClave');

// Solo se vuelve a páginas de este mismo sitio
function destino() {
  const volver = new URLSearchParams(window.location.search).get('volver');

  // Si no existe una página de retorno, ir al inicio
  if (!volver) {
    return '../index.html';
  }

  try {
    const url = new URL(volver, window.location.href);

    if (url.origin === window.location.origin) {
      return url.href;
    }
  } catch (e) {
    /* parámetro inválido */
  }

  return '../index.html';
}

// Mostrar / ocultar la contraseña
botonVer.addEventListener('click', () => {
  const oculta = inputPassword.type === 'password';
  inputPassword.type = oculta ? 'text' : 'password';
  botonVer.textContent = oculta ? 'Ocultar' : 'Mostrar';
  botonVer.setAttribute(
    'aria-label',
    oculta ? 'Ocultar contraseña' : 'Mostrar contraseña'
  );
});

// Al escribir se limpia el mensaje de error anterior
[inputUsuario, inputPassword].forEach((campo) => {
  campo.addEventListener('input', () => {
    mensaje.textContent = '';
  });
});

// Procesar el inicio de sesión
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.textContent = '';

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Iniciando sesión...';

  try {
    await Panther.login(
      inputUsuario.value.trim(),
      inputPassword.value
    );

    window.location.href = destino();

  } catch (error) {
    mensaje.textContent = error.message;

  } finally {
    boton.disabled = false;
    boton.textContent = 'Iniciar Sesión';
  }
});