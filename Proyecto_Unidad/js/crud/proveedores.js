// CRUD de Proveedores - Usando Panther api

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-proveedores-body');
const contador = document.getElementById('contador-proveedores');
const buscador = document.getElementById('buscar-proveedor');
const formProveedor = document.getElementById('form-proveedor');
const modalTitulo = document.getElementById('modal-titulo-proveedor');

const api = pantherApi;

// ---------- 1. LEER DATOS (GET) ----------
async function obtenerProveedores() {
    try {
        const respuesta = await api.get('proveedores');
        if (!respuesta.ok) throw new Error(respuesta.mensaje || 'Error en la petición al servidor');

        const cuerpo = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
        return Array.isArray(cuerpo) ? cuerpo : [];
    } catch (error) {
        console.error('Error al conectar con Panther:', error);
        mostrarNotificacion('No se pudo obtener la lista de proveedores.', 'error');
        return [];
    }
}

// ---------- 2. RENDERIZAR TABLA ----------
async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando proveedores...</td></tr>';

    const proveedores = await obtenerProveedores();
    tablaBody.innerHTML = '';

    const filtrados = proveedores.filter(p => {
        const q = filtro.toLowerCase();
        return (p.nit || '').toLowerCase().includes(q) ||
               (p.razon_social || '').toLowerCase().includes(q) ||
               (p.contacto || '').toLowerCase().includes(q) ||
               (p.correo || '').toLowerCase().includes(q);
    });

    if (filtrados.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados" style="text-align:center;">No se encontraron proveedores</td></tr>';
    } else {
        filtrados.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nit}</td>
                <td>${p.razon_social}</td>
                <td>${p.contacto}</td>
                <td>${p.telefono}</td>
                <td>${p.correo}</td>
                <td>${p.direccion}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" type="button" onclick="prepararEdicion(${p.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" type="button" onclick="eliminarProveedor(${p.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- 3. GUARDAR (POST / PUT) ----------
formProveedor.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nit = document.getElementById('nit').value.trim();
    const razon_social = document.getElementById('razon_social').value.trim();
    const contacto = document.getElementById('contacto').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    if (!nit || nit.length < 5) return mostrarNotificacion('El NIT es obligatorio (mínimo 5).', 'error');
    if (!razon_social || razon_social.length < 3) return mostrarNotificacion('La razón social es obligatoria.', 'error');
    if (!contacto || contacto.length < 3) return mostrarNotificacion('El nombre de contacto es obligatorio.', 'error');
    if (!telefono || !/^[0-9+\-\s]{7,15}$/.test(telefono)) return mostrarNotificacion('Teléfono inválido.', 'error');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarNotificacion('Correo inválido.', 'error');
    if (!direccion || direccion.length < 5) return mostrarNotificacion('La dirección es obligatoria.', 'error');

    const payload = { nit, razon_social, contacto, telefono, correo, direccion };

    const respuesta = editando 
        ? await api.put('proveedores', idEditando, payload) 
        : await api.post('proveedores', payload);

    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo guardar el proveedor.', 'error');
        return;
    }

    mostrarNotificacion(`Proveedor ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
    cerrarModal('modal-proveedor');
    renderizarTabla(buscador.value);
});

// ---------- 4. EDITAR ----------
async function prepararEdicion(id) {
    const proveedores = await obtenerProveedores();
    const p = proveedores.find(item => item.id == id);
    if (!p) return;

    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Proveedor';

    document.getElementById('nit').value = p.nit;
    document.getElementById('nit').disabled = true;
    document.getElementById('razon_social').value = p.razon_social;
    document.getElementById('contacto').value = p.contacto;
    document.getElementById('telefono').value = p.telefono;
    document.getElementById('correo').value = p.correo;
    document.getElementById('direccion').value = p.direccion;

    abrirModal('modal-proveedor');
}

// ---------- 5. ELIMINAR ----------
async function eliminarProveedor(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;

    const respuesta = await api.delete('proveedores', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar (verifica que no tenga repuestos asociados).', 'error');
        return;
    }
    mostrarNotificacion('Proveedor eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
}

// ---------- EVENTOS DE UI ----------
document.getElementById('btn-nuevo-proveedor').addEventListener('click', function () {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Proveedor';
    formProveedor.reset();
    document.getElementById('nit').disabled = false;
    abrirModal('modal-proveedor');
});

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

// ---------- INICIALIZAR ----------
renderizarTabla();