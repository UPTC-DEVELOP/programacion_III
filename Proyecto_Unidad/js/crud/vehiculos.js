
// CRUD DE VEHÍCULOS 


// ---------- DATOS DE PRUEBA ----------
let vehiculos = [
    { 
        placa: 'ABC123', 
        marca: 'Toyota', 
        modelo: 'Corolla', 
        anio: '2022', 
        color: 'Gris', 
        propietario: 'Carlos Rodríguez' 
    },
    { 
        placa: 'XYZ789', 
        marca: 'Mazda', 
        modelo: '3', 
        anio: '2020', 
        color: 'Rojo', 
        propietario: 'María López' 
    },
    { 
        placa: 'DEF456', 
        marca: 'Chevrolet', 
        modelo: 'Spark', 
        anio: '2023', 
        color: 'Azul', 
        propietario: 'Taller El Motor S.A.S' 
    }
];

// ---------- VARIABLES DE ESTADO ----------
let editando = false;
let placaEditando = null;

// ---------- REFERENCIAS AL DOM ----------
const tablaBody = document.getElementById('tabla-vehiculos-body');
const contador = document.getElementById('contador-vehiculos');
const buscador = document.getElementById('buscar-vehiculo');
const formVehiculo = document.getElementById('form-vehiculo');
const modalTitulo = document.getElementById('modal-titulo');

// ---------- RENDERIZAR TABLA (Read) ----------
function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '';
    
    const filtrados = vehiculos.filter(v => 
        v.placa.toLowerCase().includes(filtro.toLowerCase()) ||
        v.marca.toLowerCase().includes(filtro.toLowerCase()) ||
        v.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
        v.propietario.toLowerCase().includes(filtro.toLowerCase())
    );

    if (filtrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" class="sin-resultados">No se encontraron vehículos</td>`;
        tablaBody.appendChild(tr);
    } else {
        filtrados.forEach(vehiculo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${vehiculo.placa}</td>
                <td>${vehiculo.marca}</td>
                <td>${vehiculo.modelo}</td>
                <td>${vehiculo.anio}</td>
                <td>${vehiculo.color}</td>
                <td>${vehiculo.propietario}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="editarVehiculo('${vehiculo.placa}')">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarVehiculo('${vehiculo.placa}')">Eliminar</button>
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
document.getElementById('btn-nuevo-vehiculo').addEventListener('click', function() {
    editando = false;
    placaEditando = null;
    modalTitulo.textContent = 'Nuevo Vehículo';
    formVehiculo.reset();
    document.getElementById('placa').disabled = false;
    
    formVehiculo.querySelectorAll('input').forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
    
    abrirModal('modal-vehiculo');
});

// ---------- EDITAR VEHÍCULO (Update) ----------
function editarVehiculo(placa) {
    const vehiculo = vehiculos.find(v => v.placa === placa);
    if (!vehiculo) return;

    editando = true;
    placaEditando = placa;
    modalTitulo.textContent = 'Editar Vehículo';

    document.getElementById('placa').value = vehiculo.placa;
    document.getElementById('placa').disabled = true;
    document.getElementById('marca').value = vehiculo.marca;
    document.getElementById('modelo').value = vehiculo.modelo;
    document.getElementById('anio').value = vehiculo.anio;
    document.getElementById('color').value = vehiculo.color;
    document.getElementById('propietario').value = vehiculo.propietario;

    abrirModal('modal-vehiculo');
}

// ---------- GUARDAR (Create / Update) ----------
formVehiculo.addEventListener('submit', function(e) {
    e.preventDefault();

    const placa = document.getElementById('placa').value.trim().toUpperCase();
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const anio = document.getElementById('anio').value.trim();
    const color = document.getElementById('color').value.trim();
    const propietario = document.getElementById('propietario').value.trim();

    if (!placa || !/^[A-Z]{3}[0-9]{3}$/.test(placa)) {
        mostrarNotificacion(' La placa debe tener formato ABC123 (3 letras + 3 números).', 'error');
        return;
    }

    if (!marca || marca.length < 2) {
        mostrarNotificacion(' La marca debe tener al menos 2 caracteres.', 'error');
        return;
    }

    if (!modelo) {
        mostrarNotificacion(' El modelo es obligatorio.', 'error');
        return;
    }

    if (!anio || !/^[0-9]{4}$/.test(anio)) {
        mostrarNotificacion(' El año debe tener 4 dígitos.', 'error');
        return;
    }

    if (!color || color.length < 3) {
        mostrarNotificacion(' El color debe tener al menos 3 caracteres.', 'error');
        return;
    }

    if (!propietario) {
        mostrarNotificacion(' El propietario es obligatorio.', 'error');
        return;
    }

    if (editando) {
        const index = vehiculos.findIndex(v => v.placa === placaEditando);
        if (index !== -1) {
            vehiculos[index] = { placa: placaEditando, marca, modelo, anio, color, propietario };
            mostrarNotificacion(' Vehículo actualizado correctamente.', 'success');
        }
    } else {
        if (vehiculos.some(v => v.placa === placa)) {
            mostrarNotificacion(' Ya existe un vehículo con esa placa.', 'error');
            return;
        }
        vehiculos.push({ placa, marca, modelo, anio, color, propietario });
        mostrarNotificacion(' Vehículo registrado correctamente.', 'success');
    }

    cerrarModal('modal-vehiculo');
    renderizarTabla();
});

// ---------- ELIMINAR VEHÍCULO (Delete) ----------
function eliminarVehiculo(placa) {
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;
    
    vehiculos = vehiculos.filter(v => v.placa !== placa);
    mostrarNotificacion(' Vehículo eliminado correctamente.', 'success');
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

// ---------- VALIDACIÓN DE PLACA EN TIEMPO REAL ----------
document.getElementById('placa').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
    const regex = /^[A-Z]{3}[0-9]{3}$/;
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