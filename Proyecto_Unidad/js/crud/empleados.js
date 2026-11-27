// CRUD de empleados - Usando  (pantherApi)

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-empleados-body');
const contador = document.getElementById('contador-empleados');
const buscador = document.getElementById('buscar-empleado');
const formEmpleado = document.getElementById('form-empleado');
const modalTitulo = document.getElementById('modal-titulo');

const api = pantherApi;

// ---------- 1. LEER DATOS (GET) ----------
async function obtenerEmpleados() {
    try {
        const respuesta = await api.get('empleados');
        if (!respuesta.ok) throw new Error(respuesta.mensaje || 'Error al obtener datos');
        
        const cuerpo = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
        return Array.isArray(cuerpo) ? cuerpo : [];
    } catch (error) {
        console.error("Error:", error);
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
                        <button class="btn-accion btn-editar" type="button" onclick="prepararEdicion(${e.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" type="button" onclick="eliminarEmpleado(${e.id})">Eliminar</button>
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

    // Crear usuario de login (solo si es nuevo)
    if (!editando) {
        const usuarioLogin = nombres.split(' ')[0].toLowerCase(); 
        const contrasenaLogin = documento; 
        const rolLogin = parseInt(rol); 

        const payloadUsuario = { user: usuarioLogin, password: contrasenaLogin, roles: rolLogin };

        const resUser = await api.post('users', payloadUsuario);

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
    renderizarTabla(buscador.value);
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
    
    const respuesta = await api.delete('empleados', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar.', 'error');
        return;
    }
    mostrarNotificacion('Empleado eliminado correctamente.', 'success');
    renderizarTabla(buscador.value);
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

buscador.addEventListener('input', function() { renderizarTabla(this.value); });

// ---------- INICIALIZAR ----------
renderizarTabla();