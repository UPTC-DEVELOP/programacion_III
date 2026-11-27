// CRUD de vehículos - Usando  (pantherApi)

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-vehiculos-body');
const contador = document.getElementById('contador-vehiculos');
const buscador = document.getElementById('buscar-vehiculo');
const formVehiculo = document.getElementById('form-vehiculo');
const modalTitulo = document.getElementById('modal-titulo');

const api = pantherApi;

// ---------- 1. LEER DATOS (GET) ----------
async function obtenerVehiculos() {
    try {
        const respuesta = await api.get('vehiculos');
        if (!respuesta.ok) throw new Error(respuesta.mensaje || 'Error al obtener datos');
        
        const cuerpo = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
        return Array.isArray(cuerpo) ? cuerpo : [];
    } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion('No se pudo obtener la lista de vehículos.', 'error');
        return [];
    }
}

// ---------- 2. RENDERIZAR TABLA ----------
async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando vehículos...</td></tr>';
    const vehiculos = await obtenerVehiculos();
    tablaBody.innerHTML = '';

    const filtrados = vehiculos.filter(v => {
        const busqueda = filtro.toLowerCase();
        return (v.placa || '').toLowerCase().includes(busqueda) || 
               (v.marca || '').toLowerCase().includes(busqueda) || 
               (v.propietario || '').toLowerCase().includes(busqueda);
    });

    if (filtrados.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="7" class="sin-resultados" style="text-align:center;">No se encontraron vehículos</td></tr>`;
    } else {
        filtrados.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.placa}</td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${v.anio}</td>
                <td>${v.color}</td>
                <td>${v.propietario}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" type="button" onclick="prepararEdicion(${v.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" type="button" onclick="eliminarVehiculo(${v.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- 3. GUARDAR (POST / PUT) ----------
formVehiculo.addEventListener('submit', async function(e) {
    e.preventDefault();

    const placa = document.getElementById('placa').value.trim().toUpperCase();
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const anio = document.getElementById('anio').value.trim();
    const color = document.getElementById('color').value.trim();
    const propietario = document.getElementById('propietario').value.trim();

    // Validaciones
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
        mostrarNotificacion(respuesta.mensaje || 'Error al guardar.', 'error');
        return;
    }

    mostrarNotificacion(`Vehículo ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
    cerrarModal('modal-vehiculo');
    renderizarTabla(buscador.value);
});

// ---------- 4. EDITAR ----------
async function prepararEdicion(id) {
    const vehiculos = await obtenerVehiculos();
    const v = vehiculos.find(item => item.id == id);
    if (!v) return;

    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Vehículo';

    document.getElementById('placa').value = v.placa;
    document.getElementById('placa').disabled = true; 
    document.getElementById('marca').value = v.marca;
    document.getElementById('modelo').value = v.modelo;
    document.getElementById('anio').value = v.anio;
    document.getElementById('color').value = v.color;
    document.getElementById('propietario').value = v.propietario;

    abrirModal('modal-vehiculo');
}

// ---------- 5. ELIMINAR ----------
async function eliminarVehiculo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;
    
    const respuesta = await api.delete('vehiculos', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar.', 'error');
        return;
    }
    mostrarNotificacion('Vehículo eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
}

// ---------- EVENTOS DE LA UI ----------
document.getElementById('btn-nuevo-vehiculo').addEventListener('click', function() {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Vehículo';
    formVehiculo.reset();
    document.getElementById('placa').disabled = false;
    abrirModal('modal-vehiculo');
});

buscador.addEventListener('input', function() { renderizarTabla(this.value); });

// ---------- INICIALIZAR ----------
renderizarTabla();