/**
 * Cabecera compartida mínima (Proveedores / Productos):
 * - Pestaña Módulos → panel-principal.html
 * - Badge de usuario + Cerrar sesión
 * No altera la lógica CRUD de esos módulos.
 */
(function () {
    var PAGINA_LOGIN = '../login.html';

    var NOMBRE_ROL = {
        1: 'Administrador',
        3: 'Cajero / Recepcionista',
        4: 'Mecánico',
        5: 'Almacenista'
    };

    function asegurarEnlaceModulos() {
        var nav = document.querySelector('nav[aria-label="Navegación principal"] ul');
        if (!nav) return;
        var yaExiste = Array.prototype.some.call(nav.querySelectorAll('a[href]'), function (a) {
            return (a.getAttribute('href') || '').indexOf('panel-principal.html') !== -1;
        });
        if (yaExiste) return;

        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = 'panel-principal.html';
        a.textContent = 'Módulos';
        li.appendChild(a);
        nav.insertBefore(li, nav.firstChild);

        var logoLink = document.querySelector('.header-logo a');
        if (logoLink) {
            logoLink.setAttribute('href', 'panel-principal.html');
        }
    }

    function textoUsuario() {
        var nombre = sessionStorage.getItem('userName') || 'usuario';
        var rol = parseInt(sessionStorage.getItem('userRole'), 10);
        var etiqueta = NOMBRE_ROL[rol];
        return etiqueta ? (nombre + ' (' + etiqueta + ')') : nombre;
    }

    function iniciarSesionCabecera() {
        asegurarEnlaceModulos();

        var badge = document.getElementById('usuario-activo');
        if (badge) {
            badge.textContent = textoUsuario();
        }

        var btn = document.getElementById('btn-cerrar-sesion');
        if (btn && !btn.dataset.sesionLista) {
            btn.dataset.sesionLista = '1';
            btn.addEventListener('click', function () {
                sessionStorage.removeItem('pantherKeyAPI');
                sessionStorage.removeItem('userName');
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('pantherToken');
                if (typeof Sesion !== 'undefined' && typeof Sesion.cerrar === 'function') {
                    Sesion.cerrar();
                }
                window.location.replace(PAGINA_LOGIN);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarSesionCabecera);
    } else {
        iniciarSesionCabecera();
    }
})();
