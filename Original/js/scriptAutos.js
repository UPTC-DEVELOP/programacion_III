// Todo vive en memoria (sin backend)

// ---------- Datos de ejemplo ----------

// Clientes registrados: se usan para comprobar que la cédula del dueño existe.
// Cuando haya una fuente real de clientes (backend o almacenamiento compartido), reemplaza esta lista.
const clientesRegistrados = [
  { cedula: '1000123456', nombre: 'Juan Pérez' },
  { cedula: '1000654321', nombre: 'Claudia Mora' },
  { cedula: '1000111222', nombre: 'Pedro Herrera' },
];

let autos = [
  { placa: 'ABC123', modelo: '2020', color: 'Blanco', cedulaDueno: '1000123456', fechaIngreso: '2026-09-28', horaIngreso: '08:30' },
  { placa: 'XYZ789', modelo: '2021', color: 'Gris',   cedulaDueno: '1000123456', fechaIngreso: '2026-09-29', horaIngreso: '10:15' },
  { placa: 'QRS456', modelo: '2022', color: 'Rojo',   cedulaDueno: '1000654321', fechaIngreso: '2026-09-30', horaIngreso: '14:00' },
  { placa: 'TUV321', modelo: '2019', color: 'Negro',  cedulaDueno: '1000111222', fechaIngreso: '2026-10-01', horaIngreso: '09:45' },
];

const REGEX_PLACA = /^[A-Z]{3}\d{3}$/;
const CAMPOS = ['placa', 'modelo', 'color', 'cedulaDueno', 'fechaIngreso', 'horaIngreso'];


document.addEventListener('DOMContentLoaded', () => {
  renderizarTablaAutos(autos);
  initBusquedaAutos();
  initFormularioAuto();
  initAccionesTabla();
});


// ---------- Utilidades ----------

// Evita que el texto escrito por el usuario se interprete como HTML
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// "2026-09-28" -> "28/09/2026"
function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

function valorCampo(id) {
  return document.getElementById(id).value.trim();
}

let temporizadorMensaje;
function mostrarMensaje(texto, tipo = 'exito') {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = texto;
  mensaje.className = `mensaje mensaje--${tipo}`;

  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => {
    mensaje.className = 'mensaje mensaje--oculto';
    mensaje.textContent = '';
  }, 3500);
}


// ---------- Tabla ----------

// Dibuja la tabla a partir de una lista
// (se usa tanto para mostrar todos como para mostrar el resultado de una búsqueda)
function renderizarTablaAutos(lista) {
  const cuerpoTabla = document.getElementById('cuerpoTabla');
  const mensajeSinResultados = document.getElementById('sinResultados');
  cuerpoTabla.innerHTML = '';

  mensajeSinResultados.classList.toggle('oculto', lista.length > 0);
  if (lista.length === 0) return;

  lista.forEach(auto => {
    const fila = document.createElement('tr');
    fila.dataset.placa = auto.placa;
    fila.innerHTML = `
      <td data-etiqueta="Placa">${escaparHtml(auto.placa)}</td>
      <td data-etiqueta="Modelo">${escaparHtml(auto.modelo)}</td>
      <td data-etiqueta="Color">${escaparHtml(auto.color)}</td>
      <td data-etiqueta="Dueño">${escaparHtml(auto.cedulaDueno)}</td>
      <td data-etiqueta="Ingreso">${formatearFecha(auto.fechaIngreso)} · ${escaparHtml(auto.horaIngreso)}</td>
      <td data-etiqueta="Acciones">
        <div class="acciones-fila">
          <button type="button" class="boton boton-fantasma" data-accion="editar" data-placa="${escaparHtml(auto.placa)}">Editar</button>
          <button type="button" class="boton boton-peligro" data-accion="eliminar" data-placa="${escaparHtml(auto.placa)}">Eliminar</button>
        </div>
      </td>
    `;
    cuerpoTabla.appendChild(fila);
  });
}

// Un solo listener para todos los botones de la tabla (funciona aunque la tabla se redibuje)
function initAccionesTabla() {
  document.getElementById('cuerpoTabla').addEventListener('click', evento => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    if (boton.dataset.accion === 'editar') abrirFormularioEdicion(boton.dataset.placa);
    if (boton.dataset.accion === 'eliminar') eliminarAuto(boton.dataset.placa);
  });
}


// ---------- Búsqueda ----------

// Búsqueda por placa o cédula del dueño, en tiempo real
function initBusquedaAutos() {
  const campoBusqueda = document.getElementById('buscar');
  if (!campoBusqueda) return;

  campoBusqueda.addEventListener('input', refrescarTabla);
}

// Redibuja la tabla respetando lo que haya escrito en el buscador
function refrescarTabla() {
  const texto = document.getElementById('buscar').value.trim().toLowerCase();

  if (texto === '') {
    renderizarTablaAutos(autos);
    return;
  }

  const resultado = autos.filter(auto =>
    auto.placa.toLowerCase().includes(texto) ||
    auto.cedulaDueno.toLowerCase().includes(texto)
  );
  renderizarTablaAutos(resultado);
}


// ---------- Formulario: abrir, cerrar, conectar ----------

// Conecta los botones que abren y cierran el formulario, y el envío del formulario
function initFormularioAuto() {
  const botonAgregar = document.getElementById('btnAgregar');
  const botonCancelar = document.getElementById('btnCancelar');
  const formulario = document.getElementById('formAuto');

  botonAgregar.addEventListener('click', () => abrirFormularioNuevo());
  botonCancelar.addEventListener('click', () => cerrarFormularioAuto());
  formulario.addEventListener('submit', guardarAuto);

  // La placa se escribe siempre en mayúsculas
  document.getElementById('placa').addEventListener('input', evento => {
    evento.target.value = evento.target.value.toUpperCase();
  });

  // Al escribir en un campo se limpia su error
  CAMPOS.forEach(id => {
    document.getElementById(id).addEventListener('input', () => limpiarErrorCampo(id));
  });
}

// Abre el formulario vacío para registrar un auto nuevo
function abrirFormularioNuevo() {
  const tarjeta = document.getElementById('tarjetaForm');

  document.getElementById('formAuto').reset();
  limpiarErrores();
  document.getElementById('placaOriginal').value = '';
  document.getElementById('tituloFormulario').textContent = 'Registro de auto';

  tarjeta.classList.remove('oculto');
  document.getElementById('btnAgregar').setAttribute('aria-expanded', 'true');
  document.getElementById('placa').focus();
}

// Abre el formulario con los datos ya llenos, listo para editar
function abrirFormularioEdicion(placa) {
  const auto = autos.find(a => a.placa === placa);
  if (!auto) return;

  const tarjeta = document.getElementById('tarjetaForm');
  limpiarErrores();

  document.getElementById('placaOriginal').value = auto.placa;
  document.getElementById('placa').value = auto.placa;
  document.getElementById('modelo').value = auto.modelo;
  document.getElementById('color').value = auto.color;
  document.getElementById('cedulaDueno').value = auto.cedulaDueno;
  document.getElementById('fechaIngreso').value = auto.fechaIngreso;
  document.getElementById('horaIngreso').value = auto.horaIngreso;
  document.getElementById('tituloFormulario').textContent = 'Editar auto';

  tarjeta.classList.remove('oculto');
  document.getElementById('btnAgregar').setAttribute('aria-expanded', 'true');
  tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Cierra el formulario y lo deja limpio, sin datos de una edición anterior
function cerrarFormularioAuto() {
  const tarjeta = document.getElementById('tarjetaForm');

  document.getElementById('formAuto').reset();
  // reset() no borra el campo oculto si su valor se asignó por JS
  document.getElementById('placaOriginal').value = '';
  limpiarErrores();

  tarjeta.classList.add('oculto');
  document.getElementById('btnAgregar').setAttribute('aria-expanded', 'false');
}


// ---------- Errores de validación ----------

function nombreErrorDe(id) {
  return 'error' + id.charAt(0).toUpperCase() + id.slice(1);
}

function mostrarErrorCampo(id, texto) {
  const campo = document.getElementById(id);
  campo.classList.remove('invalido');
  void campo.offsetWidth;            // reinicia la animación de sacudida
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

// Guarda el auto: si "placaOriginal" tiene un valor, lo actualiza;
// si está vacío, lo registra como auto nuevo
function guardarAuto(evento) {
  evento.preventDefault();
  limpiarErrores();

  const placaOriginal = valorCampo('placaOriginal');
  const datosAuto = {
    placa: valorCampo('placa').toUpperCase(),
    modelo: valorCampo('modelo'),
    color: valorCampo('color'),
    cedulaDueno: valorCampo('cedulaDueno'),
    fechaIngreso: valorCampo('fechaIngreso'),
    horaIngreso: valorCampo('horaIngreso'),
  };

  const errores = validarAuto(datosAuto, placaOriginal);
  const camposConError = Object.keys(errores);

  if (camposConError.length > 0) {
    camposConError.forEach(id => mostrarErrorCampo(id, errores[id]));
    document.getElementById(camposConError[0]).focus();
    return;
  }

  if (placaOriginal) {
    // Actualizar un auto que ya existe
    const auto = autos.find(a => a.placa === placaOriginal);
    if (!auto) {
      mostrarMensaje('No se encontró el auto que intentas actualizar.', 'error');
      return;
    }
    Object.assign(auto, datosAuto);
    mostrarMensaje(`Auto ${auto.placa} actualizado correctamente.`);
  } else {
    // Registrar un auto nuevo
    autos.push(datosAuto);
    mostrarMensaje(`Auto ${datosAuto.placa} registrado correctamente.`);
  }

  document.getElementById('buscar').value = '';
  renderizarTablaAutos(autos);
  resaltarFila(datosAuto.placa);
  cerrarFormularioAuto();
}

// Devuelve un objeto { idCampo: 'mensaje de error' } (vacío si todo está bien)
function validarAuto(datos, placaOriginal) {
  const errores = {};

  // Placa
  if (!datos.placa) {
    errores.placa = 'La placa es obligatoria.';
  } else if (!REGEX_PLACA.test(datos.placa)) {
    errores.placa = 'Formato inválido. Usa 3 letras y 3 números (Ej: ABC123).';
  } else if (autos.some(a => a.placa === datos.placa && a.placa !== placaOriginal)) {
    errores.placa = 'Ya existe un auto con esa placa.';
  }

  // Modelo (año)
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
  } else if (!/^\d{6,10}$/.test(datos.cedulaDueno)) {
    errores.cedulaDueno = 'La cédula debe tener entre 6 y 10 dígitos.';
  } /*else if (!clientesRegistrados.some(c => c.cedula === datos.cedulaDueno)) {
    errores.cedulaDueno = 'No hay un cliente registrado con esa cédula.';
  }*/

  // Fecha y hora de ingreso
  if (!datos.fechaIngreso) {
    errores.fechaIngreso = 'Selecciona la fecha de ingreso.';
  }
  if (!datos.horaIngreso) {
    errores.horaIngreso = 'Selecciona la hora de ingreso.';
  }

  return errores;
}

// Resalta unos segundos la fila que se acaba de crear o editar
function resaltarFila(placa) {
  const fila = document.querySelector(`#cuerpoTabla tr[data-placa="${placa}"]`);
  if (fila) fila.classList.add('fila-resaltada');
}


// ---------- Eliminar ----------

// Elimina un auto de la lista, pidiendo confirmación antes
function eliminarAuto(placa) {
  const auto = autos.find(a => a.placa === placa);
  if (!auto) return;

  const confirmar = window.confirm(`¿Seguro que quieres eliminar el auto ${auto.placa}? Esta acción no se puede deshacer.`);
  if (!confirmar) return;

  autos = autos.filter(a => a.placa !== placa);
  refrescarTabla();
  mostrarMensaje(`Auto ${placa} eliminado.`);
}