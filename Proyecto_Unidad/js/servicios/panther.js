/**
 * Cliente API Panther (PHP REST) — JavaScript vainilla.
 * Centraliza GET / POST / PUT / DELETE hacia Panther/backend_panther/panther/rest/
 *
 * No usa el token de Clarisa (Sesion); maneja solo el keyAPI de Panther.
 */

/** Clave API por defecto del usuario seed `j4user` / admin (panther.sql). */
const PANTHER_DEFAULT_KEY_API = '750e8b43e5ed564462c90ef0d382db26';

/**
 * Base URL del REST Panther (capa compartida — no editar CRUDs del equipo).
 *
 * Prioridad:
 *   1) window.PANTHER_API_URL / window.PANTHER_REST_BASE
 *   2) localStorage.PANTHER_REST_BASE (override Mac / php -S; no se versiona)
 *   3) Default Windows XAMPP: http://localhost/panther/backend_panther/panther/rest
 *
 * Así Live Server (5500/5501) habla con Apache/XAMPP sin rutas relativas ni :8080 en git.
 */
const PANTHER_BASE_URL = (function resolvePantherBaseUrl() {
    var DEFAULT_WINDOWS = 'http://localhost/panther/backend_panther/panther/rest';

    if (typeof window === 'undefined') {
        return DEFAULT_WINDOWS;
    }

    if (window.PANTHER_API_URL) {
        return String(window.PANTHER_API_URL).replace(/\/$/, '');
    }
    if (window.PANTHER_REST_BASE) {
        return String(window.PANTHER_REST_BASE).replace(/\/$/, '');
    }

    try {
        var stored = window.localStorage.getItem('PANTHER_REST_BASE');
        if (stored) {
            return String(stored).replace(/\/$/, '');
        }
    } catch (e) { /* private mode */ }

    return DEFAULT_WINDOWS;
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
        // Releer keyAPI por si el login guardó sesión después de crear la instancia
        const token = PantherApi.getStoredKeyAPI() || this.keyAPI || PANTHER_DEFAULT_KEY_API;
        this.keyAPI = token;

        const headers = {
            // Solo una clave: el navegador unifica Authorization
            Authorization: token
        };
        // Content-Type solo con cuerpo → evita preflight extra en GET (Live Server → XAMPP)
        if (payload !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

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
