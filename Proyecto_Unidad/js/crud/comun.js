// Funciones compartidas por Órdenes y Facturas.
// El diseño visual se reutiliza desde clientes.css.

const CLAVE_ORDENES = 'autotech-ordenes';
const CLAVE_FACTURAS = 'autotech-facturas';

const CATALOGO = {
    clientes: [
        { nombre: 'Carlos Rodríguez', documento: '79123456', telefono: '3201234567', direccion: 'Cra 7 # 45-10' },
        { nombre: 'María López', documento: '52987654', telefono: '3159876543', direccion: 'Cl 80 # 12-30' },
        { nombre: 'Taller El Motor S.A.S', documento: '900123456', telefono: '3001234567', direccion: 'Av 7 # 8-9' }
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

const ORDENES_SEMILLA = [
    {
        numero: 'ORD-001',
        clienteDocumento: '79123456',
        placa: 'ABC123',
        empleadoDocumento: '79123456',
        ingreso: '2026-03-12T08:30',
        horas: 4,
        repuestos: [
            { referencia: 'FR-220', descripcion: 'Pastillas de freno', marca: 'Bosch', precio: 85000 },
            { referencia: 'AC-110', descripcion: 'Filtro de aceite', marca: 'Mann', precio: 32000 }
        ]
    },
    {
        numero: 'ORD-002',
        clienteDocumento: '52987654',
        placa: 'XYZ789',
        empleadoDocumento: '11223344',
        ingreso: '2026-03-18T14:00',
        horas: 2.5,
        repuestos: [
            { referencia: 'LL-015', descripcion: 'Bujías', marca: 'NGK', precio: 48000 }
        ]
    }
];

function escapar(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatoPesos(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(Number(valor) || 0);
}

function formatoIngreso(valor) {
    if (!valor) return '—';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function nombreCliente(documento) {
    const cliente = CATALOGO.clientes.find(function (item) { return item.documento === documento; });
    return cliente ? cliente.nombre : '—';
}

function nombreEmpleado(documento) {
    const empleado = CATALOGO.empleados.find(function (item) { return item.documento === documento; });
    return empleado ? empleado.nombres + ' ' + empleado.apellidos : '—';
}

function buscarOrden(numero) {
    return obtenerOrdenes().find(function (orden) { return orden.numero === numero; });
}

function calcularFactura(orden, tarifaHora, utilidad) {
    const repuestos = (orden.repuestos || []).reduce(function (suma, repuesto) {
        return suma + (Number(repuesto.precio) || 0);
    }, 0);
    const manoObra = (Number(orden.horas) || 0) * (Number(tarifaHora) || 0);
    const utilidadN = Number(utilidad) || 0;
    const subtotal = repuestos + manoObra + utilidadN;
    const iva = Math.round(subtotal * 0.19);
    return {
        repuestos: repuestos,
        manoObra: manoObra,
        utilidad: utilidadN,
        subtotal: subtotal,
        iva: iva,
        total: subtotal + iva
    };
}

function leerLista(clave, semilla) {
    try {
        const guardado = localStorage.getItem(clave);
        if (guardado) return JSON.parse(guardado);
    } catch (error) {
        return semilla.map(function (item) { return JSON.parse(JSON.stringify(item)); });
    }
    const copia = semilla.map(function (item) { return JSON.parse(JSON.stringify(item)); });
    if (copia.length) localStorage.setItem(clave, JSON.stringify(copia));
    return copia;
}

function guardarLista(clave, lista) {
    localStorage.setItem(clave, JSON.stringify(lista));
}

function obtenerOrdenes() {
    return leerLista(CLAVE_ORDENES, ORDENES_SEMILLA);
}

function guardarOrdenes(lista) {
    guardarLista(CLAVE_ORDENES, lista);
}

function siguienteNumero(lista, prefijo) {
    const maximo = lista.reduce(function (mayor, item) {
        const numero = parseInt(String(item.numero).split('-')[1], 10);
        return Number.isFinite(numero) && numero > mayor ? numero : mayor;
    }, 0);
    return prefijo + '-' + String(maximo + 1).padStart(3, '0');
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.getElementById('notificacion-crud');
    if (!notificacion) return;

    notificacion.className = 'crud-notificacion ' + tipo;
    notificacion.textContent = mensaje;
    notificacion.scrollIntoView({ behavior: 'smooth', block: 'center' });

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
