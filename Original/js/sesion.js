
const SESION = {
  CLAVE: 'tallermax_sesion',
  DURACION_MS: 12 * 60 * 60 * 1000 // el token de Clarisa dura 12 horas
};

// Guarda lo que devuelve la API (data.token, data.usuario, data.permisos)
function guardarSesion(data) {
  const sesion = {
    token: data.token,                       
    usuario: data.usuario ? data.usuario.userName : '',
    permisos: data.permisos || [],
    expira: Date.now() + SESION.DURACION_MS
  };
  try {
    localStorage.setItem(SESION.CLAVE, JSON.stringify(sesion));
    return true;
  } catch (error) {
    console.error('No se pudo guardar la sesión:', error);
    return false;
  }
}

// Devuelve la sesión si existe y no ha vencido, si no, null
function obtenerSesion() {
  try {
    const crudo = localStorage.getItem(SESION.CLAVE);
    if (!crudo) return null;

    const sesion = JSON.parse(crudo);
    if (!sesion.token || Date.now() > sesion.expira) {
      cerrarSesion();
      return null;
    }
    return sesion;
  } catch (error) {
    return null;
  }
}

function cerrarSesion() {
  try {
    localStorage.removeItem(SESION.CLAVE);
  } catch (error) {
    /* sin accion: si no se puede borrar, no hay nada mas que hacer */
  }
}

// Para poner al inicio de las paginas privadas (como factura.html)
function protegerPagina(rutaLogin = 'login.html') {
  if (!obtenerSesion()) {
    window.location.replace(rutaLogin);
  }
}