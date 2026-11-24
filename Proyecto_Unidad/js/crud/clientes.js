// CRUD DE CLIENTES - Conectado a Panther (MariaDB)

// 1. Configuración de la API con el Token
const TOKEN_PANTHER = '750e8b43e5ed564462c90ef0d382db26'; 
const BASE_URL = 'http://localhost/panther/backend_panther/panther/rest/persons';

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-clientes-body');
const contador = document.getElementById('contador-clientes');
const buscador = document.getElementById('buscar-cliente');
const formCliente = document.getElementById('form-cliente');
const modalTitulo = document.getElementById('modal-titulo');

// ---------- 1. LEER DATOS (GET) ----------
async function obtenerClientes() {
    try {
        
        const response = await fetch(BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER // Enviamos el token aquí
            }
        }); 
        
        if (!response.ok) {
            const textoError = await response.text();
            throw new Error(`HTTP ${response.status}: ${textoError}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : (data.data || []);
        
    } catch (error) {
        console.error("Error al conectar con Panther:", error);
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
        const nombreCompleto = `${c.name || ''} ${c.lastName || ''}`.toLowerCase();
        const documento = (c.documento || '').toString();
        const correo = (c.correo || '').toLowerCase();
        const busqueda = filtro.toLowerCase();
        
        return nombreCompleto.includes(busqueda) || documento.includes(busqueda) || correo.includes(busqueda);
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
                        <button class="btn-accion btn-editar" onclick="prepararEdicion(${cliente.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- 3. GUARDAR (CREATE / UPDATE) ----------
formCliente.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombreCompleto = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const tipo = document.getElementById('tipo').value;

    // Validaciones
    if (!nombreCompleto || nombreCompleto.length < 3) return mostrarNotificacion('El nombre es muy corto.', 'error');
    if (!documento || !/^[0-9]{8,15}$/.test(documento)) return mostrarNotificacion('Documento inválido.', 'error');
    if (!telefono || !/^[0-9]{10,15}$/.test(telefono)) return mostrarNotificacion('Teléfono inválido.', 'error');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarNotificacion('Correo inválido.', 'error');

    const partesNombre = nombreCompleto.split(' ');
    const name = partesNombre[0];
    const lastName = partesNombre.slice(1).join(' ') || ' ';

    const payload = {
        name: name,
        lastName: lastName,
        phone: telefono,
        documento: documento,
        correo: correo,
        direccion: direccion,
        tipo: tipo
    };

    const metodo = editando ? 'PUT' : 'POST';
    const url = editando 
        ? `${BASE_URL}/${idEditando}?token=${TOKEN_PANTHER}` 
        : `${BASE_URL}?token=${TOKEN_PANTHER}`;

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json',
                        'authorization': TOKEN_PANTHER 
             },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            mostrarNotificacion(`Cliente ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
            cerrarModal('modal-cliente');
            renderizarTabla();
        } else {
            throw new Error('Error al guardar en la base de datos');
        }
    } catch (error) {
        mostrarNotificacion('Error al guardar: ' + error.message, 'error');
    }
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
    
    try {
         const response = await fetch(`${BASE_URL}/${id}`, { 
            method: 'DELETE',
            headers: {
                'authorization': TOKEN_PANTHER 
            }
        });
        
        if (response.ok) {
            mostrarNotificacion('Cliente eliminado correctamente.', 'success');
            renderizarTabla();
        } else {
            throw new Error('No se pudo eliminar');
        }
    } catch (error) {
        mostrarNotificacion('Error al eliminar.', 'error');
    }
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