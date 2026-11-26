const TOKEN_PANTHER = '750e8b43e5ed564462c90ef0d382db26';
const BASE_URL = 'http://localhost/panther/backend_panther/panther/rest/repuestos';
const PROVEEDORES_URL = 'http://localhost/panther/backend_panther/panther/rest/proveedores';

let editando = false;
let idEditando = null;
let listaProveedores = [];

const tablaBody = document.getElementById('tabla-productos-body');
const contador = document.getElementById('contador-productos');
const buscador = document.getElementById('buscar-producto');
const formProducto = document.getElementById('form-producto');
const modalTitulo = document.getElementById('modal-titulo-producto');
const selectProveedor = document.getElementById('id_proveedor');

// ---------- 0. CARGAR PROVEEDORES PARA EL SELECT Y LA TABLA ----------
async function cargarProveedores() {
    try {
        const response = await fetch(PROVEEDORES_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER
            }
        });

        if (!response.ok) return;
        const data = await response.json();
        listaProveedores = Array.isArray(data) ? data : (data.data || []);

        selectProveedor.innerHTML = '<option value="">-- Seleccione un proveedor --</option>';
        listaProveedores.forEach(prov => {
            const option = document.createElement('option');
            option.value = prov.id;
            option.textContent = `${prov.razon_social} (${prov.nit})`;
            selectProveedor.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

function nombreProveedorPorId(id) {
    const prov = listaProveedores.find(p => p.id == id);
    return prov ? prov.razon_social : `Proveedor #${id}`;
}

function formatearCOP(valor) {
    return '$ ' + Number(valor).toLocaleString('es-CO') + ' COP';
}

async function obtenerRepuestos() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER
            }
        });

        if (!response.ok) throw new Error('Error en la petición al servidor');

        const data = await response.json();

        if (data.state && data.state !== 'OK') {
            console.error('Error de Panther:', data.data);
            return [];
        }

        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error('Error al conectar con Panther:', error);
        mostrarNotificacion('No se pudo obtener el inventario de repuestos.', 'error');
        return [];
    }
}

async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando repuestos...</td></tr>';

    if (listaProveedores.length === 0) {
        await cargarProveedores();
    }

    const repuestos = await obtenerRepuestos();
    tablaBody.innerHTML = '';

    const filtrados = repuestos.filter(r => {
        const q = filtro.toLowerCase();
        const nomProv = nombreProveedorPorId(r.id_proveedor).toLowerCase();
        return (r.referencia || '').toLowerCase().includes(q) ||
               (r.nombre || '').toLowerCase().includes(q) ||
               (r.marca || '').toLowerCase().includes(q) ||
               nomProv.includes(q);
    });

    if (filtrados.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados" style="text-align:center;">No se encontraron repuestos</td></tr>';
    } else {
        filtrados.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${r.referencia}</strong></td>
                <td>${r.nombre}</td>
                <td>${r.marca}</td>
                <td>${formatearCOP(r.precio_unitario)}</td>
                <td>${r.stock} und.</td>
                <td>${nombreProveedorPorId(r.id_proveedor)}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="prepararEdicion(${r.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarRepuesto(${r.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

formProducto.addEventListener('submit', async function (e) {
    e.preventDefault();

    const referencia = document.getElementById('referencia').value.trim().toUpperCase();
    const nombre = document.getElementById('nombre').value.trim();
    const marca = document.getElementById('marca').value.trim();
    const precio_unitario = parseFloat(document.getElementById('precio_unitario').value);
    const stock = parseInt(document.getElementById('stock').value, 10);
    const id_proveedor = parseInt(document.getElementById('id_proveedor').value, 10);

    // Validaciones de campos obligatorios
    if (!referencia || referencia.length < 2) return mostrarNotificacion('La referencia del repuesto es obligatoria.', 'error');
    if (!nombre || nombre.length < 3) return mostrarNotificacion('El nombre del repuesto es obligatorio.', 'error');
    if (!marca || marca.length < 2) return mostrarNotificacion('La marca es obligatoria.', 'error');
    if (isNaN(precio_unitario) || precio_unitario <= 0) return mostrarNotificacion('Ingresa un precio unitario mayor a 0.', 'error');
    if (isNaN(stock) || stock < 0) return mostrarNotificacion('El stock debe ser 0 o superior.', 'error');
    if (isNaN(id_proveedor) || !id_proveedor) return mostrarNotificacion('Debes seleccionar un proveedor de la lista.', 'error');

    const payload = { referencia, nombre, marca, precio_unitario, stock, id_proveedor };
    const metodo = editando ? 'PUT' : 'POST';
    const url = editando ? `${BASE_URL}/${idEditando}` : BASE_URL;

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            mostrarNotificacion(`Repuesto ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
            cerrarModal('modal-producto');
            renderizarTabla(buscador.value);
        } else {
            throw new Error('No se pudo guardar el repuesto en Panther');
        }
    } catch (error) {
        mostrarNotificacion('Error al guardar: ' + error.message, 'error');
    }
});

async function prepararEdicion(id) {
    await cargarProveedores();
    const repuestos = await obtenerRepuestos();
    const r = repuestos.find(item => item.id == id);
    if (!r) return;

    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Repuesto';

    document.getElementById('referencia').value = r.referencia;
    document.getElementById('referencia').disabled = true;
    document.getElementById('nombre').value = r.nombre;
    document.getElementById('marca').value = r.marca;
    document.getElementById('precio_unitario').value = r.precio_unitario;
    document.getElementById('stock').value = r.stock;
    document.getElementById('id_proveedor').value = r.id_proveedor;

    abrirModal('modal-producto');
}

// ---------- 5. ELIMINAR ----------
async function eliminarRepuesto(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este repuesto?')) return;

    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'authorization': TOKEN_PANTHER }
        });

        if (response.ok) {
            mostrarNotificacion('Repuesto eliminado correctamente.', 'success');
            renderizarTabla(buscador.value);
        } else {
            throw new Error('No se pudo eliminar el repuesto');
        }
    } catch (error) {
        mostrarNotificacion('Error al eliminar: ' + error.message, 'error');
    }
}

// ---------- EVENTOS DE UI ----------
document.getElementById('btn-nuevo-producto').addEventListener('click', async function () {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Repuesto';
    formProducto.reset();
    document.getElementById('referencia').disabled = false;
    await cargarProveedores();
    abrirModal('modal-producto');
});

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('crud-modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.crud-modal.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.getElementById('notificacion-crud');
    if (!notificacion) return;

    notificacion.className = 'crud-notificacion ' + tipo;
    notificacion.textContent = mensaje;
    notificacion.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
        notificacion.className = 'crud-notificacion';
        notificacion.textContent = '';
    }, 4000);
}

// ---------- INICIALIZAR ----------
renderizarTabla();