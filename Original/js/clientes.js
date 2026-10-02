// Todo vive en memoria (sin backend)

document.addEventListener('DOMContentLoaded', () => {
  renderizarTablaClientes(clientes);
  initBusquedaClientes();
  initFormularioCliente();
});

// Dato de ejemplo
let clientes = [
  { id: 'C001', nombre: 'Juan Pérez', cedula: '1000123456', telefono: '3001234567', correo: 'juan@mail.com', direccion: 'Cra 5 # 10-20', autos: 2 },
];


// Genera el siguiente ID disponible (C001, C002, C003...)
function generarSiguienteId() {
  const numero = clientes.length + 1;
  return 'C' + String(numero).padStart(3, '0');
}


// Dibuja la tabla de clientes a partir de una lista
// (se usa tanto para mostrar todos como para mostrar el resultado de una búsqueda)
function renderizarTablaClientes(lista) {
  const cuerpoTabla = document.getElementById('cuerpoTablaClientes');
  const mensajeSinResultados = document.getElementById('mensajeSinClientes');
  cuerpoTabla.innerHTML = '';

  if (lista.length === 0) {
    mensajeSinResultados.hidden = false;
    return;
  }
  mensajeSinResultados.hidden = true;

  lista.forEach(cliente => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${cliente.id}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.cedula}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.correo}</td>
      <td><span class="contador-autos">${cliente.autos}</span></td>
      <td>
        <button type="button" class="enlace-accion-cliente enlace-editar-cliente" data-id="${cliente.id}">Editar</button>
        <button type="button" class="enlace-accion-cliente enlace-eliminar-cliente" data-id="${cliente.id}">Eliminar</button>
      </td>
    `;
    cuerpoTabla.appendChild(fila);
  });

  // Vuelve a conectar los botones de cada fila recién creada
  cuerpoTabla.querySelectorAll('.enlace-editar-cliente').forEach(boton => {
    boton.addEventListener('click', () => abrirFormularioEdicion(boton.dataset.id));
  });
  cuerpoTabla.querySelectorAll('.enlace-eliminar-cliente').forEach(boton => {
    boton.addEventListener('click', () => eliminarCliente(boton.dataset.id));
  });
}


// Búsqueda por cédula, NIT o nombre, en tiempo real
function initBusquedaClientes() {
  const campoBusqueda = document.getElementById('buscarCliente');
  if (!campoBusqueda) return;

  campoBusqueda.addEventListener('input', () => {
    const texto = campoBusqueda.value.trim().toLowerCase();

    if (texto === '') {
      renderizarTablaClientes(clientes);
      return;
    }

    const resultado = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(texto) ||
      cliente.cedula.toLowerCase().includes(texto)
    );
    renderizarTablaClientes(resultado);
  });
}


// Conecta los botones que abren y cierran el formulario, y el envío del formulario
function initFormularioCliente() {
  const botonNuevoCliente = document.getElementById('botonNuevoCliente');
  const botonCancelarCliente = document.getElementById('botonCancelarCliente');
  const formulario = document.getElementById('formularioNuevoCliente');

  botonNuevoCliente.addEventListener('click', () => abrirFormularioNuevo());
  botonCancelarCliente.addEventListener('click', () => cerrarFormularioCliente());
  formulario.addEventListener('submit', guardarCliente);
}


// Abre el formulario vacío para registrar un cliente nuevo 
function abrirFormularioNuevo() {
  const formulario = document.getElementById('formularioNuevoCliente');

  formulario.reset();
  document.getElementById('clienteIdEditando').value = '';
  document.getElementById('tituloFormularioCliente').textContent = 'Nuevo cliente';

  formulario.hidden = false;
  document.getElementById('botonNuevoCliente').setAttribute('aria-expanded', 'true');
}


// Abre el formulario con los datos ya llenos, listo para editar
function abrirFormularioEdicion(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const formulario = document.getElementById('formularioNuevoCliente');

  document.getElementById('clienteIdEditando').value = cliente.id;
  document.getElementById('nombreCliente').value = cliente.nombre;
  document.getElementById('cedulaCliente').value = cliente.cedula;
  document.getElementById('telefonoCliente').value = cliente.telefono;
  document.getElementById('correoCliente').value = cliente.correo;
  document.getElementById('direccionCliente').value = cliente.direccion;
  document.getElementById('tituloFormularioCliente').textContent = 'Editar cliente';

  formulario.hidden = false;
  document.getElementById('botonNuevoCliente').setAttribute('aria-expanded', 'true');
  formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// Cierra el formulario y lo deja limpio, sin datos de una edición anterior
function cerrarFormularioCliente() {
  const formulario = document.getElementById('formularioNuevoCliente');
  formulario.reset();
  formulario.hidden = true;
  document.getElementById('botonNuevoCliente').setAttribute('aria-expanded', 'false');
  document.getElementById('estadoFormularioCliente').textContent = '';
}


// Guarda el cliente: si "clienteIdEditando" tiene un valor, lo actualiza 
// si está vacío, lo registra como cliente nuevo 
function guardarCliente(evento) {
  evento.preventDefault();

  const idEditando = document.getElementById('clienteIdEditando').value;
  const estado = document.getElementById('estadoFormularioCliente');

  const datosCliente = {
    nombre: document.getElementById('nombreCliente').value.trim(),
    cedula: document.getElementById('cedulaCliente').value.trim(),
    telefono: document.getElementById('telefonoCliente').value.trim(),
    correo: document.getElementById('correoCliente').value.trim(),
    direccion: document.getElementById('direccionCliente').value.trim(),
  };

  if (!datosCliente.nombre || !datosCliente.cedula || !datosCliente.telefono || !datosCliente.correo || !datosCliente.direccion) {
    estado.style.color = '#f08080';
    estado.textContent = 'Completa todos los campos antes de guardar.';
    return;
  }

  if (idEditando) {
    // Actualizar un cliente que ya existe 
    const cliente = clientes.find(c => c.id === idEditando);
    if (!cliente) {
      estado.style.color = '#f08080';
      estado.textContent = 'No se encontró un cliente con esa cédula para actualizar.';
      return;
    }
    Object.assign(cliente, datosCliente);
    estado.style.color = 'var(--accent-2)';
    estado.textContent = `Cliente "${cliente.nombre}" actualizado correctamente.`;
  } else {
    // Registrar un cliente nuevo
    const nuevoCliente = { id: generarSiguienteId(), autos: 0, ...datosCliente };
    clientes.push(nuevoCliente);
    estado.style.color = 'var(--accent-2)';
    estado.textContent = `Cliente "${nuevoCliente.nombre}" registrado correctamente.`;
  }

  renderizarTablaClientes(clientes);
  document.getElementById('buscarCliente').value = '';

  setTimeout(() => cerrarFormularioCliente(), 1200);
}


// Elimina un cliente de la lista, pidiendo confirmación antes 
function eliminarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const confirmar = window.confirm(`¿Seguro que quieres eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`);
  if (!confirmar) return;

  clientes = clientes.filter(c => c.id !== id);
  renderizarTablaClientes(clientes);
}