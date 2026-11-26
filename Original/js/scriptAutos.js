
// scriptAutos.js — CRUD de autos contra el backend Panther (recurso "vehicles").
// El dueño se identifica por su cédula y debe ser un cliente ya registrado ("customers").

let autos = [];
let clientesRegistrados = [];

const REGEX_PLACA = /^[A-Z]{3}\d{3}$/;
const CAMPOS = ['placa', 'modelo', 'color', 'cedulaDueno', 'fechaIngreso', 'horaIngreso'];


document.addEventListener('DOMContentLoaded', async () => {
  initBusquedaAutos();
  initFormularioAuto();
  initAccionesTabla();
  await cargarDatos();
});

async function cargarDatos() {
  try {
    [autos, clientesRegistrados] = await Promise.all([api.listar('vehicles'), api.listar('customers')]);
  } catch (error) {
    autos = [];
    mostrarMensaje('No se pudieron cargar los datos: ' + error.message, 'error');
  }
  refrescarTabla();
}

// ---------- Utilidades ----------


// "2026-09-28" -> "28/09/2026"
function formatearFecha(iso) {
  const [anio, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${anio}`;
}

function valorCampo(id) {
  return document.getElementById(id).value.trim();
}



// ---------- Tabla ----------


function renderizarTablaAutos(lista) {
  const cuerpoTabla = document.getElementById('cuerpoTabla');

  cuerpoTabla.innerHTML = '';

  document.getElementById('sinResultados').classList.toggle('oculto', lista.length > 0);
  if (lista.length === 0) return;

  lista.forEach((auto) => {
    const fila = document.createElement('tr');
    fila.dataset.id = auto.id;
    fila.innerHTML = `
    <td data-etiqueta="Placa">${escaparHtml(auto.plate)}</td>
      <td data-etiqueta="Modelo">${escaparHtml(auto.model)}</td>
      <td data-etiqueta="Color">${escaparHtml(auto.color)}</td>
     <td data-etiqueta="Dueño">${escaparHtml(auto.customerDocument)}${auto.customerName ? ' · ' + escaparHtml(auto.customerName) : ''}</td>
      <td data-etiqueta="Ingreso">${formatearFecha(auto.entryDate)} · ${escaparHtml(String(auto.entryTime).slice(0, 5))}</td>
      <td data-etiqueta="Acciones">
        <div class="acciones-fila">
         <button type="button" class="boton boton-fantasma" data-accion="editar" data-id="${auto.id}">Editar</button>
         <button type="button" class="boton boton-peligro" data-accion="eliminar" data-id="${auto.id}">Eliminar</button>
        </div>
      </td>
    `;
    //</td>`;
    cuerpoTabla.appendChild(fila);
  });
}

// Un solo listener para todos los botones de la tabla
function initAccionesTabla() {
  document.getElementById('cuerpoTabla').addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    if (boton.dataset.accion === 'editar') abrirFormularioEdicion(boton.dataset.id);
    if (boton.dataset.accion === 'eliminar') eliminarAuto(boton.dataset.id);
  });
}


// ---------- Búsqueda ----------


function initBusquedaAutos() {
  document.getElementById('buscar').addEventListener('input', refrescarTabla);
}


function refrescarTabla() {
  const texto = document.getElementById('buscar').value.trim().toLowerCase();

  const lista = !texto ? autos : autos.filter((a) =>
    a.plate.toLowerCase().includes(texto) || String(a.customerDocument).toLowerCase().includes(texto));
  renderizarTablaAutos(lista);
}

// ---------- Formulario ----------






function initFormularioAuto() {
  document.getElementById('btnAgregar').addEventListener('click', abrirFormularioNuevo);
  document.getElementById('btnCancelar').addEventListener('click', cerrarFormularioAuto);
  document.getElementById('formAuto').addEventListener('submit', guardarAuto);

  document.getElementById('placa').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
  CAMPOS.forEach((id) => document.getElementById(id).addEventListener('input', () => limpiarErrorCampo(id)));
}


function abrirFormularioNuevo() {


  document.getElementById('formAuto').reset();
  limpiarErrores();
  document.getElementById('autoIdEditando').value = '';

  document.getElementById('tituloFormulario').textContent = 'Registro de auto';

  document.getElementById('tarjetaForm').classList.remove('oculto');
  document.getElementById('btnAgregar').setAttribute('aria-expanded', 'true');
  document.getElementById('placa').focus();
}

function abrirFormularioEdicion(id) {
  const auto = autos.find((a) => String(a.id) === String(id));
  if (!auto) return;


  limpiarErrores();

  document.getElementById('autoIdEditando').value = auto.id;
  document.getElementById('placa').value = auto.plate;
  document.getElementById('modelo').value = auto.model;
  document.getElementById('color').value = auto.color;
  document.getElementById('cedulaDueno').value = auto.customerDocument;
  document.getElementById('fechaIngreso').value = auto.entryDate;
  document.getElementById('horaIngreso').value = String(auto.entryTime).slice(0, 5);
  document.getElementById('tituloFormulario').textContent = 'Editar auto';
  const tarjeta = document.getElementById('tarjetaForm');
  tarjeta.classList.remove('oculto');
  document.getElementById('btnAgregar').setAttribute('aria-expanded', 'true');
  tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


function cerrarFormularioAuto() {

  document.getElementById('formAuto').reset();
  document.getElementById('autoIdEditando').value = '';
  limpiarErrores();

  document.getElementById('tarjetaForm').classList.add('oculto');
  document.getElementById('btnAgregar').setAttribute('aria-expanded', 'false');
}


// ---------- Errores de validación ----------

function nombreErrorDe(id) {
  return 'error' + id.charAt(0).toUpperCase() + id.slice(1);
}

function mostrarErrorCampo(id, texto) {
  const campo = document.getElementById(id);
  campo.classList.remove('invalido');
  void campo.offsetWidth; // reinicia la animación de sacudida
  campo.classList.add('invalido');
  document.getElementById(nombreErrorDe(id)).textContent = texto;
}

function limpiarErrorCampo(id) {
  document.getElementById(id).classList.remove('invalido');
  document.getElementById(nombreErrorDe(id)).textContent = '';
}

function limpiarErrores() {
  CAMPOS.forEach(limpiarErrorCampo);
}


// ---------- Guardar ----------

async function guardarAuto(evento) {
  evento.preventDefault();
  limpiarErrores();

  const idEditando = valorCampo('autoIdEditando');
  const datos = {
    placa: valorCampo('placa').toUpperCase(),
    modelo: valorCampo('modelo'),
    color: valorCampo('color'),
    cedulaDueno: valorCampo('cedulaDueno'),
    fechaIngreso: valorCampo('fechaIngreso'),
    horaIngreso: valorCampo('horaIngreso')
  };

  const errores = validarAuto(datos, idEditando);
  const camposConError = Object.keys(errores);

  if (camposConError.length > 0) {
    camposConError.forEach((id) => mostrarErrorCampo(id, errores[id]));
    document.getElementById(camposConError[0]).focus();
    return;
  }

  const dueno = clientesRegistrados.find((c) => c.document === datos.cedulaDueno);
  const cuerpo = {
    plate: datos.placa,
    model: Number(datos.modelo),
    color: datos.color,
    customerId: dueno.id,
    entryDate: datos.fechaIngreso,
    entryTime: datos.horaIngreso
  };

  const boton = document.getElementById('btnGuardar');
  boton.disabled = true;
  try {
    if (idEditando) {
      await api.actualizar('vehicles', idEditando, cuerpo);
      mostrarMensaje(`Auto ${datos.placa} actualizado correctamente.`);
    } else {
      await api.crear('vehicles', cuerpo);
      mostrarMensaje(`Auto ${datos.placa} registrado correctamente.`);
    }

    document.getElementById('buscar').value = '';
    cerrarFormularioAuto();
    await cargarDatos();
    resaltarFila(datos.placa);
  } catch (error) {
    // Errores del servidor (placa duplicada, dueño inexistente, etc.)
    if (/placa/i.test(error.message)) mostrarErrorCampo('placa', error.message);
    mostrarMensaje(error.message, 'error');
  } finally {
    boton.disabled = false;
  }

}
// Devuelve { idCampo: 'mensaje de error' } (vacío si todo está bien)
function validarAuto(datos, idEditando) {
  const errores = {};


  if (!datos.placa) {
    errores.placa = 'La placa es obligatoria.';
  } else if (!REGEX_PLACA.test(datos.placa)) {
    errores.placa = 'Formato inválido. Usa 3 letras y 3 números (Ej: ABC123).';
  } else if (autos.some((a) => a.plate === datos.placa && String(a.id) !== String(idEditando))) {
    errores.placa = 'Ya existe un auto con esa placa.';
  }


  const anioMaximo = new Date().getFullYear() + 1;
  if (!datos.modelo) {
    errores.modelo = 'El modelo es obligatorio.';
  } else if (!/^\d{4}$/.test(datos.modelo)) {
    errores.modelo = 'Ingresa un año de 4 dígitos.';
  } else if (Number(datos.modelo) < 1950 || Number(datos.modelo) > anioMaximo) {
    errores.modelo = `El año debe estar entre 1950 y ${anioMaximo}.`;
  }

  // Color
  if (!datos.color) {
    errores.color = 'El color es obligatorio.';
  } else if (datos.color.length > 30) {
    errores.color = 'Máximo 30 caracteres.';
  }

  // Cédula del dueño
  if (!datos.cedulaDueno) {
    errores.cedulaDueno = 'La cédula del dueño es obligatoria.';
  } else if (!clientesRegistrados.some((c) => c.document === datos.cedulaDueno)) {
    errores.cedulaDueno = 'No hay un cliente registrado con ese documento. Regístralo primero en Clientes.';
  }

  if (!datos.fechaIngreso) errores.fechaIngreso = 'Selecciona la fecha de ingreso.';
  if (!datos.horaIngreso) errores.horaIngreso = 'Selecciona la hora de ingreso.';


return errores;
}


function resaltarFila(placa) {
  const auto = autos.find((a) => a.plate === placa);
  const fila = auto && document.querySelector(`#cuerpoTabla tr[data-id="${auto.id}"]`);
  if (fila) fila.classList.add('fila-resaltada');
}


// ---------- Eliminar ----------

async function eliminarAuto(id) {
  const auto = autos.find((a) => String(a.id) === String(id));
  if (!auto) return;

  if (!window.confirm(`¿Seguro que quieres eliminar el auto ${auto.plate}? Esta acción no se puede deshacer.`)) return;
  try {
    await api.eliminar('vehicles', id);
    mostrarMensaje(`Auto ${auto.plate} eliminado.`);
    await cargarDatos();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}