// Estado de la aplicación
let clients = [];
let clientModal = null;

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  clientModal = new bootstrap.Modal(document.getElementById('clientModal'));
  cargarClientes();
  
  // Listener del formulario
  document.getElementById('clientForm').addEventListener('submit', guardarCliente);
});

// Cargar datos iniciales (localStorage o datos de prueba)
function cargarClientes() {
  const stored = localStorage.getItem('crud_clients');
  if (stored) {
    clients = JSON.parse(stored);
  } else {
    // Datos de demostración
    clients = [
      { id: Date.now() + 1, name: 'Ana García', edad:'50', email: 'ana@ejemplo.com', phone: '+34 600 111 222', company: 'Tech Solutions', status: 'Activo' },
      { id: Date.now() + 2, name: 'Carlos López',edad:'50', email: 'carlos@ejemplo.com', phone: '+34 611 222 333', company: 'Innovate SRL', status: 'Inactivo' }
    ];
    guardarEnLocalStorage();
  }
  renderizarTabla(clients);
}

// Guardar en localStorage
function guardarEnLocalStorage() {
  localStorage.setItem('crud_clients', JSON.stringify(clients));
}

// Renderizar filas de la tabla
function renderizarTabla(data) {
  const tbody = document.getElementById('clientTableBody');
  const emptyState = document.getElementById('emptyState');
  const totalCount = document.getElementById('totalCount');
  
  tbody.innerHTML = '';
  totalCount.textContent = data.length;

  if (data.length === 0) {
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');

  data.forEach(client => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-muted">#${client.id.toString().slice(-4)}</td>
      <td class="fw-semibold">${escapeHTML(client.name)}</td>
      <td class="fw-semibold">${escapeHTML(client.edad)}</td>
      <td>
        <div><i class="bi bi-envelope me-1 text-muted"></i>${escapeHTML(client.email)}</div>
        <small class="text-muted"><i class="bi bi-telephone me-1"></i>${escapeHTML(client.phone)}</small>
      </td>
      <td>${escapeHTML(client.company || '-')}</td>
      <td>
        <span class="badge ${client.status === 'Activo' ? 'bg-success' : 'bg-danger'}">
          ${client.status}
        </span>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1 btn-action" onclick="abrirModalEditar(${client.id})">
          <i class="bi bi-pencil-fill"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-action" onclick="eliminarCliente(${client.id})">
          <i class="bi bi-trash-fill"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Abrir modal para nuevo cliente
function abrirModalCrear() {
  document.getElementById('modalTitle').textContent = 'Nuevo Cliente';
  document.getElementById('clientForm').reset();
  document.getElementById('clientId').value = '';
  clientModal.show();
}

// Abrir modal para editar cliente existente
function abrirModalEditar(id) {
  const client = clients.find(c => c.id === id);
  if (!client) return;

  document.getElementById('modalTitle').textContent = 'Editar Cliente';
  document.getElementById('clientId').value = client.id;
  document.getElementById('nameInput').value = client.name;
  document.getElementById('edadInput').value = client.edad;
  document.getElementById('emailInput').value = client.email;
  document.getElementById('phoneInput').value = client.phone;
  document.getElementById('companyInput').value = client.company || '';
  document.getElementById('statusSelect').value = client.status;

  clientModal.show();
}

// Guardar cliente (Crear o Actualizar)
function guardarCliente(e) {
  e.preventDefault();

  const id = document.getElementById('clientId').value;
  const name = document.getElementById('nameInput').value.trim();
  const edad = document.getElementById('edadInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const company = document.getElementById('companyInput').value.trim();
  const status = document.getElementById('statusSelect').value;

  if (id) {
    // Modo Edición
    const index = clients.findIndex(c => c.id == id);
    if (index !== -1) {
      clients[index] = { id: Number(id), name, edad, email, phone, company, status };
      Swal.fire({ icon: 'success', title: 'Cliente actualizado', timer: 1500, showConfirmButton: false });
    }
  } else {
    // Modo Creación
    const newClient = {
      id: Date.now(),
      name,
      edad,
      email,
      phone,
      company,
      status
    };
    clients.push(newClient);
    Swal.fire({ icon: 'success', title: 'Cliente creado', timer: 1500, showConfirmButton: false });
  }

  guardarEnLocalStorage();
  filtrarClientes(); // Re-renderiza aplicando cualquier filtro activo
  clientModal.hide();
}

// Eliminar cliente
function eliminarCliente(id) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      clients = clients.filter(c => c.id !== id);
      guardarEnLocalStorage();
      filtrarClientes();
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
    }
  });
}

// Filtrar en tiempo real por búsqueda
function filtrarClientes() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(query) ||
    c.edad.toLowerCase().includes(query) ||
    c.email.toLowerCase().includes(query) ||
    c.company.toLowerCase().includes(query)
  );
  renderizarTabla(filtered);
}

// Helper para prevenir XSS
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}