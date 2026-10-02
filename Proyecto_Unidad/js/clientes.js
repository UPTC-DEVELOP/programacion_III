
// CRUD DE CLIENTES 


// ---------- DATOS DE PRUEBA ----------
let clientes = [
    { 
        nombre: 'Carlos Rodríguez', 
        documento: '79123456', 
        telefono: '3201234567', 
        correo: 'carlos@mail.com', 
        direccion: 'Cra 7 # 45-10', 
        tipo: 'Particular' 
    },
    { 
        nombre: 'María López', 
        documento: '52987654', 
        telefono: '3159876543', 
        correo: 'maria@mail.com', 
        direccion: 'Cl 80 # 12-30', 
        tipo: 'Particular' 
    },
    { 
        nombre: 'Taller El Motor S.A.S', 
        documento: '900123456', 
        telefono: '3001234567', 
        correo: 'contacto@elmotor.com', 
        direccion: 'Av 7 # 8-9', 
        tipo: 'Empresa' 
    }
];

// ---------- VARIABLES DE ESTADO ----------
let editando = false;
let documentoEditando = null;

// ---------- REFERENCIAS AL DOM ----------
const tablaBody = document.getElementById('tabla-clientes-body');
const contador = document.getElementById('contador-clientes');
const buscador = document.getElementById('buscar-cliente');
const formCliente = document.getElementById('form-cliente');
const modalTitulo = document.getElementById('modal-titulo');

// ---------- RENDERIZAR TABLA (Read) ----------
function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '';
    
    const filtrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        c.documento.includes(filtro) ||
        c.correo.toLowerCase().includes(filtro.toLowerCase()) ||
        c.telefono.includes(filtro)
    );

    if (filtrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" style="text-align: center; padding: 40px; color: #6C757D;">No se encontraron clientes</td>`;
        tablaBody.appendChild(tr);
    } else {
        filtrados.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.documento}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.correo}</td>
                <td>${cliente.direccion || '—'}</td>
                <td>${cliente.tipo}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="editarCliente('${cliente.documento}')">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarCliente('${cliente.documento}')">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    contador.textContent = filtrados.length + ' registro(s)';
}

// ---------- ABRIR MODAL NUEVO (Create) ----------
document.getElementById('btn-nuevo-cliente').addEventListener('click', function() {
    editando = false;
    documentoEditando = null;
    modalTitulo.textContent = 'Nuevo Cliente';
    formCliente.reset();
    document.getElementById('documento').disabled = false;
    
    formCliente.querySelectorAll('input').forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
    
    abrirModal('modal-cliente');
});

// ---------- EDITAR CLIENTE (Update) ----------
function editarCliente(documento) {
    const cliente = clientes.find(c => c.documento === documento);
    if (!cliente) return;

    editando = true;
    documentoEditando = documento;
    modalTitulo.textContent = 'Editar Cliente';

    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('documento').value = cliente.documento;
    document.getElementById('documento').disabled = true;
    document.getElementById('telefono').value = cliente.telefono;
    document.getElementById('correo').value = cliente.correo;
    document.getElementById('direccion').value = cliente.direccion || '';
    document.getElementById('tipo').value = cliente.tipo;

    abrirModal('modal-cliente');
}

// ---------- GUARDAR (Create / Update) ----------
formCliente.addEventListener('submit', function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const tipo = document.getElementById('tipo').value;

    if (!nombre || nombre.length < 3) {
        mostrarNotificacion(' El nombre debe tener al menos 3 caracteres.', 'error');
        return;
    }

    if (!documento || !/^[0-9]{8,15}$/.test(documento)) {
        mostrarNotificacion(' El documento debe tener entre 8 y 15 dígitos.', 'error');
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
        const index = clientes.findIndex(c => c.documento === documentoEditando);
        if (index !== -1) {
            clientes[index] = { nombre, documento: documentoEditando, telefono, correo, direccion, tipo };
            mostrarNotificacion(' Cliente actualizado correctamente.', 'success');
        }
    } else {
        if (clientes.some(c => c.documento === documento)) {
            mostrarNotificacion(' Ya existe un cliente con ese documento.', 'error');
            return;
        }
        clientes.push({ nombre, documento, telefono, correo, direccion, tipo });
        mostrarNotificacion(' Cliente registrado correctamente.', 'success');
    }

    cerrarModal('modal-cliente');
    renderizarTabla();
});

// ---------- ELIMINAR CLIENTE (Delete) ----------
function eliminarCliente(documento) {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    
    clientes = clientes.filter(c => c.documento !== documento);
    mostrarNotificacion(' Cliente eliminado correctamente.', 'success');
    renderizarTabla();
}

// ---------- BUSCADOR ----------
buscador.addEventListener('input', function() {
    renderizarTabla(this.value);
});

// ---------- VALIDACIONES EN TIEMPO REAL ----------
document.getElementById('documento').addEventListener('input', function() {
    const regex = /^[0-9]{8,15}$/;
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