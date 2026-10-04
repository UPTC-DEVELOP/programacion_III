// Datos iniciales de prueba
const datosIniciales = [
  { id: 1, nombre: 'Daniela Osorio', cedula: '1056777098', email: 'daniela.osorio@gmail.com', telefono: '3137826573', empresa: 'Quest', estado: 'Activo' },
  { id: 2, nombre: 'María Fernanda Gómez López', cedula: '1007654321', email: 'maria@tallerpro.com', telefono: '310 987 6543', empresa: 'Logística S.A.', estado: 'Activo' },
  { id: 3, nombre: 'Paula García', cedula: '1012345678', email: 'paula@tallerpro.com', telefono: '320 555 1234', empresa: 'Independiente', estado: 'Inactivo' }
];

// Cargar desde localStorage o usar iniciales
let clientes = JSON.parse(localStorage.getItem('tallerpro_clientes')) || datosIniciales;

let modalCliente;

document.addEventListener('DOMContentLoaded', () => {
  modalCliente = new bootstrap.Modal(document.getElementById('clientModal'));
  guardarEnLocalStorage();
  renderizarTabla(clientes);

  document.getElementById('clientForm').addEventListener('submit', guardarCliente);
});

// Guardar en localStorage
function guardarEnLocalStorage() {
  localStorage.setItem('tallerpro_clientes', JSON.stringify(clientes));
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
      <td>${cliente.nombre}</td>
      <td>${cliente.cedula}</td>
      <td>${cliente.email}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.empresa || '-'}</td>
      <td>
        <span class="badge ${cliente.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-3 py-1">
          ${cliente.estado}
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
  document.getElementById('companyInput').value = cliente.empresa;
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

// Guardar cliente
function guardarCliente(e) {
  e.preventDefault();
  const form = document.getElementById('clientForm');

  const id = document.getElementById('clientId').value;
  const nombre = document.getElementById('nameInput').value.trim();
  const cedula = document.getElementById('cedulaInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const telefono = document.getElementById('phoneInput').value.trim();
  const empresa = document.getElementById('companyInput').value.trim();
  const estado = document.getElementById('statusSelect').value;

  form.classList.add('was-validated');

  if (!validarCampos(nombre, cedula, email, telefono)) {
    Swal.fire({
      icon: 'error',
      title: 'Datos Incompletos',
      text: 'Por favor completa correctamente los campos requeridos.'
    });
    return;
  }

  if (id) {
    const index = clientes.findIndex(c => c.id == id);
    if (index !== -1) {
      clientes[index] = { id: Number(id), nombre, cedula, email, telefono, empresa, estado };
    }
    Swal.fire({
      icon: 'success',
      title: '¡Actualizado!',
      text: 'El cliente ha sido modificado con éxito.',
      timer: 1500,
      showConfirmButton: false
    });
  } else {
    const nuevoId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) + 1 : 1;
    clientes.push({ id: nuevoId, nombre, cedula, email, telefono, empresa, estado });
    Swal.fire({
      icon: 'success',
      title: '¡Registrado!',
      text: 'Cliente guardado correctamente.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  guardarEnLocalStorage();
  modalCliente.hide();
  renderizarTabla(clientes);
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
  }).then((result) => {
    if (result.isConfirmed) {
      clientes = clientes.filter(c => c.id !== id);
      guardarEnLocalStorage();
      renderizarTabla(clientes);
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El cliente ha sido eliminado.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}