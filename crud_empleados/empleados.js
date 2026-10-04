document.addEventListener('DOMContentLoaded', function () {

  const CLAVE = 'tallerpro_empleados';
  const $ = (id) => document.getElementById(id);

  /* ---------- Datos de ejemplo ---------- */
  function datosEjemplo() {
    return [
      { 
        id: 1, 
        nombre: 'Juan Carlos Rodríguez Pérez', 
        cedula: '1001234567', 
        cargo: 'Mecánico', 
        telefono: '300 123 4567' 
      },
      { 
        id: 2, 
        nombre: 'María Fernanda Gómez López', 
        cedula: '1007654321', 
        cargo: 'Recepcionista', 
        telefono: '310 987 6543' 
      }
    ];
  }

  /* ---------- Cargar y guardar ---------- */
  function cargar() {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) return JSON.parse(guardado);
    } catch (e) { }
    const ejemplo = datosEjemplo();
    guardar(ejemplo);
    return ejemplo;
  }

  function guardar(lista) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    } catch (e) {
      avisar('No se pudo guardar en este navegador.');
    }
  }

  function siguienteId() {
    return empleados.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  }

  let empleados = cargar();
  let idAEliminar = null;

  /* ---------- Elementos del DOM ---------- */
  const tabla = $('tablaEmpleados');
  const sinDatos = $('sinDatos');
  const modalEmpleado = $('modalEmpleado');
  const modalEliminar = $('modalEliminar');
  const form = $('formEmpleado');
  const toast = $('toast');

  const campos = {
    id: $('empleadoId'),
    nombre: $('fNombre'),
    cedula: $('fCedula'),
    cargo: $('fCargo'),
    telefono: $('fTelefono')
  };

  const iconoEditar = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  const iconoBorrar = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

  /* ---------- Utilidades ---------- */
  function esc(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let temporizador;
  function avisar(mensaje) {
    toast.textContent = mensaje;
    toast.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  /* ---------- Mostrar tabla ---------- */
  function pintarTabla() {
    tabla.innerHTML = empleados.map((e) => `
      <tr>
        <td>${e.id}</td>
        <td>${esc(e.nombre)}</td>
        <td>${esc(e.cedula)}</td>
        <td>${esc(e.cargo)}</td>
        <td>${esc(e.telefono)}</td>
        <td>
          <div class="ca-actions">
            <button type="button" class="ca-icon-btn ca-icon-btn--edit" data-accion="editar" data-id="${e.id}" aria-label="Editar">${iconoEditar}</button>
            <button type="button" class="ca-icon-btn ca-icon-btn--delete" data-accion="eliminar" data-id="${e.id}" aria-label="Eliminar">${iconoBorrar}</button>
          </div>
        </td>
      </tr>
    `).join('');
    sinDatos.hidden = empleados.length > 0;
  }

  /* ---------- Abrir / cerrar modales ---------- */
  function abrirModal(modal, foco) {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    if (foco) foco.focus();
  }

  function cerrarModal(modal) {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { modal.hidden = true; }, 200);
  }

  /* ---------- Limpiar errores ---------- */
  function limpiarErrores() {
    form.querySelectorAll('.ca-err').forEach((e) => { e.textContent = ''; });
    form.querySelectorAll('.has-error').forEach((e) => e.classList.remove('has-error'));
  }

  /* ---------- Nuevo empleado ---------- */
  function nuevo() {
    form.reset();
    limpiarErrores();
    campos.id.value = '';
    $('modalTitulo').textContent = 'Registrar Empleado';
    abrirModal(modalEmpleado, campos.nombre);
  }

  /* ---------- Editar empleado ---------- */
  function editar(id) {
    const e = empleados.find((x) => x.id === id);
    if (!e) return;
    limpiarErrores();
    campos.id.value = e.id;
    campos.nombre.value = e.nombre;
    campos.cedula.value = e.cedula;
    campos.cargo.value = e.cargo;
    campos.telefono.value = e.telefono;
    $('modalTitulo').textContent = 'Editar Empleado';
    abrirModal(modalEmpleado, campos.nombre);
  }

  /* ---------- Validar campos ---------- */
  function validar() {
    limpiarErrores();
    const idActual = Number(campos.id.value) || null;
    const cedula = campos.cedula.value.trim();
    let primero = null;

    const fallo = (campo, idError, mensaje) => {
      $(idError).textContent = mensaje;
      campo.closest('.ca-field').classList.add('has-error');
      if (!primero) primero = campo;
    };

    if (campos.nombre.value.trim().length < 3) {
      fallo(campos.nombre, 'eNombre', 'Escribe el nombre completo.');
    }
    if (cedula.length < 5) {
      fallo(campos.cedula, 'eCedula', 'Cédula inválida.');
    } else if (empleados.some((e) => e.cedula === cedula && e.id !== idActual)) {
      fallo(campos.cedula, 'eCedula', 'Esa cédula ya está registrada.');
    }
    if (!campos.cargo.value) {
      fallo(campos.cargo, 'eCargo', 'Selecciona un cargo.');
    }
    if (campos.telefono.value.trim().length < 7) {
      fallo(campos.telefono, 'eTelefono', 'Teléfono inválido.');
    }

    if (primero) { primero.focus(); return false; }
    return true;
  }

  /* ---------- Guardar ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validar()) return;

    const datos = {
      nombre: campos.nombre.value.trim(),
      cedula: campos.cedula.value.trim(),
      cargo: campos.cargo.value,
      telefono: campos.telefono.value.trim()
    };

    const idActual = Number(campos.id.value);
    if (idActual) {
      empleados = empleados.map((e) => (e.id === idActual ? { ...e, ...datos } : e));
      avisar('Empleado actualizado ✅');
    } else {
      datos.id = siguienteId();
      empleados.push(datos);
      avisar('Empleado registrado ✅');
    }

    guardar(empleados);
    cerrarModal(modalEmpleado);
    pintarTabla();
  });

  /* ---------- Botones ---------- */
  $('btnRegistrar').addEventListener('click', nuevo);
  $('cerrarModal').addEventListener('click', () => cerrarModal(modalEmpleado));
  $('cancelarModal').addEventListener('click', () => cerrarModal(modalEmpleado));

  /* ---------- Eliminar ---------- */
  function pedirEliminar(id) {
    const e = empleados.find((x) => x.id === id);
    if (!e) return;
    idAEliminar = id;
   
    abrirModal(modalEliminar, $('cancelarElim'));
  }

  $('confirmarElim').addEventListener('click', () => {
    empleados = empleados.filter((e) => e.id !== idAEliminar);
    idAEliminar = null;
    guardar(empleados);
    cerrarModal(modalEliminar);
    pintarTabla();
    avisar('Empleado eliminado ✅');
  });
  $('cancelarElim').addEventListener('click', () => cerrarModal(modalEliminar));

  /* ---------- Clics en tabla ---------- */
  tabla.addEventListener('click', (e) => {
    const boton = e.target.closest('button[data-accion]');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'editar') editar(id);
    if (boton.dataset.accion === 'eliminar') pedirEliminar(id);
  });

  /* ---------- Cerrar con clic fuera o Escape ---------- */
  [modalEmpleado, modalEliminar].forEach((modal) => {
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) cerrarModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modalEliminar.hidden) cerrarModal(modalEliminar);
    else if (!modalEmpleado.hidden) cerrarModal(modalEmpleado);
  });

  /* ---------- Iniciar ---------- */
  pintarTabla();
});