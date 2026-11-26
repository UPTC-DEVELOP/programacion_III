// login.js — Inicio de sesión con la API de autenticación de Clarisa.
// Si es exitoso, guarda la sesión y redirige a factura.html (CONFIG.PAGINA_DESTINO).

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLogin');
  if (!form) return;

  if (obtenerSesion()) {
    window.location.replace(CONFIG.PAGINA_DESTINO);
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
  // Mensaje de error del formato de Clarisa: { errores: { errores: [{ errorMessage }] }, textResponse }
  function extraerMensajeError(json) {
    if (!json) return 'El servicio respondió de forma inesperada.';
    const lista = json.errores && json.errores.errores;
    if (lista && lista.length) return lista.map((e) => e.errorMessage).join(' ');
    return json.textResponse || 'No fue posible iniciar sesión.';
  }

  // ---- Modo proxy: Panther valida contra Clarisa y entrega su propia llave ----
  async function loginPorProxy(usuario, contrasenia) {
    let respuesta;

    try {
      respuesta = await fetch(CONFIG.urlApi() + 'clarisa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasenia })
      });
    } catch (e) {
      throw new ErrorApi('No se pudo conectar con el backend Panther.', 0);
    }
    const json = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      const msg = json && typeof json.data === 'string' ? json.data : 'Error ' + respuesta.status;
      throw new ErrorApi(msg, respuesta.status);
    }
    const d = json.data;
    return {
      usuario: d.clarisa.usuario ? d.clarisa.usuario.userName : usuario,
      tokenClarisa: d.clarisa.token,
      permisos: d.clarisa.permisos || [],
      keyAPI: d.keyAPI
    };
  }

  // ---- Modo directo: el navegador llama a Clarisa y luego pide su llave a Panther ----
  async function loginDirecto(usuario, contrasenia) {
    let respuesta;
    try {
      respuesta = await fetch(CONFIG.CLARISA_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasenia })
      });
    } catch (e) {
      throw new ErrorApi('No se pudo conectar con Clarisa (revisa la red o el CORS del servicio).', 0);
    }

    const json = await respuesta.json().catch(() => null);
    if (!respuesta.ok || !json || !json.success) {
      throw new ErrorApi(extraerMensajeError(json), respuesta.status);
    }
    const enlace = await fetch(CONFIG.urlApi() + 'useraction/clarisa-enlace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, token: json.data.token })
    });
    const jsonEnlace = await enlace.json().catch(() => null);
    if (!enlace.ok) {
      throw new ErrorApi(jsonEnlace && jsonEnlace.data ? jsonEnlace.data : 'Panther no aceptó la sesión.', enlace.status);
    }
    return {
      usuario: json.data.usuario ? json.data.usuario.userName : usuario,
      tokenClarisa: json.data.token,
      permisos: json.data.permisos || [],
      keyAPI: jsonEnlace.data.keyAPI
    };
  }

  [campoUsuario, campoClave].forEach((campo) => {
    campo.addEventListener('blur', () => validarCampo(campo));
    campo.addEventListener('input', () => {
      if (campo.classList.contains('invalid')) validarCampo(campo);
    });
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if ([campoUsuario, campoClave].map(validarCampo).includes(false)) {
      mostrarEstado('Revisa los campos marcados antes de continuar.', 'error');
      return;
    }

    cargando(true);
    mostrarEstado('Verificando credenciales…', '');
    let exito = false;

    try {
      const usuario = campoUsuario.value.trim();
      const datos = CONFIG.CLARISA_MODO === 'directo'
        ? await loginDirecto(usuario, campoClave.value)
        : await loginPorProxy(usuario, campoClave.value);

      if (!guardarSesion(datos)) throw new ErrorApi('No se pudo guardar la sesión en este navegador.', 0);
      exito = true;
      mostrarEstado('¡Bienvenido, ' + datos.usuario + '!', 'success');
      setTimeout(() => { window.location.href = CONFIG.PAGINA_DESTINO; }, 700);

    } catch (error) {
      console.error('Error en el login:', error);
      mostrarEstado(error.message, 'error');
      campoClave.value = '';
      campoClave.focus();
    } finally {
      if (!exito) cargando(false);
    }
  });
});
