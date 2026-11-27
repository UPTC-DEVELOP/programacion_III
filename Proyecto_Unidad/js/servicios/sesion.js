/**
 * Sesión + navegación centralizada AutoTech (roles del caso de estudio).
 *
 * Login Panther: admin/12345 (seed) u otros creados al registrar empleado
 *   (user = nombre del rol, password = documento).
 *
 * Roles j4rol (Panther/database/panther.sql):
 *   1 admin          → 7 módulos
 *   3 recepcionista  → Clientes, Órdenes, Facturación (Cajero/Recepcionista)
 *   4 mecanico       → Vehículos, Órdenes
 *   5 almacenista    → Productos, Proveedores, Órdenes
 * Clarisa demo_api   → solo Facturación (+ panel)
 *
 * Claves de sesión (sessionStorage): pantherKeyAPI, userName, userRole
 * NO usar localStorage.clear() — preserva PANTHER_REST_BASE (Mac override).
 */

const SesionTaller = {
    CLAVE_API: 'pantherKeyAPI',
    CLAVE_USER: 'userName',
    CLAVE_ROL: 'userRole',
    PAGINA_LOGIN: '../login.html',
    PAGINA_PANEL: 'panel-principal.html',

    /** Páginas CRUD permitidas por rol (sin el panel, que siempre está permitido). */
    MENUS: {
        1: ['clientes.html', 'vehiculos.html', 'empleados.html', 'proveedores.html', 'productos.html', 'ordenes.html', 'factura.html'],
        3: ['clientes.html', 'ordenes.html', 'factura.html'],
        4: ['vehiculos.html', 'ordenes.html'],
        5: ['productos.html', 'proveedores.html', 'ordenes.html']
    },

    /** Metadatos de cada módulo (panel gestor + tarjetas). */
    MODULOS: [
        { archivo: 'clientes.html', titulo: 'Clientes', descripcion: 'Registro y consulta de clientes del taller.' },
        { archivo: 'vehiculos.html', titulo: 'Vehículos', descripcion: 'Flota y vehículos asociados a clientes.' },
        { archivo: 'empleados.html', titulo: 'Empleados', descripcion: 'Personal del taller y roles de acceso.' },
        { archivo: 'proveedores.html', titulo: 'Proveedores', descripcion: 'Proveedores de repuestos y partes.' },
        { archivo: 'productos.html', titulo: 'Productos', descripcion: 'Inventario de repuestos y stock.' },
        { archivo: 'ordenes.html', titulo: 'Órdenes', descripcion: 'Órdenes de servicio y mano de obra.' },
        { archivo: 'factura.html', titulo: 'Facturación', descripcion: 'Emisión y seguimiento de facturas.' }
    ],

    /** Destino tras login / redirección por permiso denegado. */
    HOME: {
        1: 'panel-principal.html',
        3: 'panel-principal.html',
        4: 'panel-principal.html',
        5: 'panel-principal.html'
    },

    NOMBRE_ROL: {
        1: 'Administrador',
        3: 'Cajero / Recepcionista',
        4: 'Mecánico',
        5: 'Almacenista'
    },

    keyAPI() {
        return sessionStorage.getItem(this.CLAVE_API) || '';
    },

    usuario() {
        return sessionStorage.getItem(this.CLAVE_USER) || '';
    },

    rol() {
        const r = parseInt(sessionStorage.getItem(this.CLAVE_ROL), 10);
        return Number.isFinite(r) ? r : 0;
    },

    pantherActiva() {
        return Boolean(this.keyAPI());
    },

    clarisaActiva() {
        return typeof Sesion !== 'undefined' && typeof Sesion.activa === 'function' && Sesion.activa();
    },

    activa() {
        return this.pantherActiva() || this.clarisaActiva();
    },

    homeParaRol(rol) {
        const r = parseInt(rol, 10);
        return this.HOME[r] || this.PAGINA_PANEL;
    },

    paginasPermitidas(rol) {
        if (this.clarisaActiva() && !this.pantherActiva()) {
            return ['factura.html'];
        }
        const r = parseInt(rol != null ? rol : this.rol(), 10);
        return this.MENUS[r] || [];
    },

    puedeVer(archivo, rol) {
        if (!archivo) return true;
        if (archivo === this.PAGINA_PANEL || archivo === 'panel-principal.html') return true;
        if (archivo.includes('index.html')) return true;
        const r = rol != null ? parseInt(rol, 10) : this.rol();
        if (r === 1) return true;
        return this.paginasPermitidas(r).includes(archivo);
    },

    /**
     * Cierra solo claves de autenticación.
     * Conserva localStorage PANTHER_REST_BASE y autotech-usuario (recordarme).
     */
    cerrar() {
        sessionStorage.removeItem(this.CLAVE_API);
        sessionStorage.removeItem(this.CLAVE_USER);
        sessionStorage.removeItem(this.CLAVE_ROL);
        if (typeof Sesion !== 'undefined' && typeof Sesion.cerrar === 'function') {
            Sesion.cerrar();
        }
    },

    tokenPanther(fallback) {
        return this.keyAPI() || fallback || '750e8b43e5ed564462c90ef0d382db26';
    },

    exigirSesion() {
        if (!this.activa()) {
            window.location.replace(this.PAGINA_LOGIN);
            return false;
        }
        return true;
    },

    /** Si el rol no puede ver esta página, redirige al panel principal. */
    exigirPaginaActual() {
        const archivo = (window.location.pathname || '').split('/').pop() || '';
        if (!archivo || archivo === this.PAGINA_PANEL) return true;

        if (this.clarisaActiva() && !this.pantherActiva()) {
            if (archivo === 'factura.html' || archivo === this.PAGINA_PANEL) return true;
            window.location.replace(this.PAGINA_PANEL);
            return false;
        }

        const rol = this.rol();
        if (rol === 1) return true;

        const permitidos = this.paginasPermitidas(rol);
        if (!permitidos.length || permitidos.includes(archivo)) return true;

        window.location.replace(this.homeParaRol(rol));
        return false;
    },

    etiquetaRol() {
        if (this.clarisaActiva() && !this.pantherActiva()) {
            return 'Facturación DIAN';
        }
        const rol = this.rol();
        return this.NOMBRE_ROL[rol] || (rol ? ('Rol ' + rol) : 'Sin rol');
    },

    textoBadge() {
        const user = this.usuario() || (this.clarisaActiva() && typeof Sesion !== 'undefined' ? Sesion.usuario : '') || 'usuario';
        return `${user} (${this.etiquetaRol()})`;
    },

    aplicarUI() {
        const badge = document.getElementById('usuario-activo');
        if (badge) {
            badge.textContent = this.textoBadge();
        }

        const rolBadge = document.getElementById('rol-activo');
        if (rolBadge) {
            rolBadge.textContent = this.etiquetaRol();
        }

        const btn = document.getElementById('btn-cerrar-sesion');
        if (btn && !btn.dataset.sesionLista) {
            btn.dataset.sesionLista = '1';
            btn.addEventListener('click', () => {
                this.cerrar();
                window.location.replace(this.PAGINA_LOGIN);
            });
        }

        this.filtrarMenu();
        this.renderPanelModulos();
    },

    filtrarMenu() {
        const nav = document.querySelector('nav[aria-label="Navegación principal"]');
        if (!nav) return;

        if (this.clarisaActiva() && !this.pantherActiva()) {
            nav.querySelectorAll('a[href]').forEach((a) => {
                const archivo = (a.getAttribute('href') || '').split('/').pop();
                if (archivo && archivo !== 'factura.html' && archivo !== this.PAGINA_PANEL && !String(a.getAttribute('href')).includes('index.html')) {
                    const li = a.closest('li');
                    if (li) li.hidden = true;
                }
            });
            return;
        }

        const rol = this.rol();
        if (rol === 1) return;

        const permitidos = this.paginasPermitidas(rol);
        nav.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href') || '';
            const archivo = href.split('/').pop();
            if (!archivo || href.includes('index.html') || archivo === this.PAGINA_PANEL) return;
            if (!permitidos.includes(archivo)) {
                const li = a.closest('li');
                if (li) li.hidden = true;
            }
        });
    },

    /** Tarjetas del panel gestor según rol. */
    renderPanelModulos() {
        const grid = document.getElementById('panel-modulos-grid');
        if (!grid) return;

        const permitidos = this.paginasPermitidas(this.rol());
        const esAdmin = this.rol() === 1;
        const soloClarisa = this.clarisaActiva() && !this.pantherActiva();

        const visibles = this.MODULOS.filter((m) => {
            if (soloClarisa) return m.archivo === 'factura.html';
            if (esAdmin) return true;
            return permitidos.includes(m.archivo);
        });

        grid.innerHTML = '';
        if (!visibles.length) {
            grid.innerHTML = '<p class="panel-vacio">No hay módulos disponibles para tu rol.</p>';
            return;
        }

        visibles.forEach((m) => {
            const card = document.createElement('a');
            card.className = 'panel-card';
            card.href = m.archivo;
            card.innerHTML =
                '<h2 class="panel-card-titulo">' + m.titulo + '</h2>' +
                '<p class="panel-card-desc">' + m.descripcion + '</p>' +
                '<span class="panel-card-cta">Abrir módulo</span>';
            grid.appendChild(card);
        });
    }
};

/** Alias documentado en el plan de estandarización (Fase 5). */
const SesionNavegacion = SesionTaller;

(function iniciarSesionUI() {
    const path = window.location.pathname || '';
    if (!/\/pages\//.test(path)) return;

    if (!SesionTaller.exigirSesion()) return;
    if (!SesionTaller.exigirPaginaActual()) return;
    SesionTaller.aplicarUI();
})();
