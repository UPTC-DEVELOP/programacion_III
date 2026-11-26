// clientes.js — CRUD de clientes contra el backend Panther (recurso "customers").
// Ya no se guarda nada en memoria: todo se lee y se escribe en la base de datos.

let clientes = [];
let tiposDocumento = [];

document.addEventListener('DOMContentLoaded', async () => {
  initBusquedaClientes();
  initFormularioCliente();
  await Promise.all([cargarTiposDocumento(), cargarClientes()]);
});

// "C001"-style a partir del id numérico de la base de datos
function codigoCliente(id) {
  return 'C' + String(id).padStart(3, '0');
}

function mostrarEstadoGeneral(texto, tipo) {
  const estado = document.getElementById('estadoFormularioCliente');
  estado.className = 'estado-formulario' + (tipo ? ' ' + tipo : '');
  estado.textContent = texto;
}

async function cargarTiposDocumento() {
  const select = document.getElementById('tipoDocCliente');
  try {
    tiposDocumento = await api.listar('documenttypes');
    select.innerHTML = '<option value="">-- Seleccione --</option>' +
      tiposDocumento.map((t) => `<option value="${t.id}">${escaparHtml(t.shortName)} · ${escaparHtml(t.longName)}</option>`).join('');
  } catch (error) {
    select.innerHTML = '<option value="">No se pudieron cargar</option>';
    mostrarEstadoGeneral(error.message, 'error');
  }
}

async function cargarClientes() {
  try {
    clientes = await api.listar('customers');
    renderizarTablaClientes(filtrarClientes());
  } catch (error) {
    clientes = [];
    renderizarTablaClientes([]);
    mostrarEstadoGeneral('No se pudieron cargar los clientes: ' + error.message, 'error');
  }
}

function filtrarClientes() {
  const texto = (document.getElementById('buscarCliente').value || '').trim().toLowerCase();
  if (!texto) return clientes;
  return clientes.filter((c) =>
    c.name.toLowerCase().includes(texto) || String(c.document).toLowerCase().includes(texto));
}

function renderizarTablaClientes(lista) {
  const cuerpoTabla = document.getElementById('cuerpoTablaClientes');
  const mensajeSinResultados = document.getElementById('mensajeSinClientes');
  cuerpoTabla.innerHTML = '';

  if (lista.length === 0) {
    mensajeSinResultados.textContent = clientes.length === 0
      ? 'Aún no hay clientes registrados.'
      : 'No se encontraron clientes con esos datos.';
    mensajeSinResultados.hidden = false;
    return;
  }
  mensajeSinResultados.hidden = true;

  lista.forEach((c) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td data-etiqueta="ID">${codigoCliente(c.id)}</td>
      <td data-etiqueta="Nombre">${escaparHtml(c.name)}</td>
      <td data-etiqueta="Documento">${escaparHtml((c.documentType ? c.documentType + ' ' : '') + c.document)}</td>
      <td data-etiqueta="Teléfono">${escaparHtml(c.phone)}</td>
      <td data-etiqueta="Correo">${escaparHtml(c.email)}</td>
      <td data-etiqueta="Autos"><span class="contador-autos">${Number(c.vehicles) || 0}</span></td>
      <td data-etiqueta="Acciones">
        <button type="button" class="enlace-accion-cliente enlace-editar-cliente" data-id="${c.id}">Editar</button>
        <button type="button" class="enlace-accion-cliente enlace-eliminar-cliente" data-id="${c.id}">Eliminar</button>
      </td>`;
    cuerpoTabla.appendChild(fila);
  });

  cuerpoTabla.querySelectorAll('.enlace-editar-cliente').forEach((b) =>
    b.addEventListener('click', () => abrirFormularioEdicion(b.dataset.id)));
  cuerpoTabla.querySelectorAll('.enlace-eliminar-cliente').forEach((b) =>
    b.addEventListener('click', () => eliminarCliente(b.dataset.id)));
}

function initBusquedaClientes() {
  document.getElementById('buscarCliente').addEventListener('input', () => renderizarTablaClientes(filtrarClientes()));
}

function initFormularioCliente() {
  document.getElementById('botonNuevoCliente').addEventListener('click', abrirFormularioNuevo);
  document.getElementById('botonCancelarCliente').addEventListener('click', cerrarFormularioCliente);
  document.getElementById('formularioNuevoCliente').addEventListener('submit', guardarCliente);
  // Al escribir se limpia el error de ese campo
  document.querySelectorAll('#formularioNuevoCliente input, #formularioNuevoCliente select').forEach((campo) => {
    campo.addEventListener('input', () => marcarError(campo.name, ''));
  });
}

function marcarError(nombre, texto) {
  const campo = document.querySelector(`#formularioNuevoCliente [name="${nombre}"]`);
  const span = document.querySelector(`[data-error-for="${nombre}"]`);
  if (campo) campo.classList.toggle('invalid', !!texto);
  if (span) span.textContent = texto;
}

function abrirFormularioNuevo() {
  const formulario = document.getElementById('formularioNuevoCliente');
  formulario.reset();
  limpiarErrores();
  document.getElementById('clienteIdEditando').value = '';
  document.getElementById('tituloFormularioCliente').textContent = 'Nuevo cliente';
  mostrarEstadoGeneral('', '');
  formulario.hidden = false;
  document.getElementById('botonNuevoCliente').setAttribute('aria-expanded', 'true');
  document.getElementById('nombreCliente').focus();
}

function abrirFormularioEdicion(id) {
  const c = clientes.find((x) => String(x.id) === String(id));
  if (!c) return;
  const formulario = document.getElementById('formularioNuevoCliente');
  limpiarErrores();
  mostrarEstadoGeneral('', '');
  document.getElementById('clienteIdEditando').value = c.id;
  document.getElementById('nombreCliente').value = c.name;
  document.getElementById('tipoDocCliente').value = c.documentTypeId || '';
  document.getElementById('cedulaCliente').value = c.document;
  document.getElementById('telefonoCliente').value = c.phone;
  document.getElementById('correoCliente').value = c.email;
  document.getElementById('direccionCliente').value = c.address;
  document.getElementById('tituloFormularioCliente').textContent = 'Editar cliente';
  formulario.hidden = false;
  document.getElementById('botonNuevoCliente').setAttribute('aria-expanded', 'true');
  formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cerrarFormularioCliente() {
  const formulario = document.getElementById('formularioNuevoCliente');
  formulario.reset();
  limpiarErrores();
  document.getElementById('clienteIdEditando').value = '';
  formulario.hidden = true;
  document.getElementById('botonNuevoCliente').setAttribute('aria-expanded', 'false');
  mostrarEstadoGeneral('', '');
}

function limpiarErrores() {
  ['nombreCliente', 'tipoDocCliente', 'cedulaCliente', 'telefonoCliente', 'correoCliente', 'direccionCliente']
    .forEach((n) => marcarError(n, ''));
}

// Validaciones del lado del cliente (el backend vuelve a validar todo)
function validarCliente(d) {
  const e = {};
  if (!d.name) e.nombreCliente = 'El nombre es obligatorio.';
  else if (d.name.length > 100) e.nombreCliente = 'Máximo 100 caracteres.';
  if (!d.documentTypeId) e.tipoDocCliente = 'Selecciona el tipo de documento.';
  if (!d.document) e.cedulaCliente = 'El documento es obligatorio.';
  else if (!/^[0-9A-Za-z-]{5,20}$/.test(d.document)) e.cedulaCliente = 'Entre 5 y 20 caracteres, sin espacios.';
  if (!d.phone) e.telefonoCliente = 'El teléfono es obligatorio.';
  else if (!/^[0-9+\s]{7,15}$/.test(d.phone)) e.telefonoCliente = 'Entre 7 y 15 dígitos.';
  if (!d.email) e.correoCliente = 'El correo es obligatorio.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.correoCliente = 'Correo no válido.';
  if (!d.address) e.direccionCliente = 'La dirección es obligatoria.';
  return e;
}

async function guardarCliente(evento) {
  evento.preventDefault();
  limpiarErrores();
  const idEditando = document.getElementById('clienteIdEditando').value;

  const datos = {
    name: document.getElementById('nombreCliente').value.trim(),
    documentTypeId: document.getElementById('tipoDocCliente').value ? Number(document.getElementById('tipoDocCliente').value) : null,
    document: document.getElementById('cedulaCliente').value.trim(),
    phone: document.getElementById('telefonoCliente').value.trim(),
    email: document.getElementById('correoCliente').value.trim(),
    address: document.getElementById('direccionCliente').value.trim()
  };

  const errores = validarCliente(datos);
  const claves = Object.keys(errores);
  if (claves.length) {
    claves.forEach((n) => marcarError(n, errores[n]));
    mostrarEstadoGeneral('Revisa los campos marcados antes de guardar.', 'error');
    return;
  }

  const boton = evento.target.querySelector('button[type="submit"]');
  boton.disabled = true;
  try {
    if (idEditando) {
      await api.actualizar('customers', idEditando, datos);
      mostrarEstadoGeneral(`Cliente "${datos.name}" actualizado correctamente.`, 'success');
    } else {
      await api.crear('customers', datos);
      mostrarEstadoGeneral(`Cliente "${datos.name}" registrado correctamente.`, 'success');
    }
    document.getElementById('buscarCliente').value = '';
    await cargarClientes();
    setTimeout(cerrarFormularioCliente, 1200);
  } catch (error) {
    mostrarEstadoGeneral(error.message, 'error');
  } finally {
    boton.disabled = false;
  }
}

async function eliminarCliente(id) {
  const c = clientes.find((x) => String(x.id) === String(id));
  if (!c) return;
  if (!window.confirm(`¿Seguro que quieres eliminar a "${c.name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await api.eliminar('customers', id);
    await cargarClientes();
  } catch (error) {
    // Por ejemplo: el cliente todavía tiene autos registrados
    window.alert(error.message);
  }
}
