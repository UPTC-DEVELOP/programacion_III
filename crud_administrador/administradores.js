/* CRUD de Administradores - TallerPro
   Los datos se guardan en el navegador (localStorage).
   Cuando tengas servidor, cambia cargar() y guardar() por llamadas a tu API. */

document.addEventListener('DOMContentLoaded', function () {

  const CLAVE = 'tallerpro_admins';
  const $ = (id) => document.getElementById(id);

  /* ---------- Datos ---------- */

  function datosEjemplo() {
    return [
      { id: 1, nombre: 'Laura Gómez',  usuario: 'lauraadmin', correo: 'laura@tallerpro.com',  rol: 'SuperAdmin' },
      { id: 2, nombre: 'Camilo Pérez', usuario: 'camilo',     correo: 'camilo@tallerpro.com', rol: 'Administrador' },
      { id: 3, nombre: 'Paula García', usuario: 'paula',      correo: 'paula@tallerpro.com',  rol: 'Administrador' },
      { id: 4, nombre: 'Andrés López', usuario: 'andres',     correo: 'andres@tallerpro.com', rol: 'Administrador' }
    ];
  }

  function cargar() {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) return JSON.parse(guardado);
    } catch (e) { /* si falla se usan los datos de ejemplo */ }
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
    return admins.reduce((max, a) => Math.max(max, a.id), 0) + 1;
  }

  let admins = cargar();
  let idAEliminar = null;

  /* ---------- Elementos ---------- */

  const tabla = $('tablaAdmins');
  const sinDatos = $('sinDatos');
  const modalAdmin = $('modalAdmin');
  const modalEliminar = $('modalEliminar');
  const form = $('formAdmin');
  const toast = $('toast');

  const campos = {
    id: $('adminId'),
    nombre: $('fNombre'),
    usuario: $('fUsuario'),
    correo: $('fCorreo'),
    rol: $('fRol')
  };

  const iconoEditar = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  const iconoBorrar = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

  /* ---------- Utilidades ---------- */

  // Evita que lo que escribe el usuario se interprete como HTML
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
    tabla.innerHTML = admins.map((a) => `
      <tr>
        <td>${a.id}</td>
        <td>${esc(a.nombre)}</td>
        <td>${esc(a.usuario)}</td>
        <td>${esc(a.correo)}</td>
        <td>${esc(a.rol)}</td>
        <td>
          <div class="ca-actions">
            <button type="button" class="ca-icon-btn ca-icon-btn--edit" data-accion="editar" data-id="${a.id}" aria-label="Editar a ${esc(a.nombre)}">${iconoEditar}</button>
            <button type="button" class="ca-icon-btn ca-icon-btn--delete" data-accion="eliminar" data-id="${a.id}" aria-label="Eliminar a ${esc(a.nombre)}">${iconoBorrar}</button>
          </div>
        </td>
      </tr>
    `).join('');
    sinDatos.hidden = admins.length > 0;
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

  /* ---------- Crear y editar ---------- */

  function limpiarErrores() {
    form.querySelectorAll('.ca-err').forEach((e) => { e.textContent = ''; });
    form.querySelectorAll('.has-error').forEach((e) => e.classList.remove('has-error'));
  }

  function nuevo() {
    form.reset();
    limpiarErrores();
    campos.id.value = '';
    $('modalTitulo').textContent = 'Registrar administrador';
    abrirModal(modalAdmin, campos.nombre);
  }

  function editar(id) {
    const a = admins.find((x) => x.id === id);
    if (!a) return;
    limpiarErrores();
    campos.id.value = a.id;
    campos.nombre.value = a.nombre;
    campos.usuario.value = a.usuario;
    campos.correo.value = a.correo;
    campos.rol.value = a.rol;
    $('modalTitulo').textContent = 'Editar administrador';
    abrirModal(modalAdmin, campos.nombre);
  }

  function validar() {
    limpiarErrores();
    const idActual = Number(campos.id.value) || null;
    const usuario = campos.usuario.value.trim().toLowerCase();
    const correo = campos.correo.value.trim().toLowerCase();
    let primero = null;

    const fallo = (campo, idError, mensaje) => {
      $(idError).textContent = mensaje;
      campo.closest('.ca-field').classList.add('has-error');
      if (!primero) primero = campo;
    };

    if (campos.nombre.value.trim().length < 3) {
      fallo(campos.nombre, 'eNombre', 'Escribe el nombre completo.');
    }
    if (!/^[a-z0-9._]{3,20}$/.test(usuario)) {
      fallo(campos.usuario, 'eUsuario', 'De 3 a 20 letras o números, sin espacios.');
    } else if (admins.some((a) => a.usuario.toLowerCase() === usuario && a.id !== idActual)) {
      fallo(campos.usuario, 'eUsuario', 'Ese usuario ya existe.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      fallo(campos.correo, 'eCorreo', 'Escribe un correo válido.');
    } else if (admins.some((a) => a.correo.toLowerCase() === correo && a.id !== idActual)) {
      fallo(campos.correo, 'eCorreo', 'Ese correo ya está registrado.');
    }

    if (primero) { primero.focus(); return false; }
    return true;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validar()) return;

    const datos = {
      nombre: campos.nombre.value.trim(),
      usuario: campos.usuario.value.trim().toLowerCase(),
      correo: campos.correo.value.trim().toLowerCase(),
      rol: campos.rol.value
    };

    const idActual = Number(campos.id.value);
    if (idActual) {
      admins = admins.map((a) => (a.id === idActual ? Object.assign({}, a, datos) : a));
      avisar('Administrador actualizado.');
    } else {
      admins.push(Object.assign({ id: siguienteId() }, datos));
      avisar('Administrador registrado.');
    }

    guardar(admins);
    cerrarModal(modalAdmin);
    pintarTabla();
  });

  $('btnRegistrar').addEventListener('click', nuevo);
  $('cerrarModal').addEventListener('click', () => cerrarModal(modalAdmin));
  $('cancelarModal').addEventListener('click', () => cerrarModal(modalAdmin));

  /* ---------- Eliminar ---------- */

  function pedirEliminar(id) {
    const a = admins.find((x) => x.id === id);
    if (!a) return;
    idAEliminar = id;
    $('elimTexto').textContent = 'Se eliminará a ' + a.nombre + ' (' + a.usuario + '). Esta acción no se puede deshacer.';
    abrirModal(modalEliminar, $('cancelarElim'));
  }

  $('confirmarElim').addEventListener('click', () => {
    admins = admins.filter((a) => a.id !== idAEliminar);
    idAEliminar = null;
    guardar(admins);
    cerrarModal(modalEliminar);
    pintarTabla();
    avisar('Administrador eliminado.');
  });
  $('cancelarElim').addEventListener('click', () => cerrarModal(modalEliminar));

  /* ---------- Clics en los botones de la tabla ---------- */

  tabla.addEventListener('click', (e) => {
    const boton = e.target.closest('button[data-accion]');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'editar') editar(id);
    if (boton.dataset.accion === 'eliminar') pedirEliminar(id);
  });

  /* ---------- Cerrar con clic fuera o con Escape ---------- */

  [modalAdmin, modalEliminar].forEach((modal) => {
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) cerrarModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modalEliminar.hidden) cerrarModal(modalEliminar);
    else if (!modalAdmin.hidden) cerrarModal(modalAdmin);
  });

  /* ---------- Cerrar sesión ---------- */

  $('cerrarSesion').addEventListener('click', () => {
    try { sessionStorage.removeItem('tallerpro_rol'); } catch (e) { /* sin acceso */ }
  });

  /* ---------- Inicio ---------- */

  pintarTabla();
});
