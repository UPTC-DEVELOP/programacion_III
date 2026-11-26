// config.js — ÚNICO archivo que se cambia al publicar (producción).
const CONFIG = {
  // URL del backend Panther. Si se deja vacío se detecta sola:
  //  - en local (XAMPP):   .../panther/frontend/  ->  ../backend_panther/panther/rest/
  //  - en el hosting:      frontend en la raíz y carpeta backend_panther al lado -> backend_panther/panther/rest/
  // En producción también puede ser absoluta, ej: "https://tallermax.infinityfreeapp.com/backend_panther/panther/rest/"
  API_URL: 'https://emk.alwaysdata.net/',

  // Cómo se habla con Clarisa:
  //  'proxy'   -> el navegador llama a Panther (clarisa/login y clarisa/factura) y Panther llama a Clarisa por cURL.
  //               Valida la clave en el servidor y evita problemas de CORS. Es lo recomendado.
  //  'directo' -> el navegador llama directamente a Clarisa (úsese si el hosting bloquea cURL saliente / puerto 8443).
  //               Requiere que Clarisa permita CORS y CLARISA_ENLACE_DIRECTO=1 en el backend.
  CLARISA_MODO: 'proxy',

  // URLs de la API de pruebas de Clarisa (las de la guía de la actividad)
  CLARISA_LOGIN_URL: 'https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/',
  CLARISA_FACTURA_URL: 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional',

  // Cabecera con la que Clarisa espera el token en la factura: 'Authorization: <token>' (sin 'Bearer'), como en la guía.
  CLARISA_TOKEN_HEADER: 'Authorization',
  CLARISA_TOKEN_PREFIX: '',

  // Página a la que se va tras un login exitoso
  PAGINA_DESTINO: 'factura.html'
};

CONFIG.urlApi = function () {
  if (CONFIG.API_URL) return CONFIG.API_URL.replace(/\/?$/, '/');
  const enCarpetaFrontend = /\/frontend\//.test(window.location.pathname);
  return (enCarpetaFrontend ? '../' : '') + 'backend_panther/panther/rest/';
};