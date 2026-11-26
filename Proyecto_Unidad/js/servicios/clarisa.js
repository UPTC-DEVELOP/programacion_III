// Cliente del API de pruebas de Clarisa y manejo de la sesion autenticada.
// Guia: https://ayuda.clarisa.co/guia-tecnica-para-consumo-api-factura-electronica/

// --- Sesion ---
class Sesion {
    static CLAVE_TOKEN = 'authToken';
    static CLAVE_USUARIO = 'userLogged';

    // El token de Clarisa ya trae el prefijo "Bearer "; se normaliza para no duplicarlo.
    static iniciar(token, usuario) {
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        sessionStorage.setItem(Sesion.CLAVE_TOKEN, authToken);
        sessionStorage.setItem(Sesion.CLAVE_USUARIO, usuario);
    }

    static get token() {
        return sessionStorage.getItem(Sesion.CLAVE_TOKEN);
    }

    static get usuario() {
        return sessionStorage.getItem(Sesion.CLAVE_USUARIO);
    }

    static activa() {
        return Boolean(Sesion.token);
    }

    static cerrar() {
        sessionStorage.clear();
    }
}

// --- ClarisaApi ---
class ClarisaApi {
    static BASE_URL = 'https://pru.clarisacloud.com:8443';
    static PERMISO_FACTURACION = 'GESTIONAR_FACTURACION_ELECTRONICA';
    static TIPO_DOCUMENTO_FACTURA = '01';

    constructor(token = Sesion.token) {
        this.token = token;
    }

    static login(usuario, contrasenia) {
        return ClarisaApi.peticion('/seguridad/rest/api/v1/login/', {
            method: 'POST',
            body: { usuario, contrasenia }
        });
    }

    emitirFactura(payload) {
        return ClarisaApi.peticion('/api/factura/rest/v1/factura/nacional', {
            method: 'POST',
            body: payload,
            token: this.token
        });
    }

    consultarEstado(nit, numeroDocumento, tipoDocumento = ClarisaApi.TIPO_DOCUMENTO_FACTURA) {
        const parametros = new URLSearchParams({ nit, tipoDocumento, numeroDocumento });
        return ClarisaApi.peticion(`/api/factura/rest/v1/factura/validacion?${parametros}`, {
            token: this.token
        });
    }

    // Lanza TypeError si no hay conexion; el llamador decide como informarlo.
    static async peticion(ruta, { method = 'GET', body, token } = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = token;

        const response = await fetch(`${ClarisaApi.BASE_URL}${ruta}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        return { status: response.status, ok: response.ok, data: await ClarisaApi.leerRespuesta(response) };
    }

    static async leerRespuesta(response) {
        const texto = await response.text();
        try {
            return texto ? JSON.parse(texto) : {};
        } catch {
            return texto;
        }
    }

    // Clarisa envia los errores en data.errores (arreglo u objeto { errores }) o en data.data.errores.
    static mensajeDeError(data) {
        if (!data || typeof data !== 'object') return '';
        const contenedor = data.data?.errores ?? data.errores;
        const lista = Array.isArray(contenedor) ? contenedor : contenedor?.errores;
        const mensajes = (Array.isArray(lista) ? lista : [])
            .map((error) => (typeof error === 'string' ? error : error?.errorMessage || error?.mensaje || error?.message))
            .filter(Boolean);
        return mensajes.length ? mensajes.join(' · ') : (data.textResponse || '');
    }

    // La factura quedo creada en Clarisa y espera la respuesta de la DIAN.
    static estaVerificando(data) {
        return data?.data?.estadoClarisa === 'VERIFICANDO';
    }
}
