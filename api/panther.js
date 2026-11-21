/* Conexión de TallerPro con la API REST de Panther (PHP + MySQL).
   Todas las páginas CRUD usan este archivo para hablar con el servidor.

   Panther responde siempre con: { state, code, data }
   - Login:  POST /useraction/login  { user, password }  -> data.keyAPI
   - Resto:  cabecera "authorization: <keyAPI>" */

const PANTHER_URL = 'http://localhost/panther/rest';
const PANTHER_CLAVE = 'panther_keyAPI';
const PANTHER_USUARIO = 'panther_usuario';

const Panther = {

  // Ruta de la página de login de Panther, relativa a la página actual
  paginaLogin: '../Login/LoginPanther.html',

  key() {
    return sessionStorage.getItem(PANTHER_CLAVE);
  },

  usuario() {
    return sessionStorage.getItem(PANTHER_USUARIO) || '';
  },

  // Si no hay sesión, manda al login y luego vuelve a esta página
  exigirSesion() {
    if (this.key()) return true;
    this.irAlLogin();
    return false;
  },

  irAlLogin() {
    const volver = encodeURIComponent(window.location.href);
    window.location.replace(this.paginaLogin + '?volver=' + volver);
  },

  cerrarSesion() {
    sessionStorage.removeItem(PANTHER_CLAVE);
    sessionStorage.removeItem(PANTHER_USUARIO);
  },

  async login(user, password) {
    const json = await this._enviar('POST', 'useraction/login', { user, password }, false);
    sessionStorage.setItem(PANTHER_CLAVE, json.data.keyAPI);
    sessionStorage.setItem(PANTHER_USUARIO, json.data.user);
    return json.data;
  },

  // CRUD genérico: recurso = 'clientes', 'empleados', 'administradores', ...
  listar(recurso)            { return this._enviar('GET', recurso).then((j) => j.data); },
  crear(recurso, datos)      { return this._enviar('POST', recurso, datos); },
  actualizar(recurso, id, d) { return this._enviar('PUT', recurso + '/' + id, d); },
  eliminar(recurso, id)      { return this._enviar('DELETE', recurso + '/' + id); },

  async _enviar(metodo, ruta, datos, conToken = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (conToken) headers.authorization = this.key() || '';

    let res;
    try {
      res = await fetch(PANTHER_URL + '/' + ruta, {
        method: metodo,
        headers,
        body: datos === undefined ? undefined : JSON.stringify(datos)
      });
    } catch (e) {
      throw new Error('No hay conexión con Panther. ¿Está encendido XAMPP (Apache y MySQL)?');
    }

    let json = null;
    try { json = await res.json(); } catch (e) { /* respuesta sin JSON */ }

    // keyAPI inválida o ausente: pedir login otra vez
    if (conToken && (res.status === 401 || (res.status === 400 && !this.key()))) {
      this.cerrarSesion();
      this.irAlLogin();
      throw new Error('Sesión vencida');
    }

    // El login fallido responde 403 en "code"
    if (!res.ok || !json || json.code >= 400) {
      const detalle = json && typeof json.data === 'string' ? json.data : 'Error ' + res.status;
      throw new Error(detalle);
    }
    return json;
  }
};
