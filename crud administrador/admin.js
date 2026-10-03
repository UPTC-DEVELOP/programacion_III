/* Panel de administración TallerPro - CRUD de órdenes de servicio
   Los datos se guardan en el navegador (localStorage).
   Para usarlo con un servidor real, solo hay que cambiar
   cargarOrdenes() y guardarOrdenes() por llamadas a tu API. */

document.addEventListener('DOMContentLoaded', function () {

  const CLAVE = 'tallerpro_ordenes';

  const ESTADOS = {
    pendiente: 'Pendiente',
    proceso: 'En proceso',
    finalizado: 'Finalizado',
    entregado: 'Entregado'
  };

  const moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  /* ---------- Datos ---------- */

  function hoy() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function datosEjemplo() {
    return [
      { id: crearId(), cliente: 'Carlos Rodríguez', telefono: '3001234567', placa: 'ABC123', vehiculo: 'Chevrolet Spark 2018', servicio: 'Mantenimiento preventivo', estado: 'entregado', precio: 80000, fecha: hoy(), notas: 'Cambio de aceite y filtro.' },
      { id: crearId(), cliente: 'Marcela Pérez', telefono: '3109876543', placa: 'XYZ789', vehiculo: 'Renault Duster 2020', servicio: 'Diagnóstico computarizado', estado: 'proceso', precio: 150000, fecha: hoy(), notas: 'Luz de motor encendida.' },
      { id: crearId(), cliente: 'Andrés Gómez', telefono: '3205551122', placa: 'KLM456', vehiculo: 'Mazda 3 2019', servicio: 'Alineación y balanceo', estado: 'pendiente', precio: 70000, fecha: hoy(), notas: '' }
    ];
  }

  function crearId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function cargarOrdenes() {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) return JSON.parse(guardado);
    } catch (e) { /* si falla, se usan los datos de ejemplo */ }
    const ejemplo = datosEjemplo();
    guardarOrdenes(ejemplo);
    return ejemplo;
  }

  function guardarOrdenes(lista) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    } catch (e) {
      avisar('No se pudo guardar en este navegador.');
    }
  }

  let ordenes = cargarOrdenes();
  let idAEliminar = null;

  /* ---------- Elementos ---------- */

  const $ = (id) => document.getElementById(id);

  const tablaBody = $('tablaBody');
  const vacio = $('vacio');
  const buscar = $('buscar');
  const filtroEstado = $('filtroEstado');

  const modalOrden = $('modalOrden');
  const modalEliminar = $('modalEliminar');
  const formOrden = $('formOrden');
  const toast = $('toast');

  const campos = {
    id: $('ordenId'),
    cliente: $('fCliente'),
    telefono: $('fTelefono'),
    placa: $('fPlaca'),
    vehiculo: $('fVehiculo'),
    servicio: $('fServicio'),
    estado: $('fEstado'),
    precio: $('fPrecio'),
    fecha: $('fFecha'),
    notas: $('fNotas')
  };

  /* ---------- Utilidades ---------- */

  // Evita que texto escrito por el usuario se interprete como HTML
  function esc(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatearFecha(iso) {
    if (!iso) return '';
    const [a, m, d] = iso.split('-');
    return d + '/' + m + '/' + a;
  }

  let temporizadorAviso;
  function avisar(mensaje) {
    toast.textContent = mensaje;
    toast.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  /* ---------- Leer: tabla, filtros y resumen ---------- */

  function filtrar() {
    const texto = buscar.value.trim().toLowerCase();
    const estado = filtroEstado.value;

    return ordenes
      .filter((o) => {
        const coincideTexto = !texto ||
          o.cliente.toLowerCase().includes(texto) ||
          o.placa.toLowerCase().includes(texto) ||
          o.vehiculo.toLowerCase().includes(texto);
        const coincideEstado = !estado || o.estado === estado;
        return coincideTexto && coincideEstado;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  function pintarTabla() {
    const lista = filtrar();

    tablaBody.innerHTML = lista.map((o) => `
      <tr>
        <td>${esc(formatearFecha(o.fecha))}</td>
        <td>${esc(o.cliente)}<span class="adm-sub">${esc(o.telefono)}</span></td>
        <td>${esc(o.vehiculo)}<span class="adm-sub">${esc(o.placa)}</span></td>
        <td>${esc(o.servicio)}</td>
        <td><span class="adm-badge adm-badge--${esc(o.estado)}">${esc(ESTADOS[o.estado] || o.estado)}</span></td>
        <td class="adm-right">${esc(moneda.format(o.precio))}</td>
        <td class="adm-right">
          <span class="adm-row-actions">
            <button type="button" class="adm-icon-btn" data-accion="editar" data-id="${esc(o.id)}" aria-label="Editar orden de ${esc(o.cliente)}">Editar</button>
            <button type="button" class="adm-icon-btn adm-icon-btn--danger" data-accion="eliminar" data-id="${esc(o.id)}" aria-label="Eliminar orden de ${esc(o.cliente)}">Eliminar</button>
          </span>
        </td>
      </tr>
    `).join('');

    vacio.hidden = lista.length > 0;
    pintarResumen();
  }

  function pintarResumen() {
    $('statTotal').textContent = ordenes.length;
    $('statPendiente').textContent = ordenes.filter((o) => o.estado === 'pendiente').length;
    $('statProceso').textContent = ordenes.filter((o) => o.estado === 'proceso').length;
    const facturado = ordenes
      .filter((o) => o.estado === 'finalizado' || o.estado === 'entregado')
      .reduce((suma, o) => suma + o.precio, 0);
    $('statIngresos').textContent = moneda.format(facturado);
  }

  buscar.addEventListener('input', pintarTabla);
  filtroEstado.addEventListener('change', pintarTabla);

  /* ---------- Modales (abrir / cerrar) ---------- */

  function abrirModal(modal, foco) {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    if (foco) foco.focus();
  }

  function cerrarModal(modal) {
    modal.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; }, 200);
    if (modalOrden.hidden || modal === modalOrden) {
      if (modalEliminar.hidden || modal === modalEliminar) {
        document.body.style.overflow = '';
      }
    }
  }

  /* ---------- Crear y editar ---------- */

  function limpiarErrores() {
    formOrden.querySelectorAll('.adm-err').forEach((e) => { e.textContent = ''; });
    formOrden.querySelectorAll('.has-error').forEach((e) => e.classList.remove('has-error'));
  }

  function nuevaOrden() {
    formOrden.reset();
    limpiarErrores();
    campos.id.value = '';
    campos.estado.value = 'pendiente';
    campos.fecha.value = hoy();
    $('modalTitulo').textContent = 'Nueva orden';
    abrirModal(modalOrden, campos.cliente);
  }

  function editarOrden(id) {
    const o = ordenes.find((x) => x.id === id);
    if (!o) return;
    formOrden.reset();
    limpiarErrores();
    campos.id.value = o.id;
    campos.cliente.value = o.cliente;
    campos.telefono.value = o.telefono;
    campos.placa.value = o.placa;
    campos.vehiculo.value = o.vehiculo;
    campos.servicio.value = o.servicio;
    campos.estado.value = o.estado;
    campos.precio.value = o.precio;
    campos.fecha.value = o.fecha;
    campos.notas.value = o.notas || '';
    $('modalTitulo').textContent = 'Editar orden';
    abrirModal(modalOrden, campos.cliente);
  }

  function marcarError(campo, idError, mensaje) {
    $(idError).textContent = mensaje;
    campo.closest('.adm-field').classList.add('has-error');
  }

  function validar() {
    limpiarErrores();
    let primero = null;
    const fallo = (campo, idError, mensaje) => {
      marcarError(campo, idError, mensaje);
      if (!primero) primero = campo;
    };

    if (campos.cliente.value.trim().length < 3) fallo(campos.cliente, 'eCliente', 'Escribe el nombre del cliente.');
    if (!/^[0-9]{7,10}$/.test(campos.telefono.value.trim())) fallo(campos.telefono, 'eTelefono', 'Escribe entre 7 y 10 números.');
    if (!/^[A-Za-z]{3}[0-9]{2,3}[A-Za-z]?$/.test(campos.placa.value.trim())) fallo(campos.placa, 'ePlaca', 'Placa no válida, por ejemplo ABC123.');
    if (campos.vehiculo.value.trim().length < 3) fallo(campos.vehiculo, 'eVehiculo', 'Escribe marca, modelo y año.');
    if (!campos.servicio.value) fallo(campos.servicio, 'eServicio', 'Selecciona un servicio.');
    const precio = Number(campos.precio.value);
    if (campos.precio.value === '' || isNaN(precio) || precio < 0) fallo(campos.precio, 'ePrecio', 'Escribe un valor válido.');
    if (!campos.fecha.value) fallo(campos.fecha, 'eFecha', 'Selecciona la fecha.');

    if (primero) { primero.focus(); return false; }
    return true;
  }

  formOrden.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validar()) return;

    const datos = {
      cliente: campos.cliente.value.trim(),
      telefono: campos.telefono.value.trim(),
      placa: campos.placa.value.trim().toUpperCase(),
      vehiculo: campos.vehiculo.value.trim(),
      servicio: campos.servicio.value,
      estado: campos.estado.value,
      precio: Number(campos.precio.value),
      fecha: campos.fecha.value,
      notas: campos.notas.value.trim()
    };

    if (campos.id.value) {
      ordenes = ordenes.map((o) => (o.id === campos.id.value ? Object.assign({}, o, datos) : o));
      avisar('Orden actualizada.');
    } else {
      ordenes.push(Object.assign({ id: crearId() }, datos));
      avisar('Orden creada.');
    }

    guardarOrdenes(ordenes);
    cerrarModal(modalOrden);
    pintarTabla();
  });

  $('btnNueva').addEventListener('click', nuevaOrden);
  $('cerrarOrden').addEventListener('click', () => cerrarModal(modalOrden));
  $('cancelarOrden').addEventListener('click', () => cerrarModal(modalOrden));

  /* ---------- Eliminar ---------- */

  function pedirEliminar(id) {
    const o = ordenes.find((x) => x.id === id);
    if (!o) return;
    idAEliminar = id;
    $('elimTexto').textContent = 'Se eliminará la orden de ' + o.cliente + ' (' + o.placa + '). Esta acción no se puede deshacer.';
    abrirModal(modalEliminar, $('cancelarElim'));
  }

  $('confirmarElim').addEventListener('click', () => {
    ordenes = ordenes.filter((o) => o.id !== idAEliminar);
    idAEliminar = null;
    guardarOrdenes(ordenes);
    cerrarModal(modalEliminar);
    pintarTabla();
    avisar('Orden eliminada.');
  });

  $('cancelarElim').addEventListener('click', () => cerrarModal(modalEliminar));

  /* ---------- Clics en la tabla (editar / eliminar) ---------- */

  tablaBody.addEventListener('click', (e) => {
    const boton = e.target.closest('button[data-accion]');
    if (!boton) return;
    if (boton.dataset.accion === 'editar') editarOrden(boton.dataset.id);
    if (boton.dataset.accion === 'eliminar') pedirEliminar(boton.dataset.id);
  });

  /* ---------- Cerrar con clic fuera o con Escape ---------- */

  [modalOrden, modalEliminar].forEach((modal) => {
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) cerrarModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modalEliminar.hidden) cerrarModal(modalEliminar);
    else if (!modalOrden.hidden) cerrarModal(modalOrden);
  });

  /* ---------- Exportar CSV ---------- */

  $('btnExportar').addEventListener('click', () => {
    const lista = filtrar();
    if (!lista.length) { avisar('No hay órdenes para exportar.'); return; }

    // Evita que Excel ejecute celdas que empiezan con = + - @
    const celda = (v) => {
      let t = String(v);
      if (/^[=+\-@]/.test(t)) t = "'" + t;
      return '"' + t.replace(/"/g, '""') + '"';
    };

    const encabezado = ['Fecha', 'Cliente', 'Celular', 'Placa', 'Vehículo', 'Servicio', 'Estado', 'Valor', 'Notas'];
    const filas = lista.map((o) => [
      o.fecha, o.cliente, o.telefono, o.placa, o.vehiculo, o.servicio,
      ESTADOS[o.estado] || o.estado, o.precio, o.notas || ''
    ].map(celda).join(','));

    const csv = '\uFEFF' + [encabezado.map(celda).join(',')].concat(filas).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'ordenes-tallerpro.csv';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  });

  /* ---------- Inicio ---------- */

  pintarTabla();
});
