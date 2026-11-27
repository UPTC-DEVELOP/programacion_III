// Sesion y navegacion AutoTech

const SesionTaller = {
    CLAVE_API: 'pantherKeyAPI',
    CLAVE_USER: 'userName',
    CLAVE_ROL: 'userRole',
    PAGINA_LOGIN: '../login.html',
    PAGINA_PANEL: 'panel-principal.html',

    // Configuracion de roles
    MENUS: {
        1: ['clientes.html', 'vehiculos.html', 'empleados.html', 'proveedores.html', 'productos.html', 'ordenes.html', 'factura.html'],
        3: ['clientes.html', 'ordenes.html', 'factura.html'],
        4: ['vehiculos.html', 'ordenes.html'],
        5: ['productos.html', 'proveedores.html', 'ordenes.html']
    },

    NAV_ADMIN: [
        'panel-principal.html',
        'vehiculos.html',
        'empleados.html',
        'proveedores.html',
        'productos.html',
        'ordenes.html',
        'factura.html'
    ],

    TITULOS_NAV: {
        'panel-principal.html': 'Módulos',
        'clientes.html': 'Clientes',
        'vehiculos.html': 'Vehículos',
        'empleados.html': 'Empleados',
        'proveedores.html': 'Proveedores',
        'productos.html': 'Productos',
        'ordenes.html': 'Órdenes',
        'factura.html': 'Facturas'
    },

    MODULOS: [
        { archivo: 'clientes.html', titulo: 'Clientes', descripcion: 'Registro y consulta de clientes del taller.' },
        { archivo: 'vehiculos.html', titulo: 'Vehículos', descripcion: 'Flota y vehículos asociados a clientes.' },
        { archivo: 'empleados.html', titulo: 'Empleados', descripcion: 'Personal del taller y roles de acceso.' },
        { archivo: 'proveedores.html', titulo: 'Proveedores', descripcion: 'Proveedores de repuestos y partes.' },
        { archivo: 'productos.html', titulo: 'Productos', descripcion: 'Inventario de repuestos y stock.' },
        { archivo: 'ordenes.html', titulo: 'Órdenes', descripcion: 'Órdenes de servicio y mano de obra.' },
        { archivo: 'factura.html', titulo: 'Facturación', descripcion: 'Emisión y seguimiento de facturas.' }
    ],

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

    // Cerrar sesion
    cerrar() {
        sessionStorage.removeItem(this.CLAVE_API);
        sessionStorage.removeItem(this.CLAVE_USER);
        sessionStorage.removeItem(this.CLAVE_ROL);
        sessionStorage.removeItem('pantherToken');
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

    // Bloqueo por rol
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
        return user + ' (' + this.etiquetaRol() + ')';
    },

    pestaniasParaRol() {
        if (this.clarisaActiva() && !this.pantherActiva()) {
            return [this.PAGINA_PANEL, 'factura.html'];
        }

        const rol = this.rol();
        if (rol === 1) {
            return this.NAV_ADMIN.slice();
        }

        const permitidos = this.paginasPermitidas(rol);
        const orden = this.MODULOS.map(function (m) { return m.archivo; });
        const tabs = [this.PAGINA_PANEL];

        orden.forEach(function (archivo) {
            if (permitidos.indexOf(archivo) !== -1) {
                tabs.push(archivo);
            }
        });

        return tabs;
    },

    // Renderizar barra navegacion
    renderBarraNavegacion() {
        const nav = document.querySelector('nav[aria-label="Navegación principal"] ul');
        if (!nav) return;

        const actual = (window.location.pathname || '').split('/').pop() || '';
        const items = this.pestaniasParaRol();

        nav.innerHTML = '';
        items.forEach((archivo) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = archivo;
            a.textContent = this.TITULOS_NAV[archivo] || archivo;
            if (archivo === actual) {
                a.className = 'active';
            }
            li.appendChild(a);
            nav.appendChild(li);
        });

        const logoLink = document.querySelector('.header-logo a');
        if (logoLink) {
            logoLink.setAttribute('href', this.PAGINA_PANEL);
        }
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

        this.renderBarraNavegacion();
        this.renderPanelModulos();
    },

    // Tarjetas del panel
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

const SesionNavegacion = SesionTaller;

(function iniciarSesionUI() {
    const path = window.location.pathname || '';
    if (!/\/pages\//.test(path)) return;

    if (!SesionTaller.exigirSesion()) return;
    if (!SesionTaller.exigirPaginaActual()) return;
    SesionTaller.aplicarUI();
})();
