// CRUD de clientes - Usando la arquitectura de Camilo (pantherApi)

let editando = false;
let idEditando = null;

// Referencias al DOM
const tablaBody = document.getElementById('tabla-clientes-body');
const contador = document.getElementById('contador-clientes');
const buscador = document.getElementById('buscar-cliente');
const formCliente = document.getElementById('form-cliente');
const modalTitulo = document.getElementById('modal-titulo');

// Usamos la instancia global que creó Camilo en panther.js
const api = pantherApi;

// ---------- 1. LEER DATOS (GET) ----------
async function obtenerClientes() {
    try {
        const respuesta = await api.get('persons');
        if (!respuesta.ok) throw new Error(respuesta.mensaje || 'Error al obtener datos');
        
        // Panther devuelve la data en respuesta.data.data o en respuesta.data
        const cuerpo = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
        return Array.isArray(cuerpo) ? cuerpo : [];
    } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion('No se pudo obtener la lista de clientes.', 'error');
        return [];
    }
}

// ---------- 2. RENDERIZAR TABLA ----------
async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando clientes...</td></tr>';
    const clientes = await obtenerClientes();
    tablaBody.innerHTML = '';

    const filtrados = clientes.filter(c => {
        const nombre = `${c.name || ''} ${c.lastName || ''}`.toLowerCase();
        const busqueda = filtro.toLowerCase();
        return nombre.includes(busqueda) || (c.documento || '').toString().includes(busqueda);
    });

    if (filtrados.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="7" class="sin-resultados" style="text-align:center;">No se encontraron clientes</td></tr>`;
    } else {
        filtrados.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.name || ''} ${cliente.lastName || ''}</td>
                <td>${cliente.documento || '—'}</td>
                <td>${cliente.phone || '—'}</td>
                <td>${cliente.correo || '—'}</td>
                <td>${cliente.direccion || '—'}</td>
                <td>${cliente.tipo || '—'}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" type="button" onclick="prepararEdicion(${cliente.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" type="button" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- 3. GUARDAR (POST / PUT) ----------
formCliente.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombreCompleto = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const tipo = document.getElementById('tipo').value;

    // Validaciones básicas
    if (!nombreCompleto || nombreCompleto.length < 3) return mostrarNotificacion('El nombre es muy corto.', 'error');
    if (!documento) return mostrarNotificacion('Documento inválido.', 'error');

    // Separar nombre y apellido para Panther
    const partes = nombreCompleto.split(' ');
    const payload = {
        name: partes[0],
        lastName: partes.slice(1).join(' ') || ' ',
        phone: telefono,
        documento: documento,
        correo: correo,
        direccion: direccion,
        tipo: tipo
    };

    // Usamos la API de Camilo (él ya inyecta el token y la URL)
    const respuesta = editando 
        ? await api.put('persons', idEditando, payload) 
        : await api.post('persons', payload);

    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'Error al guardar.', 'error');
        return;
    }

    mostrarNotificacion(`Cliente ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
    cerrarModal('modal-cliente');
    renderizarTabla(buscador.value);
});

// ---------- 4. EDITAR ----------
async function prepararEdicion(id) {
    const clientes = await obtenerClientes();
    const cliente = clientes.find(c => c.id == id);
    if (!cliente) return;

    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Cliente';

    document.getElementById('nombre').value = `${cliente.name || ''} ${cliente.lastName || ''}`.trim();
    document.getElementById('documento').value = cliente.documento || '';
    document.getElementById('documento').disabled = true;
    document.getElementById('telefono').value = cliente.phone || '';
    document.getElementById('correo').value = cliente.correo || '';
    document.getElementById('direccion').value = cliente.direccion || '';
    document.getElementById('tipo').value = cliente.tipo || 'Particular';

    abrirModal('modal-cliente');
}

// ---------- 5. ELIMINAR ----------
async function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    
    const respuesta = await api.delete('persons', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar.', 'error');
        return;
    }
    mostrarNotificacion('Cliente eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
}

// ---------- EVENTOS DE LA UI ----------
document.getElementById('btn-nuevo-cliente').addEventListener('click', function() {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Cliente';
    formCliente.reset();
    document.getElementById('documento').disabled = false;
    abrirModal('modal-cliente');
});

buscador.addEventListener('input', function() { renderizarTabla(this.value); });

// Las funciones abrirModal, cerrarModal y mostrarNotificacion ya vienen de comun.js
// (Camilo las puso ahí para no repetirlas en cada archivo).

// ---------- INICIALIZAR ----------
renderizarTabla();