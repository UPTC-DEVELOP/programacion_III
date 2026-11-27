/**
 * Base URL del REST Panther (módulos propios: login, panel, órdenes, factura).
 * Default Windows/XAMPP: http://localhost/panther/backend_panther/panther/rest
 * Override Mac: localStorage PANTHER_REST_BASE (mac-panther-setup.html) — no quemar :8080 en git.
 *
 * También exporta window.PANTHER_API_URL para que panther.js (CRUDs del equipo)
 * reutilice la misma base si ambos scripts conviven en el futuro.
 */
(function (w) {
    var DEFAULT_WINDOWS =
        'http://localhost/panther/backend_panther/panther/rest';

    var stored = null;
    try {
        stored = w.localStorage.getItem('PANTHER_REST_BASE');
    } catch (e) { /* private mode */ }

    w.PANTHER_REST_BASE = String(
        w.PANTHER_REST_BASE || stored || DEFAULT_WINDOWS
    ).replace(/\/$/, '');

    // Alias leído por js/servicios/panther.js (Clientes/Vehículos/Empleados)
    if (!w.PANTHER_API_URL) {
        w.PANTHER_API_URL = w.PANTHER_REST_BASE;
    }

    w.pantherUrl = function pantherUrl(recurso) {
        var path = String(recurso || '').replace(/^\//, '');
        return w.PANTHER_REST_BASE + (path ? '/' + path : '');
    };
})(window);
