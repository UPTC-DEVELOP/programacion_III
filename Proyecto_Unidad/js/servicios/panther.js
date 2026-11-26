/**
 * Cliente API Panther (PHP REST) — JavaScript puro, sin frameworks.
 * Centraliza GET / POST / PUT / DELETE hacia Panther/backend_panther/panther/rest/
 *
 * No usa el token de Clarisa (Sesion); maneja solo el keyAPI de Panther.
 */

/** Clave API por defecto del usuario seed `j4user` / admin (panther.sql). */
const PANTHER_DEFAULT_KEY_API = '750e8b43e5ed564462c90ef0d382db26';

/**
 * Base URL del REST Panther (backend canónico del equipo).
 * - Desde pages/:  ../../Panther/backend_panther/panther/rest
 * - Desde raíz Proyecto_Unidad (login.html, index.html): ../Panther/backend_panther/panther/rest
 * - Producción / XAMPP: asignar window.PANTHER_API_URL (ej. http://localhost/panther/backend_panther/panther/rest)
 */
const PANTHER_BASE_URL = (function resolvePantherBaseUrl() {
    if (typeof window !== 'undefined' && window.PANTHER_API_URL) {
        return String(window.PANTHER_API_URL).replace(/\/$/, '');
    }

    const path = (typeof window !== 'undefined' && window.location && window.location.pathname)
        ? window.location.pathname
        : '';

    // Páginas en /pages/ → subir a la raíz del repo relativo
    if (/\/pages\//.test(path)) {
        return '../../Panther/backend_panther/panther/rest';
    }

    return '../Panther/backend_panther/panther/rest';
})();

class PantherApi {
    /**
     * @param {string} [keyAPI] Clave Authorization de Panther (no el token Clarisa).
     * @param {string} [baseUrl] Override de la base URL.
     */
    constructor(keyAPI, baseUrl) {
        this.keyAPI = keyAPI || PantherApi.getStoredKeyAPI() || PANTHER_DEFAULT_KEY_API;
        this.baseUrl = (baseUrl || PANTHER_BASE_URL).replace(/\/$/, '');
    }

    /** Guarda el keyAPI de Panther sin tocar el token Clarisa de Sesion. */
    static setKeyAPI(keyAPI) {
        if (keyAPI) {
            sessionStorage.setItem('pantherKeyAPI', keyAPI);
        }
    }

    static getStoredKeyAPI() {
        return sessionStorage.getItem('pantherKeyAPI');
    }

    static clearKeyAPI() {
        sessionStorage.removeItem('pantherKeyAPI');
    }

    get(recurso, id) {
        const ruta = id !== undefined && id !== null && id !== ''
            ? `${recurso}/${id}`
            : recurso;
        return this._request('GET', ruta);
    }

    post(recurso, payload) {
        return this._request('POST', recurso, payload);
    }

    put(recurso, id, payload) {
        const ruta = id !== undefined && id !== null && id !== ''
            ? `${recurso}/${id}`
            : recurso;
        return this._request('PUT', ruta, payload);
    }

    delete(recurso, id) {
        const ruta = id !== undefined && id !== null && id !== ''
            ? `${recurso}/${id}`
            : recurso;
        return this._request('DELETE', ruta);
    }

    /**
     * Respuesta uniforme: { ok, status, data, mensaje }
     */
    async _request(method, ruta, payload) {
        const url = `${this.baseUrl}/${String(ruta).replace(/^\//, '')}`;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: this.keyAPI
        };

        let response;
        try {
            response = await fetch(url, {
                method,
                headers,
                body: payload !== undefined ? JSON.stringify(payload) : undefined
            });
        } catch (error) {
            return {
                ok: false,
                status: 0,
                data: null,
                mensaje: error && error.message
                    ? error.message
                    : 'No se pudo conectar con el API Panther'
            };
        }

        const data = await PantherApi._leerCuerpo(response);
        const mensaje = PantherApi._extraerMensaje(response.status, data);

        return {
            ok: response.ok,
            status: response.status,
            data,
            mensaje
        };
    }

    static async _leerCuerpo(response) {
        if (response.status === 204) {
            return null;
        }

        const texto = await response.text();
        if (!texto) {
            return null;
        }

        try {
            return JSON.parse(texto);
        } catch (_) {
            return { raw: texto };
        }
    }

    static _extraerMensaje(status, data) {
        if (data && typeof data === 'object') {
            if (typeof data.message === 'string') return data.message;
            if (typeof data.mensaje === 'string') return data.mensaje;
            if (typeof data.body === 'string') return data.body;
            if (data.body && typeof data.body.message === 'string') return data.body.message;
            // ContentBody Panther: { state, code, data: { id, mensaje } | string | array }
            if (data.data && typeof data.data === 'object' && typeof data.data.mensaje === 'string') {
                return data.data.mensaje;
            }
            if (typeof data.data === 'string') return data.data;
        }

        const porCodigo = {
            200: 'OK',
            201: 'Creado',
            204: 'Sin contenido',
            400: 'Solicitud incorrecta',
            401: 'No autorizado (keyAPI inválida o ausente)',
            404: 'Recurso no encontrado',
            500: 'Error interno del servidor'
        };

        return porCodigo[status] || `Respuesta HTTP ${status}`;
    }
}

// Instancia por defecto con keyAPI de j4user (mientras se unifica el login).
const pantherApi = new PantherApi();
