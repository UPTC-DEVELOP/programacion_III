// login.js — es el que consume la API de autenticación de Clarisa
const URL_LOGIN = 'https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/';
const PAGINA_DESTINO = 'clientes.html';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLogin');
  if (!form) return;

  if (obtenerSesion()) {
    window.location.replace(PAGINA_DESTINO);
    return;
  }

  const estado = document.getElementById('estadoLogin');
  const boton = document.getElementById('btnLogin');
  const textoBoton = boton.querySelector('.boton__texto');
  const campoUsuario = form.elements['usuario'];
  const campoClave = form.elements['contrasenia'];

  const reglas = {
    usuario: (v) => v.trim().length >= 5 && v.trim().length <= 255,
    contrasenia: (v) => v.length >= 5 && v.length <= 255
  };
  const mensajes = {
    usuario: 'El usuario debe tener entre 5 y 255 caracteres.',
    contrasenia: 'La contraseña debe tener entre 5 y 255 caracteres.'
  };

  function mostrarEstado(texto, tipo) {
    estado.textContent = texto;
    estado.className = 'estado-formulario' + (tipo ? ' ' + tipo : '');
  }

  function validarCampo(input) {
    const esValido = reglas[input.name](input.value);
    const spanError = form.querySelector(`[data-error-for="${input.name}"]`);
    input.classList.toggle('invalid', !esValido);
    if (spanError) spanError.textContent = esValido ? '' : mensajes[input.name];
    return esValido;
  }

  function cargando(activo) {
    boton.disabled = activo;
    textoBoton.textContent = activo ? 'Ingresando…' : 'Ingresar';
  }

  async function iniciarSesion(usuario, contrasenia) {
    const respuesta = await fetch(URL_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasenia })
    });
    let json = null;
    try {
      json = await respuesta.json();
    } catch (error) {
      /* la respuesta no era JSON */
    }
    return { ok: respuesta.ok, json };
  }

  function extraerMensajeError(json) {
    if (!json) return 'El servicio respondió de forma inesperada.';
    const lista = json.errores && json.errores.errores;
    if (lista && lista.length) {
      return lista.map((e) => e.errorMessage).join(' ');
    }
    return json.textResponse || 'No fue posible iniciar sesión.';
  }

  [campoUsuario, campoClave].forEach((campo) => {
    campo.addEventListener('blur', () => validarCampo(campo));
    campo.addEventListener('input', () => {
      if (campo.classList.contains('invalid')) validarCampo(campo);
    });
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const camposValidos = [campoUsuario, campoClave].map(validarCampo);
    if (camposValidos.includes(false)) {
      mostrarEstado('Revisa los campos marcados antes de continuar.', 'error');
      return;
    }

    cargando(true);
    mostrarEstado('Verificando credenciales…', '');
    let exito = false;

    try {
      const { ok, json } = await iniciarSesion(campoUsuario.value.trim(), campoClave.value);

      if (ok && json && json.success) {
        exito = true;
        guardarSesion(json.data);
        mostrarEstado(json.textResponse || 'Bienvenido', 'success');
        setTimeout(() => { window.location.href = PAGINA_DESTINO; }, 800);
      } else {
        mostrarEstado(extraerMensajeError(json), 'error');
        campoClave.value = '';
        campoClave.focus();
      }
    } catch (error) {
      console.error('Error al llamar al servicio de login:', error);
      mostrarEstado('No se pudo conectar con el servicio. Inténtalo de nuevo.', 'error');
    } finally {
      if (!exito) cargando(false);
    }
  });
});