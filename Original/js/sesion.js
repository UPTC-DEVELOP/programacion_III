// sesion.js — Sesión del usuario (Clarisa + Panther) y zona de sesión del encabezado.
const SESION = {
  CLAVE: 'tallermax_sesion',
  DURACION_MS: 12 * 60 * 60 * 1000 // el token de Clarisa dura 12 horas
};

// Guarda: { usuario, tokenClarisa, keyAPI (llave de Panther), permisos }
function guardarSesion(datos) {
  const sesion = {
    usuario: datos.usuario || '',
    tokenClarisa: datos.tokenClarisa || '',
    token: datos.tokenClarisa || '', // nombre que usa factura.js
    keyAPI: datos.keyAPI || '',
    permisos: datos.permisos || [],
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
    if (!sesion.keyAPI || !sesion.tokenClarisa || Date.now() > sesion.expira) {
      cerrarSesion(false);
      return null;
    }
    return sesion;
  } catch (error) {
    return null;
  }
}

function cerrarSesion(redirigir = true) {
  try {
    localStorage.removeItem(SESION.CLAVE);
  } catch (error) { /* nada más que hacer */ }
  if (redirigir) window.location.href = 'login.html';
}

// Páginas privadas: <html data-privada>. Sin sesión válida se vuelve al login.
function protegerPagina(rutaLogin = 'login.html') {
  if (!obtenerSesion()) window.location.replace(rutaLogin);
}
if (document.documentElement.hasAttribute('data-privada')) protegerPagina();

// Pinta en el encabezado "Iniciar sesión" o "Facturar · usuario · Salir"
function pintarZonaSesion() {
  const zona = document.getElementById('zonaSesion');
  if (!zona) return;
  const sesion = obtenerSesion();
  zona.innerHTML = '';
  if (!sesion) {
    const a = document.createElement('a');
    a.href = 'login.html';
    a.className = 'boton boton-borde-naranja boton-pequeno';
    a.textContent = 'Iniciar sesión';
    zona.appendChild(a);
    return;
  }


  const factura = document.createElement('a');
  factura.href = 'factura.html';
  factura.className = 'boton boton-secundario boton-pequeno';
  factura.textContent = 'Facturar';
  const salir = document.createElement('button');
  salir.type = 'button';
  salir.className = 'boton boton-borde-naranja boton-pequeno';
  salir.textContent = 'Salir (' + sesion.usuario + ')';
  salir.addEventListener('click', () => cerrarSesion());
  zona.append(factura, ' ', salir);
}
document.addEventListener('DOMContentLoaded', pintarZonaSesion);
 
