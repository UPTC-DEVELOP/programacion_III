// CRUD de clientes contra Panther (recurso persons).
// Integrado desde feature/grupo5 y apuntando a panther/rest.

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-clientes-body');
const contador = document.getElementById('contador-clientes');
const buscador = document.getElementById('buscar-cliente');
const formCliente = document.getElementById('form-cliente');
const modalTitulo = document.getElementById('modal-titulo');
const api = typeof pantherApi !== 'undefined' ? pantherApi : new PantherApi();

function filasDe(respuesta) {
    if (!respuesta || respuesta.status === 204) return [];
    const cuerpo = respuesta.data && Object.prototype.hasOwnProperty.call(respuesta.data, 'data')
        ? respuesta.data.data
        : respuesta.data;
    return Array.isArray(cuerpo) ? cuerpo : [];
}

async function obtenerClientes() {
    try {
        const respuesta = await api.get('persons');
        if (!respuesta.ok && respuesta.status !== 204) {
            throw new Error(respuesta.mensaje || 'No se pudo obtener la lista de clientes.');
        }
        return filasDe(respuesta);
    } catch (error) {
        mostrarNotificacion(error.message || 'No se pudo obtener la lista de clientes.', 'error');
        return [];
    }
}

async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados">Cargando clientes...</td></tr>';
    const clientes = await obtenerClientes();
    const busqueda = filtro.toLowerCase();
    const filtrados = clientes.filter((cliente) => {
        const nombre = `${cliente.name || ''} ${cliente.lastName || ''}`.toLowerCase();
        return nombre.includes(busqueda)
            || String(cliente.documento || '').includes(busqueda)
            || String(cliente.correo || '').toLowerCase().includes(busqueda);
    });

    tablaBody.innerHTML = '';
    if (!filtrados.length) {
        tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados">No se encontraron clientes</td></tr>';
    } else {
        filtrados.forEach((cliente) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
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
                </td>`;
            tablaBody.appendChild(fila);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

formCliente.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    const nombreCompleto = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const tipo = document.getElementById('tipo').value;

    if (!nombreCompleto || nombreCompleto.length < 3) return mostrarNotificacion('El nombre es muy corto.', 'error');
    if (!documento || !/^[0-9]{6,15}$/.test(documento)) return mostrarNotificacion('Documento inválido.', 'error');
    if (!telefono || !/^[0-9]{7,15}$/.test(telefono)) return mostrarNotificacion('Teléfono inválido.', 'error');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarNotificacion('Correo inválido.', 'error');

    const partes = nombreCompleto.split(' ');
    const payload = {
        name: partes[0],
        lastName: partes.slice(1).join(' ') || ' ',
        phone: telefono,
        documento,
        correo,
        direccion,
        tipo
    };

    const respuesta = editando
        ? await api.put('persons', idEditando, payload)
        : await api.post('persons', payload);

    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'Error al guardar en la base de datos.', 'error');
        return;
    }
    mostrarNotificacion(editando ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.', 'success');
    cerrarModal('modal-cliente');
    renderizarTabla(buscador.value);
});

async function prepararEdicion(id) {
    const cliente = (await obtenerClientes()).find((item) => Number(item.id) === Number(id));
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

async function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    const respuesta = await api.delete('persons', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar el cliente.', 'error');
        return;
    }
    mostrarNotificacion('Cliente eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
}

document.getElementById('btn-nuevo-cliente').addEventListener('click', function () {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Cliente';
    formCliente.reset();
    document.getElementById('documento').disabled = false;
    abrirModal('modal-cliente');
});

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

renderizarTabla();
