// CRUD de empleados contra Panther + creación de usuario de login (j4user).

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-empleados-body');
const contador = document.getElementById('contador-empleados');
const buscador = document.getElementById('buscar-empleado');
const formEmpleado = document.getElementById('form-empleado');
const modalTitulo = document.getElementById('modal-titulo');
const api = typeof pantherApi !== 'undefined' ? pantherApi : new PantherApi();

const NOMBRES_ROL = {
    1: 'Administrador',
    3: 'Recepcionista',
    4: 'Mecánico',
    5: 'Almacenista'
};

function filasDe(respuesta) {
    if (!respuesta || respuesta.status === 204) return [];
    const cuerpo = respuesta.data && Object.prototype.hasOwnProperty.call(respuesta.data, 'data')
        ? respuesta.data.data
        : respuesta.data;
    return Array.isArray(cuerpo) ? cuerpo : [];
}

async function obtenerEmpleados() {
    try {
        const respuesta = await api.get('empleados');
        if (!respuesta.ok && respuesta.status !== 204) {
            throw new Error(respuesta.mensaje || 'No se pudo obtener la lista de empleados.');
        }
        return filasDe(respuesta);
    } catch (error) {
        mostrarNotificacion(error.message || 'No se pudo obtener la lista de empleados.', 'error');
        return [];
    }
}

async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="6" class="sin-resultados">Cargando empleados...</td></tr>';
    const empleados = await obtenerEmpleados();
    const busqueda = (filtro || '').toLowerCase();
    const filtrados = empleados.filter((empleado) => {
        const nombre = `${empleado.nombres || ''} ${empleado.apellidos || ''}`.toLowerCase();
        const rol = String(NOMBRES_ROL[empleado.rol] || empleado.rol || '').toLowerCase();
        return nombre.includes(busqueda)
            || String(empleado.documento || '').includes(busqueda)
            || rol.includes(busqueda);
    });

    tablaBody.innerHTML = '';
    if (!filtrados.length) {
        tablaBody.innerHTML = '<tr><td colspan="6" class="sin-resultados">No se encontraron empleados</td></tr>';
    } else {
        filtrados.forEach((empleado) => {
            const nombreRol = NOMBRES_ROL[empleado.rol] || empleado.rol || '—';
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${empleado.nombres || ''} ${empleado.apellidos || ''}</td>
                <td>${empleado.documento || '—'}</td>
                <td>${nombreRol}</td>
                <td>${empleado.telefono || '—'}</td>
                <td>${empleado.correo || '—'}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" type="button" onclick="prepararEdicion(${empleado.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" type="button" onclick="eliminarEmpleado(${empleado.id})">Eliminar</button>
                    </div>
                </td>`;
            tablaBody.appendChild(fila);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

formEmpleado.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const rol = document.getElementById('rol').value;
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();

    if (!nombres || nombres.length < 3) return mostrarNotificacion('Nombres inválidos.', 'error');
    if (!apellidos || apellidos.length < 3) return mostrarNotificacion('Apellidos inválidos.', 'error');
    if (!documento || !/^[0-9]{8,15}$/.test(documento)) return mostrarNotificacion('Documento inválido (8 a 15 dígitos).', 'error');
    if (!rol) return mostrarNotificacion('Selecciona un rol.', 'error');
    if (!telefono || !/^[0-9]{10,15}$/.test(telefono)) return mostrarNotificacion('Teléfono inválido.', 'error');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarNotificacion('Correo inválido.', 'error');

    const payloadEmpleado = { nombres, apellidos, documento, rol, telefono, correo };
    const respuesta = editando
        ? await api.put('empleados', idEditando, payloadEmpleado)
        : await api.post('empleados', payloadEmpleado);

    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'Error al guardar el empleado.', 'error');
        return;
    }

    if (!editando) {
        const usuarioLogin = nombres.split(' ')[0].toLowerCase();
        const resUser = await api.post('users', {
            user: usuarioLogin,
            password: documento,
            roles: parseInt(rol, 10)
        });
        if (!resUser.ok) {
            mostrarNotificacion('Empleado guardado. Nota: el usuario de login ya existía o falló.', 'warning');
        } else {
            mostrarNotificacion(`Empleado y usuario de acceso (${usuarioLogin}) creados correctamente.`, 'success');
        }
    } else {
        mostrarNotificacion('Empleado actualizado correctamente.', 'success');
    }

    cerrarModal('modal-empleado');
    renderizarTabla(buscador.value);
});

async function prepararEdicion(id) {
    const empleado = (await obtenerEmpleados()).find((item) => Number(item.id) === Number(id));
    if (!empleado) return;
    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Empleado';
    document.getElementById('nombres').value = empleado.nombres || '';
    document.getElementById('apellidos').value = empleado.apellidos || '';
    document.getElementById('documento').value = empleado.documento || '';
    document.getElementById('documento').disabled = true;
    document.getElementById('rol').value = String(empleado.rol || '');
    document.getElementById('telefono').value = empleado.telefono || '';
    document.getElementById('correo').value = empleado.correo || '';
    abrirModal('modal-empleado');
}

async function eliminarEmpleado(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
    const respuesta = await api.delete('empleados', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar el empleado.', 'error');
        return;
    }
    mostrarNotificacion('Empleado eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
}

document.getElementById('btn-nuevo-empleado').addEventListener('click', function () {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Empleado';
    formEmpleado.reset();
    document.getElementById('documento').disabled = false;
    abrirModal('modal-empleado');
});

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

renderizarTabla();
