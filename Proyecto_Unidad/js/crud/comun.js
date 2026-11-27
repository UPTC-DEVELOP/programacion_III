// Utilidades CRUD compartidas

const PAGINA_LOGIN = '../login.html';

function sesionTallerActiva() {
    if (typeof SesionTaller !== 'undefined' && SesionTaller.activa()) return true;
    if (typeof Sesion !== 'undefined' && Sesion.activa()) return true;
    return Boolean(
        sessionStorage.getItem('pantherKeyAPI')
        || sessionStorage.getItem('pantherToken')
        || sessionStorage.getItem('userName')
    );
}

if (typeof SesionTaller === 'undefined' && !sesionTallerActiva()) {
    window.location.replace(PAGINA_LOGIN);
}

function etiquetaRolSesion() {
    if (typeof SesionTaller !== 'undefined' && SesionTaller.etiquetaRol) {
        return SesionTaller.etiquetaRol();
    }
    const mapa = {
        1: 'Administrador',
        3: 'Cajero / Recepcionista',
        4: 'Mecánico',
        5: 'Almacenista'
    };
    const rol = parseInt(sessionStorage.getItem('userRole'), 10);
    return mapa[rol] || '';
}

// Badge y cierre
function iniciarControlSesion() {
    if (typeof SesionTaller !== 'undefined') return;

    const usuarioActivo = document.getElementById('usuario-activo');
    if (usuarioActivo) {
        const nombre = (typeof Sesion !== 'undefined' && Sesion.usuario)
            || sessionStorage.getItem('userName')
            || 'DEMO_API';
        const rolTxt = etiquetaRolSesion();
        usuarioActivo.textContent = rolTxt ? (nombre + ' (' + rolTxt + ')') : nombre;
    }

    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar && !btnCerrar.dataset.sesionLista) {
        btnCerrar.dataset.sesionLista = '1';
        btnCerrar.addEventListener('click', function () {
            if (typeof Sesion !== 'undefined' && typeof Sesion.cerrar === 'function') {
                Sesion.cerrar();
            }
            if (typeof PantherApi !== 'undefined' && typeof PantherApi.clearKeyAPI === 'function') {
                PantherApi.clearKeyAPI();
            }
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('pantherToken');
            sessionStorage.removeItem('pantherKeyAPI');
            window.location.replace(PAGINA_LOGIN);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarControlSesion);
} else {
    iniciarControlSesion();
}

const IVA_ORDEN = 0.19;
const VALOR_HORA_DEFAULT = 35000;

const CATALOGO = {
    clientes: [
        { nombre: 'Carlos Rodríguez', documento: '79123456', telefono: '3201234567', direccion: 'Cra 7 # 45-10', email: 'carlos.rodriguez@email.com' },
        { nombre: 'María López', documento: '52987654', telefono: '3159876543', direccion: 'Cl 80 # 12-30', email: 'maria.lopez@email.com' },
        { nombre: 'Taller El Motor S.A.S', documento: '900123456', telefono: '3001234567', direccion: 'Av 7 # 8-9', email: 'contacto@elmotor.com' }
    ],
    vehiculos: [
        { placa: 'ABC123', marca: 'Toyota', modelo: 'Corolla', color: 'Gris', propietario: 'Carlos Rodríguez' },
        { placa: 'XYZ789', marca: 'Mazda', modelo: '3', color: 'Rojo', propietario: 'María López' },
        { placa: 'DEF456', marca: 'Chevrolet', modelo: 'Spark', color: 'Azul', propietario: 'Taller El Motor S.A.S' }
    ],
    empleados: [
        { nombres: 'Juan', apellidos: 'Pérez', documento: '79123456', rol: 'Mecánico' },
        { nombres: 'Ana', apellidos: 'Martínez', documento: '52987654', rol: 'Recepcionista' },
        { nombres: 'Carlos', apellidos: 'Gómez', documento: '11223344', rol: 'Administrador' }
    ]
};

function escapar(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatoIngreso(valor) {
    if (!valor) return '—';
    const normalizado = String(valor).includes('T') ? valor : String(valor).replace(' ', 'T');
    const fecha = new Date(normalizado);
    if (Number.isNaN(fecha.getTime())) return valor;
    return fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function formatoPesos(valor) {
    const numero = Number(valor) || 0;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(numero);
}

function aDatetimeLocal(valor) {
    if (!valor) return '';
    const texto = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(texto)) {
        return texto.slice(0, 16);
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(texto)) {
        return texto.replace(' ', 'T').slice(0, 16);
    }
    const fecha = new Date(texto);
    if (Number.isNaN(fecha.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

function aDatetimeMysql(valor) {
    if (!valor) return '';
    const local = aDatetimeLocal(valor);
    if (!local) return valor;
    return `${local.replace('T', ' ')}:00`.slice(0, 19);
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.getElementById('notificacion-crud');
    if (!notificacion) return;

    notificacion.className = 'crud-notificacion ' + tipo;
    notificacion.textContent = mensaje;

    setTimeout(function () {
        notificacion.className = 'crud-notificacion';
        notificacion.textContent = '';
    }, 4000);
}

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('click', function (evento) {
    if (evento.target.classList.contains('crud-modal')) {
        evento.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Escape') return;
    document.querySelectorAll('.crud-modal.active').forEach(function (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
});
