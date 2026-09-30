const CLAVE = 'autogestion_empleados';

let empleados = JSON.parse(localStorage.getItem(CLAVE)) || [];
let editandoId = null;

const form = document.getElementById('formEmpleado');
const tabla = document.getElementById('tablaEmpleados');
const buscador = document.getElementById('buscador');
const mensaje = document.getElementById('mensaje');
const tituloForm = document.getElementById('tituloForm');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');

const campos = {
    documento: document.getElementById('documento'),
    nombre: document.getElementById('nombre'),
    cargo: document.getElementById('cargo'),
    telefono: document.getElementById('telefono'),
    correo: document.getElementById('correo'),
    fechaIngreso: document.getElementById('fechaIngreso'),
    estado: document.getElementById('estado')
};

/* ---------- Utilidades ---------- */
function guardarEnStorage() {
    localStorage.setItem(CLAVE, JSON.stringify(empleados));
}

function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function mostrarMensaje(texto, esError = false) {
    mensaje.textContent = texto;
    mensaje.classList.toggle('error', esError);
    setTimeout(() => { mensaje.textContent = ''; }, 3000);
}

/* ---------- Mostrar (READ) ---------- */
function renderizar() {
    const filtro = buscador.value.trim().toLowerCase();

    const lista = empleados.filter(e =>
        e.nombre.toLowerCase().includes(filtro) ||
        e.documento.toLowerCase().includes(filtro) ||
        e.cargo.toLowerCase().includes(filtro)
    );

    if (lista.length === 0) {
        tabla.innerHTML = '<tr><td colspan="9" class="tabla-vacia">No hay empleados registrados.</td></tr>';
        return;
    }

    tabla.innerHTML = lista.map((e, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapar(e.documento)}</td>
            <td>${escapar(e.nombre)}</td>
            <td>${escapar(e.cargo)}</td>
            <td>${escapar(e.telefono)}</td>
            <td>${escapar(e.correo)}</td>
            <td>${escapar(e.fechaIngreso)}</td>
            <td><span class="estado ${e.estado.toLowerCase()}">${escapar(e.estado)}</span></td>
            <td>
                <div class="acciones">
                    <button class="btn-editar" onclick="editarEmpleado(${e.id})">EDITAR</button>
                    <button class="btn-eliminar" onclick="eliminarEmpleado(${e.id})">ELIMINAR</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* ---------- Crear y actualizar (CREATE / UPDATE) ---------- */
form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const datos = {
        documento: campos.documento.value.trim(),
        nombre: campos.nombre.value.trim(),
        cargo: campos.cargo.value,
        telefono: campos.telefono.value.trim(),
        correo: campos.correo.value.trim(),
        fechaIngreso: campos.fechaIngreso.value,
        estado: campos.estado.value
    };

    // Evitar documentos repetidos
    const repetido = empleados.some(e => e.documento === datos.documento && e.id !== editandoId);
    if (repetido) {
        mostrarMensaje('Ya existe un empleado con ese documento.', true);
        return;
    }

    if (editandoId === null) {
        empleados.push({ id: Date.now(), ...datos });
        mostrarMensaje('Empleado registrado correctamente.');
    } else {
        const indice = empleados.findIndex(e => e.id === editandoId);
        empleados[indice] = { id: editandoId, ...datos };
        mostrarMensaje('Empleado actualizado correctamente.');
        salirModoEdicion();
    }

    guardarEnStorage();
    form.reset();
    renderizar();
});

/* ---------- Editar ---------- */
function editarEmpleado(id) {
    const e = empleados.find(emp => emp.id === id);
    if (!e) return;

    editandoId = id;
    campos.documento.value = e.documento;
    campos.nombre.value = e.nombre;
    campos.cargo.value = e.cargo;
    campos.telefono.value = e.telefono;
    campos.correo.value = e.correo;
    campos.fechaIngreso.value = e.fechaIngreso;
    campos.estado.value = e.estado;

    tituloForm.textContent = 'EDITAR EMPLEADO';
    btnGuardar.textContent = 'ACTUALIZAR EMPLEADO';
    btnCancelar.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function salirModoEdicion() {
    editandoId = null;
    tituloForm.textContent = 'NUEVO EMPLEADO';
    btnGuardar.textContent = 'GUARDAR EMPLEADO';
    btnCancelar.classList.add('oculto');
}

btnCancelar.addEventListener('click', function () {
    form.reset();
    salirModoEdicion();
});

/* ---------- Eliminar (DELETE) ---------- */
function eliminarEmpleado(id) {
    const e = empleados.find(emp => emp.id === id);
    if (!e) return;

    if (confirm('¿Eliminar a ' + e.nombre + '?')) {
        empleados = empleados.filter(emp => emp.id !== id);
        guardarEnStorage();

        if (editandoId === id) {
            form.reset();
            salirModoEdicion();
        }
        renderizar();
    }
}

/* ---------- Buscador ---------- */
buscador.addEventListener('input', renderizar);

/* Al cargar la página */
renderizar();