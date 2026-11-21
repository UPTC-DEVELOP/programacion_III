// Usa sesion.js (obtenerSesion, protegerPagina y cerrarSesion) para la sesión y el token de Clarisa.

const URL_FACTURA_NACIONAL_CLARISA = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional';
const TARIFA_IVA_PORCENTAJE = 19;
const LLAVE_FACTURAS_EMITIDAS = 'tm_facturas_emitidas';
const MAXIMO_FACTURAS_GUARDADAS = 20;

// Datos de ejemplo de la guía de Clarisa (ambiente de pruebas): 10 x $10.000 + IVA 19 % = $119.000
const DATOS_EJEMPLO_DE_LA_GUIA = {
  nit: '12345',
  numeroResolucion: '18760000001',
  prefijo: 'SETP',
  consecutivo: '990000001',
  formaPago: '1',
  mediosPago: ['10', '30'],
  cliente: {
    nombre: 'CONSUMIDOR FINAL',
    tipoIdentificacion: 'NI',
    numeroIdentificacion: '222222222222',
    naturaleza: 'NATURAL'
  },
  item: { codigo: 'TC1', nombre: 'Botella Cocacola 2.5 lt', unidad: '94', cantidad: 10, precio: 10000 }
};

const formateadorDePesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

document.addEventListener('DOMContentLoaded', iniciarPantallaFactura);


function iniciarPantallaFactura() {
  if (!obtenerSesion()) { protegerPagina(); return; }

  obtenerElemento('campoFechaVencimiento').value = obtenerFechaDeHoy();
  agregarFilaItem();
  mostrarEstadoConexionClarisa();
  actualizarResumenFactura();
  dibujarTablaFacturasEmitidas();

  obtenerElemento('formularioFactura').addEventListener('submit', enviarFormularioFactura);
  obtenerElemento('botonGuardarFactura').addEventListener('click', avisarQueGuardarEstaPendiente);
  obtenerElemento('botonAgregarItem').addEventListener('click', () => agregarFilaItem());
  obtenerElemento('botonUsarConsumidorFinal').addEventListener('click', usarClienteConsumidorFinal);
  obtenerElemento('botonCargarEjemploGuia').addEventListener('click', cargarEjemploDeLaGuia);
  obtenerElemento('botonLimpiarFactura').addEventListener('click', limpiarFormularioFactura);

  // La tabla de ítems se maneja por delegación: sirve para las filas que se agregan después
  const cuerpoTablaItems = obtenerElemento('cuerpoTablaItems');
  cuerpoTablaItems.addEventListener('input', evento => {
    evento.target.classList.remove('invalid');
    obtenerElemento('errorItems').textContent = '';
    actualizarResumenFactura();
  });
  cuerpoTablaItems.addEventListener('click', evento => {
    const botonQuitar = evento.target.closest('.boton-quitar-item');
    if (botonQuitar) quitarFilaItem(botonQuitar.closest('tr'));
  });

  activarLimpiezaDeErroresAlEscribir();
}


// Utilidades de la pantalla 

function obtenerElemento(id) {
  return document.getElementById(id);
}

function formatearPesos(valor) {
  return formateadorDePesos.format(valor);
}

function redondearADosDecimales(numero) {
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

// Fecha de hoy en el formato que usan el campo de fecha y Clarisa: AAAA-MM-DD
function obtenerFechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return hoy.getFullYear() + '-' + mes + '-' + dia;
}

// Pone o quita el error de un campo. Devuelve true si el campo quedó sin error.
function marcarCampo(campo, mensajeError) {
  const hayError = mensajeError !== '';
  const lugarDelError = document.querySelector('[data-error-for="' + campo.id + '"]');

  campo.classList.toggle('invalid', hayError);
  campo.setAttribute('aria-invalid', String(hayError));
  if (lugarDelError) lugarDelError.textContent = mensajeError;

  return !hayError;
}

// tipo: 'exito' | 'error' | 'info'
function mostrarMensajeEstado(elementoEstado, texto, tipo) {
  elementoEstado.className = 'estado-formulario ' + tipo;
  elementoEstado.textContent = texto;
}

function ponerBotonEnEspera(boton, enEspera, textoMientrasEspera) {
  if (enEspera) {
    boton.dataset.textoOriginal = boton.textContent;
    boton.textContent = textoMientrasEspera;
  } else if (boton.dataset.textoOriginal) {
    boton.textContent = boton.dataset.textoOriginal;
  }
  boton.disabled = enEspera;
}

// Quita el error de un campo apenas la persona empieza a corregirlo
function activarLimpiezaDeErroresAlEscribir() {
  document.querySelectorAll('#formularioFactura .campo-formulario input, #formularioFactura .campo-formulario select')
    .forEach(campo => {
      campo.addEventListener('input', () => marcarCampo(campo, ''));
    });

  obtenerElemento('grupoMediosPago').addEventListener('change', () => {
    obtenerElemento('errorMediosPago').textContent = '';
  });
}

function limpiarTodosLosErrores() {
  document.querySelectorAll('.error-campo').forEach(lugar => { lugar.textContent = ''; });
  document.querySelectorAll('.invalid').forEach(campo => campo.classList.remove('invalid'));
}


// Conexión con Clarisa

// El login ya conectó con Clarisa: aquí solo se muestra hasta cuándo dura el token
function mostrarEstadoConexionClarisa() {
  const sesion = obtenerSesion();
  if (!sesion) return;
  const fechaDeVencimiento = new Date(sesion.expira).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  obtenerElemento('textoEstadoConexion').textContent = 'Conectado con Clarisa. El token vence el ' + fechaDeVencimiento;
}


// Ítems de la factura (servicios y repuestos) 

function crearFilaItem(valores = {}) {
  const fila = document.createElement('tr');
  fila.className = 'fila-item-factura';
  fila.innerHTML =
    '<td><input type="text" class="campo-codigo-item" maxlength="20" placeholder="SRV-001" aria-label="Código del ítem"></td>' +
    '<td><input type="text" class="campo-nombre-item" maxlength="120" placeholder="Ej. Cambio de aceite" aria-label="Descripción del ítem"></td>' +
    '<td><select class="campo-unidad-item" aria-label="Unidad de medida">' +
      '<option value="94">Unidad (94)</option><option value="HUR">Hora (HUR)</option></select></td>' +
    '<td><input type="number" class="campo-cantidad-item" min="0" step="any" inputmode="decimal" aria-label="Cantidad"></td>' +
    '<td><input type="number" class="campo-precio-item" min="0" step="any" inputmode="decimal" placeholder="0" aria-label="Precio unitario sin IVA"></td>' +
    '<td class="texto-total-item"></td>' +
    '<td><button type="button" class="boton-quitar-item" aria-label="Quitar este ítem">Quitar</button></td>';

  fila.querySelector('.campo-codigo-item').value = valores.codigo || '';
  fila.querySelector('.campo-nombre-item').value = valores.nombre || '';
  fila.querySelector('.campo-unidad-item').value = valores.unidad || '94';
  fila.querySelector('.campo-cantidad-item').value = valores.cantidad !== undefined ? valores.cantidad : 1;
  fila.querySelector('.campo-precio-item').value = valores.precio !== undefined ? valores.precio : '';
  fila.querySelector('.texto-total-item').textContent = formatearPesos(0);
  return fila;
}

function agregarFilaItem(valores) {
  obtenerElemento('cuerpoTablaItems').appendChild(crearFilaItem(valores));
  actualizarResumenFactura();
}

function quitarFilaItem(fila) {
  const cantidadDeFilas = obtenerElemento('cuerpoTablaItems').querySelectorAll('.fila-item-factura').length;
  if (cantidadDeFilas <= 1) {
    obtenerElemento('errorItems').textContent = 'La factura necesita al menos un ítem.';
    return;
  }
  fila.remove();
  obtenerElemento('errorItems').textContent = '';
  actualizarResumenFactura();
}

function reiniciarTablaDeItems(valoresDeLaPrimeraFila) {
  obtenerElemento('cuerpoTablaItems').replaceChildren();
  agregarFilaItem(valoresDeLaPrimeraFila);
}

// Lee lo escrito en cada fila de la tabla de ítems
function leerItemsDeLaTabla() {
  const filas = obtenerElemento('cuerpoTablaItems').querySelectorAll('.fila-item-factura');

  return Array.from(filas).map(fila => {
    const campoCodigo = fila.querySelector('.campo-codigo-item');
    const campoNombre = fila.querySelector('.campo-nombre-item');
    const campoUnidad = fila.querySelector('.campo-unidad-item');
    const campoCantidad = fila.querySelector('.campo-cantidad-item');
    const campoPrecio = fila.querySelector('.campo-precio-item');

    return {
      fila,
      campoCodigo,
      campoNombre,
      campoCantidad,
      campoPrecio,
      codigo: campoCodigo.value.trim(),
      nombre: campoNombre.value.trim(),
      unidad: campoUnidad.value,
      cantidad: Number(campoCantidad.value),
      precio: Number(campoPrecio.value)
    };
  });
}

// Cada ítem: base = precio x cantidad; IVA = 19 % de la base; total = base + IVA
function calcularTotalesFactura(items) {
  let subtotal = 0;
  let iva = 0;

  const totalesPorItem = items.map(item => {
    const valorBase = redondearADosDecimales(item.precio * item.cantidad);
    const valorIva = redondearADosDecimales(valorBase * TARIFA_IVA_PORCENTAJE / 100);
    subtotal += valorBase;
    iva += valorIva;
    return redondearADosDecimales(valorBase + valorIva);
  });

  subtotal = redondearADosDecimales(subtotal);
  iva = redondearADosDecimales(iva);
  return { subtotal, iva, total: redondearADosDecimales(subtotal + iva), totalesPorItem };
}

function actualizarResumenFactura() {
  const items = leerItemsDeLaTabla();
  const totales = calcularTotalesFactura(items);

  items.forEach((item, posicion) => {
    item.fila.querySelector('.texto-total-item').textContent = formatearPesos(totales.totalesPorItem[posicion]);
  });

  obtenerElemento('textoSubtotal').textContent = formatearPesos(totales.subtotal);
  obtenerElemento('textoIva').textContent = formatearPesos(totales.iva);
  obtenerElemento('textoTotal').textContent = formatearPesos(totales.total);
}


// Datos de ejemplo y limpieza 

function usarClienteConsumidorFinal() {
  const cliente = DATOS_EJEMPLO_DE_LA_GUIA.cliente;
  obtenerElemento('campoNombreCliente').value = cliente.nombre;
  obtenerElemento('campoTipoIdentificacion').value = cliente.tipoIdentificacion;
  obtenerElemento('campoNumeroIdentificacion').value = cliente.numeroIdentificacion;
  obtenerElemento('campoNaturaleza').value = cliente.naturaleza;
}

// Llena toda la factura con el ejemplo de la guía de Clarisa, para probar el envío
function cargarEjemploDeLaGuia() {
  limpiarTodosLosErrores();

  obtenerElemento('campoNit').value = DATOS_EJEMPLO_DE_LA_GUIA.nit;
  obtenerElemento('campoNumeroResolucion').value = DATOS_EJEMPLO_DE_LA_GUIA.numeroResolucion;
  obtenerElemento('campoPrefijo').value = DATOS_EJEMPLO_DE_LA_GUIA.prefijo;
  obtenerElemento('campoConsecutivo').value = DATOS_EJEMPLO_DE_LA_GUIA.consecutivo;
  obtenerElemento('campoFormaPago').value = DATOS_EJEMPLO_DE_LA_GUIA.formaPago;

  document.querySelectorAll('input[name="medioPago"]').forEach(casilla => {
    casilla.checked = DATOS_EJEMPLO_DE_LA_GUIA.mediosPago.includes(casilla.value);
  });

  usarClienteConsumidorFinal();
  reiniciarTablaDeItems(DATOS_EJEMPLO_DE_LA_GUIA.item);
}

function limpiarClienteEItems() {
  obtenerElemento('campoNombreCliente').value = '';
  obtenerElemento('campoTipoIdentificacion').value = 'NI';
  obtenerElemento('campoNumeroIdentificacion').value = '';
  obtenerElemento('campoNaturaleza').value = 'NATURAL';
  obtenerElemento('campoObservacion').value = '';
  reiniciarTablaDeItems();
}

// El botón «Guardar factura» todavía no guarda: se conectará con la base de datos más adelante
function avisarQueGuardarEstaPendiente() {
  mostrarMensajeEstado(
    obtenerElemento('estadoFactura'),
    'Guardar en la base de datos todavía no está conectado: se hará más adelante.',
    'info'
  );
}

function limpiarFormularioFactura() {
  obtenerElemento('formularioFactura').reset();
  obtenerElemento('campoFechaVencimiento').value = obtenerFechaDeHoy();
  limpiarTodosLosErrores();
  reiniciarTablaDeItems();
  mostrarMensajeEstado(obtenerElemento('estadoFactura'), '', 'info');
  obtenerElemento('detalleRespuestaClarisa').hidden = true;
}

// Después de emitir, el siguiente consecutivo es el número siguiente
function incrementarConsecutivo() {
  const campoConsecutivo = obtenerElemento('campoConsecutivo');
  if (/^\d+$/.test(campoConsecutivo.value)) {
    campoConsecutivo.value = String(BigInt(campoConsecutivo.value) + 1n);
  }
}


// Validación 

// Valida un campo con una función que devuelve el texto del error ('' si está bien)
function validarCampo(idCampo, obtenerMensajeDeError) {
  const campo = obtenerElemento(idCampo);
  return marcarCampo(campo, obtenerMensajeDeError(campo.value.trim()));
}

function validarFormularioFactura() {
  const resultados = [
    validarCampo('campoNit', valor => /^\d{5,15}$/.test(valor) ? '' : 'Escribe el NIT solo con números (5 a 15 dígitos).'),
    validarCampo('campoNumeroResolucion', valor => /^\d{5,20}$/.test(valor) ? '' : 'Escribe el número de resolución solo con números.'),
    validarCampo('campoPrefijo', valor => /^[A-Za-z0-9]{1,10}$/.test(valor) ? '' : 'Usa de 1 a 10 letras o números, sin espacios.'),
    validarCampo('campoConsecutivo', valor => /^\d{1,15}$/.test(valor) ? '' : 'Escribe el consecutivo solo con números.'),
    validarCampo('campoFechaVencimiento', valor => valor !== '' ? '' : 'Elige la fecha de vencimiento.'),
    validarCampo('campoFormaPago', valor => valor !== '' ? '' : 'Elige la forma de pago.'),
    validarCampo('campoNombreCliente', valor => valor.length >= 3 ? '' : 'Escribe el nombre o razón social del cliente.'),
    validarCampo('campoTipoIdentificacion', valor => valor !== '' ? '' : 'Elige el tipo de identificación.'),
    validarCampo('campoNumeroIdentificacion', valor => /^\d{5,15}$/.test(valor) ? '' : 'Escribe el número solo con dígitos (5 a 15).'),
    validarCampo('campoNaturaleza', valor => valor !== '' ? '' : 'Elige la naturaleza del cliente.'),
    validarMediosDePago(),
    validarItemsDeLaFactura()
  ];

  return resultados.every(resultado => resultado === true);
}

function validarMediosDePago() {
  const hayMedioElegido = obtenerMediosDePagoElegidos().length > 0;
  obtenerElemento('errorMediosPago').textContent = hayMedioElegido ? '' : 'Elige al menos un medio de pago.';
  return hayMedioElegido;
}

function validarItemsDeLaFactura() {
  let todosValidos = true;

  leerItemsDeLaTabla().forEach(item => {
    const codigoValido = marcarCampo(item.campoCodigo, /^[A-Za-z0-9._-]{1,20}$/.test(item.codigo) ? '' : 'x');
    const nombreValido = marcarCampo(item.campoNombre, item.nombre.length >= 2 ? '' : 'x');
    const cantidadValida = marcarCampo(item.campoCantidad, item.cantidad > 0 ? '' : 'x');
    const precioValido = marcarCampo(item.campoPrecio, item.precio > 0 ? '' : 'x');
    if (!codigoValido || !nombreValido || !cantidadValida || !precioValido) todosValidos = false;
  });

  obtenerElemento('errorItems').textContent = todosValidos
    ? ''
    : 'Cada ítem necesita código (letras, números, punto, guion), descripción, cantidad mayor a 0 y precio mayor a 0.';
  return todosValidos;
}

function obtenerMediosDePagoElegidos() {
  return Array.from(document.querySelectorAll('input[name="medioPago"]:checked')).map(casilla => casilla.value);
}


// Armado y envío de la factura

// Arma el cuerpo (JSON) con los nombres de campo que pide la guía de Clarisa
function construirCuerpoFactura() {
  const items = leerItemsDeLaTabla();
  const totales = calcularTotalesFactura(items);
  const observacion = obtenerElemento('campoObservacion').value.trim();

  const cuerpoFactura = {
    nit: obtenerElemento('campoNit').value.trim(),
    numeroResolucion: obtenerElemento('campoNumeroResolucion').value.trim(),
    consecutivoDcto: obtenerElemento('campoConsecutivo').value.trim(),
    prefijoDcto: obtenerElemento('campoPrefijo').value.trim(),
    fechaVencimiento: obtenerElemento('campoFechaVencimiento').value,
    formaPago: obtenerElemento('campoFormaPago').value,
    mediosPago: obtenerMediosDePagoElegidos(),
    total: totales.total.toFixed(2),
    cliente: {
      nombreRazonSocial: obtenerElemento('campoNombreCliente').value.trim(),
      tipoIdentificacion: obtenerElemento('campoTipoIdentificacion').value,
      numIdentificacion: obtenerElemento('campoNumeroIdentificacion').value.trim(),
      naturaleza: obtenerElemento('campoNaturaleza').value
    },
    items: items.map(item => ({
      codigo: item.codigo,
      nombreItem: item.nombre,
      precioBaseUnitario: item.precio,
      cantidad: item.cantidad,
      unidad: item.unidad,
      impuestos: [{ tipo: 'IVA', claseImpuesto: 'PO', tarifaTributo: TARIFA_IVA_PORCENTAJE }]
    }))
  };

  if (observacion !== '') cuerpoFactura.observacion = observacion;
  return cuerpoFactura;
}

// Toma el título y el texto que Clarisa devuelve (la guía los escribe de dos maneras)
function obtenerTituloYTextoDeClarisa(cuerpoRespuesta, codigoHttp) {
  const titulo = (cuerpoRespuesta && (cuerpoRespuesta.titleResponse || cuerpoRespuesta.title_response)) || ('Error ' + codigoHttp);
  const texto = (cuerpoRespuesta && (cuerpoRespuesta.textResponse || cuerpoRespuesta.text_response)) || 'Clarisa no pudo procesar la factura.';
  return { titulo, texto };
}

// Estado en que Clarisa dejó la factura (VERIFICANDO, RECHAZADA, etc.)
function obtenerEstadoDeClarisa(cuerpoRespuesta) {
  if (cuerpoRespuesta && cuerpoRespuesta.data && cuerpoRespuesta.data.estadoClarisa) {
    return cuerpoRespuesta.data.estadoClarisa;
  }
  return '';
}

// Clarisa explica el motivo real dentro de data.errores; el texto general casi nunca lo dice
function obtenerMensajeDelPrimerError(cuerpoRespuesta) {
  const listaErrores = cuerpoRespuesta && cuerpoRespuesta.data && cuerpoRespuesta.data.errores;
  if (Array.isArray(listaErrores) && listaErrores.length > 0 && listaErrores[0].errorMessage) {
    return listaErrores[0].errorMessage;
  }
  return '';
}

function mostrarRespuestaDeClarisa(cuerpoRespuesta, abrirDetalle) {
  const detalle = obtenerElemento('detalleRespuestaClarisa');
  if (!cuerpoRespuesta) {
    detalle.hidden = true;
    return;
  }
  obtenerElemento('textoRespuestaClarisa').textContent = JSON.stringify(cuerpoRespuesta, null, 2);
  detalle.hidden = false;
  detalle.open = abrirDetalle;
}

async function enviarFormularioFactura(evento) {
  evento.preventDefault();

  const estadoFactura = obtenerElemento('estadoFactura');
  const botonEnviarAClarisa = obtenerElemento('botonEnviarAClarisa');

  // Si la sesión venció mientras la página estaba abierta, esto lleva al login
  const sesion = obtenerSesion();
  if (!sesion) { protegerPagina(); return; }
  const tokenClarisa = sesion.token;

  if (!validarFormularioFactura()) {
    mostrarMensajeEstado(estadoFactura, 'Revisa los campos marcados en rojo.', 'error');
    return;
  }

  const cuerpoFactura = construirCuerpoFactura();
  const numeroFactura = cuerpoFactura.prefijoDcto + cuerpoFactura.consecutivoDcto;

  ponerBotonEnEspera(botonEnviarAClarisa, true, 'Enviando a Clarisa…');
  mostrarMensajeEstado(estadoFactura, '', 'info');
  mostrarRespuestaDeClarisa(null, false);

  try {
    let respuesta;
    try {
      respuesta = await fetch(URL_FACTURA_NACIONAL_CLARISA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': tokenClarisa },
        body: JSON.stringify(cuerpoFactura)
      });
    } catch (error) {
      mostrarMensajeEstado(
        estadoFactura,
        'No se pudo comunicar con Clarisa. Revisa tu internet; si sigue igual, el navegador pudo bloquear la petición (CORS).',
        'error'
      );
      return;
    }

    let cuerpoRespuesta = null;
    try {
      cuerpoRespuesta = await respuesta.json();
    } catch (error) {
      // La respuesta no traía JSON
    }

    // 401 o 403: Clarisa ya no acepta el token. Se cierra la sesión y se lleva al login.
    if (respuesta.status === 401 || respuesta.status === 403) {
      cerrarSesion();
      protegerPagina();
      return;
    }

    const facturaEmitida = respuesta.ok && cuerpoRespuesta && cuerpoRespuesta.success === true;
    const { titulo, texto } = obtenerTituloYTextoDeClarisa(cuerpoRespuesta, respuesta.status);

    if (facturaEmitida) {
      guardarFacturaEmitida({
        numero: numeroFactura,
        cliente: cuerpoFactura.cliente.nombreRazonSocial,
        total: Number(cuerpoFactura.total),
        fechaHora: new Date().toISOString()
      });
      dibujarTablaFacturasEmitidas();
      mostrarRespuestaDeClarisa(cuerpoRespuesta, false);
      mostrarMensajeEstado(estadoFactura, 'Factura ' + numeroFactura + ' enviada a Clarisa correctamente. ' + titulo + ': ' + texto, 'exito');

      incrementarConsecutivo();
      limpiarClienteEItems();
        } else {
      const estadoClarisa = obtenerEstadoDeClarisa(cuerpoRespuesta);
      const motivoDelError = obtenerMensajeDelPrimerError(cuerpoRespuesta) || texto;

      mostrarRespuestaDeClarisa(cuerpoRespuesta, true);

      if (estadoClarisa === 'VERIFICANDO') {
        // Clarisa sí recibió la factura: solo falta que termine de validarla
        mostrarMensajeEstado(
          estadoFactura,
          'Clarisa recibió la factura ' + numeroFactura + ' y la está validando. Todavía no hay respuesta final de la DIAN.',
          'info'
        );
        incrementarConsecutivo();
      } else if (estadoClarisa === 'RECHAZADA') {
        // Fue recibida y rechazada: ese consecutivo ya se gastó
        mostrarMensajeEstado(
          estadoFactura,
          'Clarisa recibió la factura ' + numeroFactura + ' pero la rechazó. ' + motivoDelError,
          'error'
        );
        incrementarConsecutivo();
      } else {
        mostrarMensajeEstado(estadoFactura, 'La factura no se envió a Clarisa. ' + motivoDelError, 'error');
      }
    }
  } finally {
    ponerBotonEnEspera(botonEnviarAClarisa, false, '');
  }
}


// Facturas emitidas (se guardan en este navegador) 

function leerFacturasEmitidas() {
  try {
    const textoGuardado = localStorage.getItem(LLAVE_FACTURAS_EMITIDAS);
    const listaFacturas = textoGuardado ? JSON.parse(textoGuardado) : [];
    return Array.isArray(listaFacturas) ? listaFacturas : [];
  } catch (error) {
    return [];
  }
}

function guardarFacturaEmitida(factura) {
  const facturas = leerFacturasEmitidas();
  facturas.unshift(factura); // la más reciente primero
  try {
    localStorage.setItem(LLAVE_FACTURAS_EMITIDAS, JSON.stringify(facturas.slice(0, MAXIMO_FACTURAS_GUARDADAS)));
  } catch (error) {
    // Sin almacenamiento disponible: la factura se emitió igual, solo no queda en la lista
  }
}

function dibujarTablaFacturasEmitidas() {
  const cuerpoTabla = obtenerElemento('cuerpoTablaFacturasEmitidas');
  const facturas = leerFacturasEmitidas();

  cuerpoTabla.replaceChildren();
  obtenerElemento('mensajeSinFacturasEmitidas').hidden = facturas.length > 0;

  facturas.forEach(factura => {
    const fila = document.createElement('tr');
    const textosDeLaFila = [
      factura.numero,
      factura.cliente,
      formatearPesos(factura.total),
      new Date(factura.fechaHora).toLocaleString('es-CO')
    ];

    textosDeLaFila.forEach(texto => {
      const celda = document.createElement('td');
      celda.textContent = texto; // textContent: lo escrito por la persona nunca se interpreta como HTML
      fila.appendChild(celda);
    });
    cuerpoTabla.appendChild(fila);
  });
}