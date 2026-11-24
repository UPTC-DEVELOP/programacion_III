// CRUD DE EMPLEADOS - Conectado a Panther (MariaDB)

const TOKEN_PANTHER = '750e8b43e5ed564462c90ef0d382db26'; 
const BASE_URL = 'http://localhost/panther/backend_panther/panther/rest/empleados';

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-empleados-body');
const contador = document.getElementById('contador-empleados');
const buscador = document.getElementById('buscar-empleado');
const formEmpleado = document.getElementById('form-empleado');
const modalTitulo = document.getElementById('modal-titulo');

// ---------- 1. LEER DATOS (GET) ----------
async function obtenerEmpleados() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER 
            }
        });

        if (!response.ok) throw new Error('Error al obtener datos');
        
        const data = await response.json();
        // Verificamos que no sea un error de Panther
        if (data.state && data.state !== 'OK' && data.state !== 'GET') {
            return [];
        }
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error("Error al conectar con Panther:", error);
        mostrarNotificacion('No se pudo obtener la lista de empleados.', 'error');
        return [];
    }
}

// ---------- 2. RENDERIZAR TABLA ----------
async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando empleados...</td></tr>';
    
    const empleados = await obtenerEmpleados();
    tablaBody.innerHTML = '';

    const filtrados = empleados.filter(e => {
        const nombreCompleto = `${e.nombres || ''} ${e.apellidos || ''}`.toLowerCase();
        const busqueda = filtro.toLowerCase();
        return nombreCompleto.includes(busqueda) || 
               (e.documento || '').toString().includes(busqueda) ||
               (e.rol || '').toLowerCase().includes(busqueda);
    });

    if (filtrados.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="6" class="sin-resultados" style="text-align:center;">No se encontraron empleados</td></tr>`;
    } else {
        filtrados.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${e.nombres} ${e.apellidos}</td>
                <td>${e.documento}</td>
                <td>${e.rol}</td>
                <td>${e.telefono}</td>
                <td>${e.correo}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="prepararEdicion(${e.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarEmpleado(${e.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- 3. GUARDAR (POST / PUT) ----------
formEmpleado.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const rol = document.getElementById('rol').value;
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();

    // Validaciones
    if (!nombres || nombres.length < 3) return mostrarNotificacion('Nombres inválidos.', 'error');
    if (!apellidos || apellidos.length < 3) return mostrarNotificacion('Apellidos inválidos.', 'error');
    if (!documento || !/^[0-9]{10,15}$/.test(documento)) return mostrarNotificacion('Documento inválido.', 'error');
    if (!rol) return mostrarNotificacion('Selecciona un rol.', 'error');
    if (!telefono || !/^[0-9]{10,15}$/.test(telefono)) return mostrarNotificacion('Teléfono inválido.', 'error');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarNotificacion('Correo inválido.', 'error');

    const payload = { nombres, apellidos, documento, rol, telefono, correo };
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
            mostrarNotificacion(`Empleado ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
            cerrarModal('modal-empleado');
            renderizarTabla();
        } else {
            throw new Error('Error al guardar');
        }
    } catch (error) {
        mostrarNotificacion('Error al guardar: ' + error.message, 'error');
    }
});

// ---------- 4. EDITAR ----------
async function prepararEdicion(id) {
    const empleados = await obtenerEmpleados();
    const emp = empleados.find(e => e.id == id);
    if (!emp) return;

    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Empleado';

    document.getElementById('nombres').value = emp.nombres;
    document.getElementById('apellidos').value = emp.apellidos;
    document.getElementById('documento').value = emp.documento;
    document.getElementById('documento').disabled = true; 
    document.getElementById('rol').value = emp.rol;
    document.getElementById('telefono').value = emp.telefono;
    document.getElementById('correo').value = emp.correo;

    abrirModal('modal-empleado');
}

// ---------- 5. ELIMINAR ----------
async function eliminarEmpleado(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
    
    try {
        const response = await fetch(`${BASE_URL}/${id}`, { 
            method: 'DELETE',
            headers: { 'authorization': TOKEN_PANTHER }
        });
        
        if (response.ok) {
            mostrarNotificacion('Empleado eliminado correctamente.', 'success');
            renderizarTabla();
        } else {
            throw new Error('No se pudo eliminar');
        }
    } catch (error) {
        mostrarNotificacion('Error al eliminar.', 'error');
    }
}

// ---------- EVENTOS DE LA UI ----------
document.getElementById('btn-nuevo-empleado').addEventListener('click', function() {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Empleado';
    formEmpleado.reset();
    document.getElementById('documento').disabled = false;
    abrirModal('modal-empleado');
});

buscador.addEventListener('input', function() {
    renderizarTabla(this.value);
});

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('crud-modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function(e) {
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
    
    
    
    notificacion.className = 'crud-notificacion';
    void notificacion.offsetWidth; 
    
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