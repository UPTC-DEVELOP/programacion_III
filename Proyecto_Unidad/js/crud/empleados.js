// CRUD DE EMPLEADOS - Conectado a Panther (MariaDB) + Creación de Usuario para Login

const TOKEN_PANTHER = '750e8b43e5ed564462c90ef0d382db26'; 
const BASE_URL = 'http://localhost/panther/backend_panther/panther/rest/empleados';
const URL_USUARIOS = 'http://localhost/panther/backend_panther/panther/rest/users';

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
               (e.rol || '').toString().includes(busqueda);
    });

    if (filtrados.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="6" class="sin-resultados" style="text-align:center;">No se encontraron empleados</td></tr>`;
    } else {
        filtrados.forEach(e => {
            // Mapeamos el ID del rol a su nombre para mostrarlo bonito en la tabla
            let nombreRol = e.rol;
            if(e.rol == 1) nombreRol = 'Administrador';
            if(e.rol == 3) nombreRol = 'Recepcionista';
            if(e.rol == 4) nombreRol = 'Mecánico';
            if(e.rol == 5) nombreRol = 'Almacenista';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${e.nombres} ${e.apellidos}</td>
                <td>${e.documento}</td>
                <td>${nombreRol}</td>
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

// ---------- 3. GUARDAR (POST / PUT) + CREAR USUARIO DE LOGIN ----------
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
    if (!documento || !/^[0-9]{8,15}$/.test(documento)) return mostrarNotificacion('Documento inválido (8 a 15 dígitos).', 'error');
    if (!rol) return mostrarNotificacion('Selecciona un rol.', 'error');
    if (!telefono || !/^[0-9]{10,15}$/.test(telefono)) return mostrarNotificacion('Teléfono inválido.', 'error');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarNotificacion('Correo inválido.', 'error');

    const payloadEmpleado = { nombres, apellidos, documento, rol, telefono, correo };
    const metodo = editando ? 'PUT' : 'POST';
    const url = editando ? `${BASE_URL}/${idEditando}` : BASE_URL;

    try {
        // 1. GUARDAR EMPLEADO EN LA TABLA LOCAL
        const response = await fetch(url, {
            method: metodo,
            headers: { 
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER 
            },
            body: JSON.stringify(payloadEmpleado)
        });

        if (!response.ok) {
            throw new Error('Error al guardar el empleado en el sistema.');
        }

        // 2. CREAR USUARIO DE LOGIN 
        if (!editando) {
            const usuarioLogin = nombres.split(' ')[0].toLowerCase(); // Primer nombre en minúscula
            const contrasenaLogin = documento; // El documento es la contraseña
            const rolLogin = parseInt(rol); // Aseguramos que sea número

            const payloadUsuario = {
                user: usuarioLogin,
                password: contrasenaLogin,
                roles: rolLogin
            };

            const resUser = await fetch(URL_USUARIOS, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'authorization': TOKEN_PANTHER 
                },
                body: JSON.stringify(payloadUsuario)
            });

            if (!resUser.ok) {
                console.warn("El empleado se guardó, pero el usuario de login falló o ya existía.");
                mostrarNotificacion('Empleado guardado. Nota: El usuario de login ya existía.', 'warning');
            } else {
                mostrarNotificacion(`Empleado y usuario de acceso (${usuarioLogin}) creados correctamente.`, 'success');
            }
        } else {
            mostrarNotificacion('Empleado actualizado correctamente.', 'success');
        }

        cerrarModal('modal-empleado');
        renderizarTabla();

    } catch (error) {
        mostrarNotificacion('Error: ' + error.message, 'error');
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
    
    notificacion.className = 'crud-notificacion ' + tipo;
    notificacion.textContent = mensaje;
    
    // Quitamos el scroll para que se vea como un Toast flotante (como acordamos)
    setTimeout(() => {
        notificacion.className = 'crud-notificacion';
        notificacion.textContent = '';
    }, 4000);
}

// ---------- INICIALIZAR ----------
renderizarTabla();