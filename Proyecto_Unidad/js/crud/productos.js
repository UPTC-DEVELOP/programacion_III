// CRUD de Repuestos/Productos - Usando la arquitectura de Camilo

let editando = false;
let idEditando = null;
let listaProveedores = [];

const tablaBody = document.getElementById('tabla-productos-body');
const contador = document.getElementById('contador-productos');
const buscador = document.getElementById('buscar-producto');
const formProducto = document.getElementById('form-producto');
const modalTitulo = document.getElementById('modal-titulo-producto');
const selectProveedor = document.getElementById('id_proveedor');

const api = pantherApi;

// ---------- 0. CARGAR PROVEEDORES PARA EL SELECT Y LA TABLA ----------
async function cargarProveedores() {
    try {
        const respuesta = await api.get('proveedores');
        if (!respuesta.ok) return;

        const cuerpo = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
        listaProveedores = Array.isArray(cuerpo) ? cuerpo : [];

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

// ---------- 1. LEER DATOS (GET) ----------
async function obtenerRepuestos() {
    try {
        const respuesta = await api.get('repuestos');
        if (!respuesta.ok) throw new Error(respuesta.mensaje || 'Error en la petición al servidor');

        const cuerpo = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
        return Array.isArray(cuerpo) ? cuerpo : [];
    } catch (error) {
        console.error('Error al conectar con Panther:', error);
        mostrarNotificacion('No se pudo obtener el inventario de repuestos.', 'error');
        return [];
    }
}

// ---------- 2. RENDERIZAR TABLA ----------
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
                        <button class="btn-accion btn-editar" type="button" onclick="prepararEdicion(${r.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" type="button" onclick="eliminarRepuesto(${r.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- 3. GUARDAR (POST / PUT) ----------
formProducto.addEventListener('submit', async function (e) {
    e.preventDefault();

    const referencia = document.getElementById('referencia').value.trim().toUpperCase();
    const nombre = document.getElementById('nombre').value.trim();
    const marca = document.getElementById('marca').value.trim();
    const precio_unitario = parseFloat(document.getElementById('precio_unitario').value);
    const stock = parseInt(document.getElementById('stock').value, 10);
    const id_proveedor = parseInt(document.getElementById('id_proveedor').value, 10);

    if (!referencia || referencia.length < 2) return mostrarNotificacion('La referencia es obligatoria.', 'error');
    if (!nombre || nombre.length < 3) return mostrarNotificacion('El nombre es obligatorio.', 'error');
    if (!marca || marca.length < 2) return mostrarNotificacion('La marca es obligatoria.', 'error');
    if (isNaN(precio_unitario) || precio_unitario <= 0) return mostrarNotificacion('Precio unitario inválido.', 'error');
    if (isNaN(stock) || stock < 0) return mostrarNotificacion('El stock debe ser 0 o superior.', 'error');
    if (isNaN(id_proveedor) || !id_proveedor) return mostrarNotificacion('Selecciona un proveedor.', 'error');

    const payload = { referencia, nombre, marca, precio_unitario, stock, id_proveedor };

    const respuesta = editando 
        ? await api.put('repuestos', idEditando, payload) 
        : await api.post('repuestos', payload);

    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo guardar el repuesto.', 'error');
        return;
    }

    mostrarNotificacion(`Repuesto ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
    cerrarModal('modal-producto');
    renderizarTabla(buscador.value);
});

// ---------- 4. EDITAR ----------
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

    const respuesta = await api.delete('repuestos', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar el repuesto.', 'error');
        return;
    }
    mostrarNotificacion('Repuesto eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
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

// ---------- INICIALIZAR ----------
renderizarTabla();