// CRUD de vehículos contra Panther (recurso vehiculos).

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-vehiculos-body');
const contador = document.getElementById('contador-vehiculos');
const buscador = document.getElementById('buscar-vehiculo');
const formVehiculo = document.getElementById('form-vehiculo');
const modalTitulo = document.getElementById('modal-titulo');
const api = typeof pantherApi !== 'undefined' ? pantherApi : new PantherApi();

function filasDe(respuesta) {
    if (!respuesta || respuesta.status === 204) return [];
    const cuerpo = respuesta.data && Object.prototype.hasOwnProperty.call(respuesta.data, 'data')
        ? respuesta.data.data
        : respuesta.data;
    return Array.isArray(cuerpo) ? cuerpo : [];
}

async function obtenerVehiculos() {
    try {
        const respuesta = await api.get('vehiculos');
        if (!respuesta.ok && respuesta.status !== 204) {
            throw new Error(respuesta.mensaje || 'No se pudo obtener la lista de vehículos.');
        }
        return filasDe(respuesta);
    } catch (error) {
        mostrarNotificacion(error.message || 'No se pudo obtener la lista de vehículos.', 'error');
        return [];
    }
}

async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados">Cargando vehículos...</td></tr>';
    const vehiculos = await obtenerVehiculos();
    const busqueda = (filtro || '').toLowerCase();
    const filtrados = vehiculos.filter((vehiculo) =>
        String(vehiculo.placa || '').toLowerCase().includes(busqueda)
        || String(vehiculo.marca || '').toLowerCase().includes(busqueda)
        || String(vehiculo.propietario || '').toLowerCase().includes(busqueda)
    );

    tablaBody.innerHTML = '';
    if (!filtrados.length) {
        tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados">No se encontraron vehículos</td></tr>';
    } else {
        filtrados.forEach((vehiculo) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${vehiculo.placa || '—'}</td>
                <td>${vehiculo.marca || '—'}</td>
                <td>${vehiculo.modelo || '—'}</td>
                <td>${vehiculo.anio || '—'}</td>
                <td>${vehiculo.color || '—'}</td>
                <td>${vehiculo.propietario || '—'}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" type="button" onclick="prepararEdicion(${vehiculo.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" type="button" onclick="eliminarVehiculo(${vehiculo.id})">Eliminar</button>
                    </div>
                </td>`;
            tablaBody.appendChild(fila);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

formVehiculo.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const placa = document.getElementById('placa').value.trim().toUpperCase();
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const anio = document.getElementById('anio').value.trim();
    const color = document.getElementById('color').value.trim();
    const propietario = document.getElementById('propietario').value.trim();

    if (!placa || !/^[A-Z]{3}[0-9]{3}$/.test(placa)) return mostrarNotificacion('Placa inválida (ABC123).', 'error');
    if (!marca || marca.length < 2) return mostrarNotificacion('Marca inválida.', 'error');
    if (!modelo) return mostrarNotificacion('Modelo obligatorio.', 'error');
    if (!anio || !/^[0-9]{4}$/.test(anio)) return mostrarNotificacion('Año inválido.', 'error');
    if (!color || color.length < 3) return mostrarNotificacion('Color inválido.', 'error');
    if (!propietario) return mostrarNotificacion('Propietario obligatorio.', 'error');

    const payload = { placa, marca, modelo, anio, color, propietario };
    const respuesta = editando
        ? await api.put('vehiculos', idEditando, payload)
        : await api.post('vehiculos', payload);

    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'Error al guardar en la base de datos.', 'error');
        return;
    }
    mostrarNotificacion(editando ? 'Vehículo actualizado correctamente.' : 'Vehículo registrado correctamente.', 'success');
    cerrarModal('modal-vehiculo');
    renderizarTabla(buscador.value);
});

async function prepararEdicion(id) {
    const vehiculo = (await obtenerVehiculos()).find((item) => Number(item.id) === Number(id));
    if (!vehiculo) return;
    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Vehículo';
    document.getElementById('placa').value = vehiculo.placa || '';
    document.getElementById('placa').disabled = true;
    document.getElementById('marca').value = vehiculo.marca || '';
    document.getElementById('modelo').value = vehiculo.modelo || '';
    document.getElementById('anio').value = vehiculo.anio || '';
    document.getElementById('color').value = vehiculo.color || '';
    document.getElementById('propietario').value = vehiculo.propietario || '';
    abrirModal('modal-vehiculo');
}

async function eliminarVehiculo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;
    const respuesta = await api.delete('vehiculos', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar el vehículo.', 'error');
        return;
    }
    mostrarNotificacion('Vehículo eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
}

document.getElementById('btn-nuevo-vehiculo').addEventListener('click', function () {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Vehículo';
    formVehiculo.reset();
    document.getElementById('placa').disabled = false;
    abrirModal('modal-vehiculo');
});

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

renderizarTabla();
