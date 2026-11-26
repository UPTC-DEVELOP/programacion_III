// api.js — Cliente del backend Panther (REST). Solo usa fetch (HTML5 + JavaScript puro).
// Todas las respuestas de Panther tienen la forma { state, code, data }.

class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

// Evita que texto escrito por el usuario se interprete como HTML
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

// Petición base. Devuelve el campo "data" de la respuesta o lanza ErrorApi con un mensaje legible.
async function pedirApi(ruta, metodo = 'GET', datos = null) {
  const opciones = { method: metodo, headers: {} };
  const sesion = obtenerSesion();
  if (sesion) opciones.headers['authorization'] = sesion.keyAPI;
  if (datos !== null) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(CONFIG.urlApi() + ruta, opciones);
  } catch (error) {
    throw new ErrorApi('No se pudo conectar con el servidor (backend Panther). Revisa que esté en línea.', 0);
  }

  const texto = await respuesta.text();
  let cuerpo = null;
  try { cuerpo = texto ? JSON.parse(texto) : null; } catch (e) { /* no era JSON */ }

  if (respuesta.ok) return cuerpo ? cuerpo.data : null;

  const mensaje = cuerpo && typeof cuerpo.data === 'string' ? cuerpo.data : 'Error ' + respuesta.status + ' del servidor.';
  // Llave de Panther inválida/ausente: la sesión ya no sirve
  if (respuesta.status === 401 || (respuesta.status === 400 && /Token para autenticar/i.test(mensaje))) {
    cerrarSesion();
  }
  throw new ErrorApi(mensaje, respuesta.status);
}

const api = {
  listar: (recurso) => pedirApi(recurso),
  obtener: (recurso, id) => pedirApi(recurso + '/' + id).then((d) => d[0]),
  crear: (recurso, datos) => pedirApi(recurso, 'POST', datos),
  actualizar: (recurso, id, datos) => pedirApi(recurso + '/' + id, 'PUT', datos),
  eliminar: (recurso, id) => pedirApi(recurso + '/' + id, 'DELETE')
};

// Mensaje corto reutilizable en las páginas (usa el elemento #mensaje si existe)
let temporizadorMensaje;
function mostrarMensaje(texto, tipo = 'exito') {
  const mensaje = document.getElementById('mensaje');
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = `mensaje mensaje--${tipo}`;
  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => {
    mensaje.className = 'mensaje mensaje--oculto';
    mensaje.textContent = '';
  }, 4500);
}