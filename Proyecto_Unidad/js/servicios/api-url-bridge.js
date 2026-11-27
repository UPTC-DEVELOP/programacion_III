/**
 * Bridge compartido (no edita CRUDs del equipo).
 *
 * 1) Si existe override Mac (localStorage / panther-config), reescribe
 *    fetch() que apunten a http://localhost/panther/.../rest → esa base.
 * 2) Asegura header Authorization (keyAPI de sesión o seed) en peticiones
 *    a Panther, evitando "Se requiere Token para autenticar...".
 *
 * Cargar ANTES de proveedores.js / productos.js (y opcional en otras páginas).
 */
(function (w) {
    var DEFAULT_XAMPP = 'http://localhost/panther/backend_panther/panther/rest';
    var SEED = '750e8b43e5ed564462c90ef0d382db26';

    function restBase() {
        if (w.PANTHER_REST_BASE) return String(w.PANTHER_REST_BASE).replace(/\/$/, '');
        if (w.PANTHER_API_URL) return String(w.PANTHER_API_URL).replace(/\/$/, '');
        try {
            var stored = w.localStorage.getItem('PANTHER_REST_BASE');
            if (stored) return String(stored).replace(/\/$/, '');
        } catch (e) { /* private mode */ }
        return DEFAULT_XAMPP;
    }

    function tokenPanther() {
        try {
            return w.sessionStorage.getItem('pantherKeyAPI') || SEED;
        } catch (e) {
            return SEED;
        }
    }

    function reescribirUrl(url) {
        var base = restBase();
        if (!url || base === DEFAULT_XAMPP) return url;
        if (url.indexOf(DEFAULT_XAMPP) === 0) {
            return base + url.slice(DEFAULT_XAMPP.length);
        }
        return url;
    }

    function esUrlPanther(url) {
        if (!url) return false;
        var base = restBase();
        return url.indexOf(DEFAULT_XAMPP) === 0
            || url.indexOf(base) === 0
            || /\/panther\/backend_panther\/panther\/rest/i.test(url)
            || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?(persons|vehiculos|empleados|proveedores|repuestos|ordenes|facturas|users|useraction)/i.test(url)
            || (base.indexOf('127.0.0.1') !== -1 && url.indexOf(base) === 0);
    }

    var originalFetch = w.fetch.bind(w);
    w.fetch = function (input, init) {
        init = init ? Object.assign({}, init) : {};
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var nueva = reescribirUrl(url);

        if (typeof input === 'string') {
            input = nueva;
        } else if (input && typeof Request !== 'undefined' && input instanceof Request && nueva !== url) {
            input = new Request(nueva, input);
        }

        var headers = new Headers(init.headers || (input && input.headers) || undefined);
        if (esUrlPanther(nueva || url)) {
            if (!headers.has('Authorization') && !headers.has('authorization')) {
                headers.set('Authorization', tokenPanther());
            }
        }
        init.headers = headers;

        return originalFetch(input, init);
    };
})(window);
