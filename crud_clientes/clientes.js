// CRUD de clientes conectado a Panther (recurso "clientes")
const RECURSO = 'clientes';

let clientes = [];
let modalCliente;

document.addEventListener('DOMContentLoaded', () => {
  if (!Panther.exigirSesion()) return;

  modalCliente = new bootstrap.Modal(document.getElementById('clientModal'));
  document.getElementById('clientForm').addEventListener('submit', guardarCliente);
  cargarClientes();
});

// Evita que lo que escribe el usuario se interprete como HTML
function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mostrarError(error) {
  Swal.fire({ icon: 'error', title: 'Error', text: error.message });
}

// Traer clientes del servidor
async function cargarClientes() {
  try {
    clientes = await Panther.listar(RECURSO);
    renderizarTabla(clientes);
  } catch (error) {
    mostrarError(error);
  }
}

// Renderizar tabla
function renderizarTabla(lista) {
  const tbody = document.getElementById('clientTableBody');
  const emptyState = document.getElementById('emptyState');

  tbody.innerHTML = '';

  if (lista.length === 0) {
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');

  lista.forEach(cliente => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold">${cliente.id}</td>
      <td>${esc(cliente.nombre)}</td>
      <td>${esc(cliente.cedula)}</td>
      <td>${esc(cliente.email)}</td>
      <td>${esc(cliente.telefono)}</td>
      <td>${esc(cliente.empresa) || '-'}</td>
      <td>
        <span class="badge ${cliente.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-3 py-1">
          ${esc(cliente.estado)}
        </span>
      </td>
      <td class="text-end pe-3">
        <button class="btn-action-edit me-1" onclick="abrirModalEditar(${cliente.id})" title="Editar">
          <i class="bi bi-pencil-fill"></i>
        </button>
        <button class="btn-action-delete" onclick="eliminarCliente(${cliente.id})" title="Eliminar">
          <i class="bi bi-trash-fill"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Abrir modal crear
function abrirModalCrear() {
  const form = document.getElementById('clientForm');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('clientId').value = '';
  document.getElementById('modalTitle').textContent = 'Registrar cliente';
  modalCliente.show();
}

// Abrir modal editar
function abrirModalEditar(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const form = document.getElementById('clientForm');
  form.classList.remove('was-validated');

  document.getElementById('clientId').value = cliente.id;
  document.getElementById('nameInput').value = cliente.nombre;
  document.getElementById('cedulaInput').value = cliente.cedula;
  document.getElementById('emailInput').value = cliente.email;
  document.getElementById('phoneInput').value = cliente.telefono;
  document.getElementById('companyInput').value = cliente.empresa || '';
  document.getElementById('statusSelect').value = cliente.estado;

  document.getElementById('modalTitle').textContent = 'Editar cliente';
  modalCliente.show();
}

// Validaciones
function validarCampos(nombre, cedula, email, telefono) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nombre || nombre.length < 3) return false;
  if (!cedula || cedula.length < 6) return false;
  if (!emailRegex.test(email)) return false;
  if (!telefono || telefono.length < 7) return false;

  return true;
}

// Guardar cliente (crear o actualizar en el servidor)
async function guardarCliente(e) {
  e.preventDefault();
  const form = document.getElementById('clientForm');

  const id = document.getElementById('clientId').value;
  const datos = {
    nombre: document.getElementById('nameInput').value.trim(),
    cedula: document.getElementById('cedulaInput').value.trim(),
    email: document.getElementById('emailInput').value.trim(),
    telefono: document.getElementById('phoneInput').value.trim(),
    empresa: document.getElementById('companyInput').value.trim(),
    estado: document.getElementById('statusSelect').value
  };

  form.classList.add('was-validated');

  if (!validarCampos(datos.nombre, datos.cedula, datos.email, datos.telefono)) {
    Swal.fire({
      icon: 'error',
      title: 'Datos Incompletos',
      text: 'Por favor completa correctamente los campos requeridos.'
    });
    return;
  }

  try {
    if (id) {
      await Panther.actualizar(RECURSO, id, datos);
    } else {
      await Panther.crear(RECURSO, datos);
    }
  } catch (error) {
    mostrarError(error);
    return;
  }

  Swal.fire({
    icon: 'success',
    title: id ? '¡Actualizado!' : '¡Registrado!',
    text: id ? 'El cliente ha sido modificado con éxito.' : 'Cliente guardado correctamente.',
    timer: 1500,
    showConfirmButton: false
  });

  modalCliente.hide();
  cargarClientes();
}

// Eliminar cliente
function eliminarCliente(id) {
  Swal.fire({
    title: '¿Eliminar cliente?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (!result.isConfirmed) return;
    try {
      await Panther.eliminar(RECURSO, id);
    } catch (error) {
      mostrarError(error);
      return;
    }
    await cargarClientes();
    Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: 'El cliente ha sido eliminado.',
      timer: 1500,
      showConfirmButton: false
    });
  });
}
