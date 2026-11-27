/**
 * Base URL del REST Panther.
 * Default Windows/XAMPP: http://localhost/panther/backend_panther/panther/rest
 * Override opcional: localStorage PANTHER_REST_BASE o window.PANTHER_REST_BASE
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

    w.pantherUrl = function pantherUrl(recurso) {
        var path = String(recurso || '').replace(/^\//, '');
        return w.PANTHER_REST_BASE + (path ? '/' + path : '');
    };
})(window);
