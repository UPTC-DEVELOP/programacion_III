
// CRUD DE EMPLEADOS 


// ---------- DATOS DE PRUEBA ----------
let empleados = [
    { 
        nombres: 'Juan', 
        apellidos: 'Pérez', 
        documento: '79123456', 
        rol: 'Mecánico', 
        telefono: '3201234567', 
        correo: 'juan@autotech.com' 
    },
    { 
        nombres: 'Ana', 
        apellidos: 'Martínez', 
        documento: '52987654', 
        rol: 'Recepcionista', 
        telefono: '3159876543', 
        correo: 'ana@autotech.com' 
    },
    { 
        nombres: 'Carlos', 
        apellidos: 'Gómez', 
        documento: '11223344', 
        rol: 'Administrador', 
        telefono: '3001234567', 
        correo: 'carlos@autotech.com' 
    }
];

// ---------- VARIABLES DE ESTADO ----------
let editando = false;
let documentoEditando = null;

// ---------- REFERENCIAS AL DOM ----------
const tablaBody = document.getElementById('tabla-empleados-body');
const contador = document.getElementById('contador-empleados');
const buscador = document.getElementById('buscar-empleado');
const formEmpleado = document.getElementById('form-empleado');
const modalTitulo = document.getElementById('modal-titulo');

// ---------- RENDERIZAR TABLA (Read) ----------
function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '';
    
    const filtrados = empleados.filter(e => 
        e.nombres.toLowerCase().includes(filtro.toLowerCase()) ||
        e.apellidos.toLowerCase().includes(filtro.toLowerCase()) ||
        e.documento.includes(filtro) ||
        e.rol.toLowerCase().includes(filtro.toLowerCase()) ||
        e.correo.toLowerCase().includes(filtro.toLowerCase())
    );

    if (filtrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" class="sin-resultados">No se encontraron empleados</td>`;
        tablaBody.appendChild(tr);
    } else {
        filtrados.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${emp.nombres} ${emp.apellidos}</td>
                <td>${emp.documento}</td>
                <td>${emp.rol}</td>
                <td>${emp.telefono}</td>
                <td>${emp.correo}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="editarEmpleado('${emp.documento}')">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarEmpleado('${emp.documento}')">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- MOSTRAR NOTIFICACIÓN ----------
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

// ---------- ABRIR MODAL ----------
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// ---------- CERRAR MODAL ----------
function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ---------- ABRIR MODAL NUEVO (Create) ----------
document.getElementById('btn-nuevo-empleado').addEventListener('click', function() {
    editando = false;
    documentoEditando = null;
    modalTitulo.textContent = 'Nuevo Empleado';
    formEmpleado.reset();
    document.getElementById('documento').disabled = false;
    
    formEmpleado.querySelectorAll('input').forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
    
    abrirModal('modal-empleado');
});

// ---------- EDITAR EMPLEADO (Update) ----------
function editarEmpleado(documento) {
    const emp = empleados.find(e => e.documento === documento);
    if (!emp) return;

    editando = true;
    documentoEditando = documento;
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

// ---------- GUARDAR (Create / Update) ----------
formEmpleado.addEventListener('submit', function(e) {
    e.preventDefault();

    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const rol = document.getElementById('rol').value;
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();

    if (!nombres || nombres.length < 3) {
        mostrarNotificacion(' El nombre debe tener al menos 3 caracteres.', 'error');
        return;
    }

    if (!apellidos || apellidos.length < 3) {
        mostrarNotificacion(' El apellido debe tener al menos 3 caracteres.', 'error');
        return;
    }

    if (!documento || !/^[0-9]{10,15}$/.test(documento)) {
        mostrarNotificacion(' El documento debe tener entre 10 y 15 dígitos.', 'error');
        return;
    }

    if (!rol) {
        mostrarNotificacion(' Debes seleccionar un rol.', 'error');
        return;
    }

    if (!telefono || !/^[0-9]{10,15}$/.test(telefono)) {
        mostrarNotificacion(' El teléfono debe tener entre 10 y 15 dígitos.', 'error');
        return;
    }

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mostrarNotificacion(' Ingresa un correo electrónico válido.', 'error');
        return;
    }

    if (editando) {
        const index = empleados.findIndex(e => e.documento === documentoEditando);
        if (index !== -1) {
            empleados[index] = { nombres, apellidos, documento: documentoEditando, rol, telefono, correo };
            mostrarNotificacion(' Empleado actualizado correctamente.', 'success');
        }
    } else {
        if (empleados.some(e => e.documento === documento)) {
            mostrarNotificacion(' Ya existe un empleado con ese documento.', 'error');
            return;
        }
        empleados.push({ nombres, apellidos, documento, rol, telefono, correo });
        mostrarNotificacion(' Empleado registrado correctamente.', 'success');
    }

    cerrarModal('modal-empleado');
    renderizarTabla();
});

// ---------- ELIMINAR EMPLEADO (Delete) ----------
function eliminarEmpleado(documento) {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
    
    empleados = empleados.filter(e => e.documento !== documento);
    mostrarNotificacion(' Empleado eliminado correctamente.', 'success');
    renderizarTabla();
}

// ---------- BUSCADOR ----------
buscador.addEventListener('input', function() {
    renderizarTabla(this.value);
});

// ---------- CERRAR MODAL AL HACER CLIC FUERA ----------
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('crud-modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ---------- CERRAR MODAL CON ESC ----------
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modalesAbiertos = document.querySelectorAll('.crud-modal.active');
        modalesAbiertos.forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

// ---------- VALIDACIONES EN TIEMPO REAL ----------
document.getElementById('documento').addEventListener('input', function() {
    const regex = /^[0-9]{10,15}$/;
    if (this.value.length > 0) {
        if (!regex.test(this.value)) {
            this.classList.add('is-invalid');
            this.classList.remove('is-valid');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    }
});

document.getElementById('telefono').addEventListener('input', function() {
    const regex = /^[0-9]{10,15}$/;
    if (this.value.length > 0) {
        if (!regex.test(this.value)) {
            this.classList.add('is-invalid');
            this.classList.remove('is-valid');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    }
});

document.getElementById('correo').addEventListener('input', function() {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.value.length > 0) {
        if (!regex.test(this.value)) {
            this.classList.add('is-invalid');
            this.classList.remove('is-valid');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    }
});

// ---------- INICIALIZAR ----------
renderizarTabla();