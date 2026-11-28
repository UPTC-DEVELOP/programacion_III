var API_CLIENTES = typeof window.API_TALLER === "string" ? window.API_TALLER : "../backend/rest";
var CLAVE_PANTHER = "olimac_panther_token";
var CLAVE_PANTHER_USUARIO = "olimac_panther_user";
var CLAVE_PANTHER_LOGOUT_LEGACY = "olimac_panther_logout_manual";
var listaClientesApi = [];

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("formCliente");
  var buscar = document.getElementById("buscarCliente");
  var cedula = document.getElementById("cedulaCliente");
  var nombre = document.getElementById("nombreCliente");
  var correo = document.getElementById("correoCliente");
  var telefono = document.getElementById("telefonoCliente");
  var direccion = document.getElementById("direccionCliente");

  cedula.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
    marcarCampo(this, /^[0-9]{5,20}$/.test(this.value));
  });
  nombre.addEventListener("input", function () {
    marcarCampo(this, this.value.trim().length > 0 && this.value.trim().length <= 120);
  });
  correo.addEventListener("input", function () {
    var val = this.value.trim();
    marcarCampo(this, val.length > 0 && val.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
  });
  telefono.addEventListener("input", function () {
    marcarCampo(this, /^[0-9+\-\s]{7,20}$/.test(this.value.trim()));
  });
  direccion.addEventListener("input", function () {
    if (this.value.trim() === "") {
      this.classList.remove("is-valid", "is-invalid");
      return;
    }
    marcarCampo(this, this.value.trim().length <= 180);
  });

  document.getElementById("formSesionPanther").addEventListener("submit", entrarPanther);
  var btnCerrarSesionPanther = document.getElementById("btnCerrarSesionPanther");
  if (btnCerrarSesionPanther) {
    btnCerrarSesionPanther.addEventListener("click", function () {
      cerrarSesionPanther(true);
    });
  }
  form.addEventListener("submit", guardarCliente);
  document.getElementById("btnLimpiarCliente").addEventListener("click", limpiarFormularioCliente);
  buscar.addEventListener("input", pintarTabla);
  document.getElementById("tablaClientes").addEventListener("click", function (evento) {
    var boton = evento.target.closest("button");
    if (!boton) {
      return;
    }
    var id = boton.getAttribute("data-id");
    if (boton.getAttribute("data-accion") === "editar") {
      cargarParaEditar(id);
    }
    if (boton.getAttribute("data-accion") === "eliminar") {
      eliminarCliente(id);
    }
  });

  sessionStorage.removeItem(CLAVE_PANTHER_LOGOUT_LEGACY);

  actualizarVistaSesion();
  if (obtenerTokenPanther()) {
    cargarClientes();
  }
});

function obtenerTokenPanther() {
  return sessionStorage.getItem(CLAVE_PANTHER) || "";
}

function obtenerUsuarioPanther() {
  return sessionStorage.getItem(CLAVE_PANTHER_USUARIO) || "";
}

function guardarSesionPanther(token, usuario) {
  sessionStorage.setItem(CLAVE_PANTHER, token);
  sessionStorage.setItem(CLAVE_PANTHER_USUARIO, usuario);
}

function limpiarStoragePanther() {
  sessionStorage.removeItem(CLAVE_PANTHER);
  sessionStorage.removeItem(CLAVE_PANTHER_USUARIO);
  sessionStorage.removeItem(CLAVE_PANTHER_LOGOUT_LEGACY);
  localStorage.removeItem(CLAVE_PANTHER);
  localStorage.removeItem(CLAVE_PANTHER_USUARIO);
  localStorage.removeItem(CLAVE_PANTHER_LOGOUT_LEGACY);
}

async function entrarPanther(evento) {
  evento.preventDefault();
  var campoUsuario = document.getElementById("usuarioPanther");
  var campoContrasenia = document.getElementById("contraseniaPanther");
  var btnEntrar = document.getElementById("btnEntrarPanther");
  var usuario = campoUsuario.value.trim();
  var contrasenia = campoContrasenia.value;

  if (!usuario || !contrasenia) {
    avisar("Escriba su usuario y contraseña.", "aviso");
    if (!usuario) {
      campoUsuario.focus();
    } else {
      campoContrasenia.focus();
    }
    return;
  }

  btnEntrar.disabled = true;
  try {
    var resultado = await llamarClientes("useraction/login", {
      method: "POST",
      body: { user: usuario, password: contrasenia }
    });
    var token = resultado.json && resultado.json.data && resultado.json.data.keyAPI;
    var usuarioAutenticado = (resultado.json && resultado.json.data && resultado.json.data.user) || usuario;
    if (!resultado.respuesta.ok || !token) {
      avisar(mensajeApi(resultado.json) || "Usuario o contraseña incorrectos.", "error");
      return;
    }

    guardarSesionPanther(token, usuarioAutenticado);
    campoUsuario.value = "";
    campoContrasenia.value = "";
    actualizarVistaSesion();
    avisar("Sesión iniciada correctamente.", "ok");
    await cargarClientes();
  } catch (error) {
    avisar(mensajeErrorConexion(), "error");
  } finally {
    btnEntrar.disabled = false;
  }
}

function actualizarVistaSesion() {
  var activa = Boolean(obtenerTokenPanther());
  var usuario = obtenerUsuarioPanther();

  var formLogin = document.getElementById("formSesionPanther");
  var barraActiva = document.getElementById("sesionActivaPanther");
  var etiquetaUsuario = document.getElementById("usuarioActivoPanther");
  var avisoBloqueo = document.getElementById("avisoBloqueoClientes");
  var panelCrud = document.getElementById("panelCrudClientes");

  formLogin.hidden = activa;
  barraActiva.hidden = !activa;
  avisoBloqueo.hidden = activa;
  panelCrud.hidden = !activa;

  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = activa ? usuario : "";
  }

  var controlesCrud = panelCrud.querySelectorAll("input, button, select, textarea");
  controlesCrud.forEach(function (control) {
    control.disabled = !activa;
  });
}

function cerrarSesionPanther(notificar) {
  limpiarStoragePanther();
  listaClientesApi = [];
  limpiarFormularioCliente();
  document.getElementById("buscarCliente").value = "";
  document.getElementById("tablaClientes").innerHTML = "";
  document.getElementById("usuarioPanther").value = "";
  document.getElementById("contraseniaPanther").value = "";
  actualizarVistaSesion();
  if (notificar) {
    avisar("Sesión cerrada.", "aviso");
  }
  document.getElementById("usuarioPanther").focus();
}

function esErrorAutenticacion(resultado) {
  if (!resultado || !resultado.respuesta) {
    return false;
  }
  if (resultado.respuesta.status === 401 || resultado.respuesta.status === 403) {
    return true;
  }
  var texto = resultado.json && typeof resultado.json.data === "string" ? resultado.json.data.toLowerCase() : "";
  return resultado.respuesta.status === 400 && (texto.indexOf("authorization") !== -1 || texto.indexOf("keyapi") !== -1);
}

async function cargarClientes() {
  if (!obtenerTokenPanther()) {
    actualizarVistaSesion();
    return;
  }
  try {
    var resultado = await llamarClientes("clientes");
    if (esErrorAutenticacion(resultado)) {
      cerrarSesionPanther(false);
      avisar("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisar(mensajeApi(resultado.json), "error");
      return;
    }
    listaClientesApi = Array.isArray(resultado.json.data) ? resultado.json.data : [];
    pintarTabla();
  } catch (error) {
    avisar(mensajeErrorConexion(), "error");
  }
}

async function guardarCliente(evento) {
  evento.preventDefault();
  if (!obtenerTokenPanther()) {
    actualizarVistaSesion();
    avisar("Debes iniciar sesión antes de registrar o editar clientes.", "aviso");
    return;
  }

  var cedula = document.getElementById("cedulaCliente").value.trim();
  var nombre = document.getElementById("nombreCliente").value.trim();
  var correo = document.getElementById("correoCliente").value.trim().toLowerCase();
  var telefono = document.getElementById("telefonoCliente").value.trim();
  var direccion = document.getElementById("direccionCliente").value.trim();
  var id = document.getElementById("clienteId").value;

  if (
    !/^[0-9]{5,20}$/.test(cedula) ||
    nombre.length === 0 ||
    nombre.length > 120 ||
    correo.length === 0 ||
    correo.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
    !/^[0-9+\-\s]{7,20}$/.test(telefono) ||
    direccion.length > 180
  ) {
    avisar("Complete todos los campos obligatorios con un formato válido.", "error");
    return;
  }

  var repetida = listaClientesApi.some(function (item) {
    return String(item.cedula) === cedula && String(item.id) !== String(id);
  });
  if (repetida) {
    avisar("Esa cédula ya se encuentra registrada.", "aviso");
    return;
  }

  var cuerpo = {
    cedula: cedula,
    nombre: nombre,
    correo: correo,
    telefono: telefono,
    direccion: direccion
  };
  var ruta = id ? "clientes/" + encodeURIComponent(id) : "clientes";
  var metodo = id ? "PUT" : "POST";

  try {
    var resultado = await llamarClientes(ruta, { method: metodo, body: cuerpo });
    if (esErrorAutenticacion(resultado)) {
      cerrarSesionPanther(false);
      avisar("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisar(mensajeApi(resultado.json), "error");
      return;
    }
    avisar(id ? "Cliente actualizado." : "Cliente registrado correctamente.", "ok");
    limpiarFormularioCliente();
    await cargarClientes();
  } catch (error) {
    avisar(mensajeErrorConexion(), "error");
  }
}

function cargarParaEditar(id) {
  var cliente = listaClientesApi.find(function (item) {
    return String(item.id) === String(id);
  });
  if (!cliente) {
    return;
  }
  document.getElementById("clienteId").value = cliente.id;
  document.getElementById("cedulaCliente").value = cliente.cedula || "";
  document.getElementById("nombreCliente").value = cliente.nombre || "";
  document.getElementById("correoCliente").value = cliente.correo || "";
  document.getElementById("telefonoCliente").value = cliente.telefono || "";
  document.getElementById("direccionCliente").value = cliente.direccion || "";
  document.getElementById("btnGuardarCliente").textContent = "Actualizar cliente";
}

async function eliminarCliente(id) {
  if (!obtenerTokenPanther()) {
    actualizarVistaSesion();
    avisar("Debes iniciar sesión para eliminar clientes.", "aviso");
    return;
  }
  if (!window.confirm("¿Está seguro de eliminar este cliente?")) {
    return;
  }
  try {
    var resultado = await llamarClientes("clientes/" + encodeURIComponent(id), { method: "DELETE" });
    if (esErrorAutenticacion(resultado)) {
      cerrarSesionPanther(false);
      avisar("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisar(mensajeApi(resultado.json), "error");
      return;
    }
    avisar("Cliente eliminado.", "aviso");
    limpiarFormularioCliente();
    await cargarClientes();
  } catch (error) {
    avisar(mensajeErrorConexion(), "error");
  }
}

function pintarTabla() {
  var tbody = document.getElementById("tablaClientes");
  if (!obtenerTokenPanther()) {
    tbody.innerHTML = "";
    return;
  }

  var texto = document.getElementById("buscarCliente").value.trim().toLowerCase();
  var visibles = listaClientesApi.filter(function (item) {
    var bolsa = (
      (item.cedula || "") + " " +
      (item.nombre || "") + " " +
      (item.correo || "") + " " +
      (item.telefono || "") + " " +
      (item.direccion || "")
    ).toLowerCase();
    return bolsa.indexOf(texto) !== -1;
  });

  tbody.innerHTML = "";
  if (visibles.length === 0) {
    tbody.innerHTML = '<tr><td class="rep-vacio" colspan="6">No hay clientes para mostrar.</td></tr>';
    return;
  }

  visibles.forEach(function (item) {
    var fila = document.createElement("tr");
    fila.innerHTML =
      "<td><strong>" + escapar(item.cedula) + "</strong></td>" +
      "<td>" + escapar(item.nombre) + "</td>" +
      "<td>" + escapar(item.correo) + "</td>" +
      "<td>" + escapar(item.telefono) + "</td>" +
      "<td>" + escapar(item.direccion || "-") + "</td>" +
      '<td><div class="rep-fila-acciones">' +
      '<button type="button" class="rep-boton rep-boton-editar" data-accion="editar" data-id="' + escapar(item.id) + '">Editar</button>' +
      '<button type="button" class="rep-boton rep-boton-eliminar" data-accion="eliminar" data-id="' + escapar(item.id) + '">Eliminar</button>' +
      "</div></td>";
    tbody.appendChild(fila);
  });
}

function limpiarFormularioCliente() {
  document.getElementById("formCliente").reset();
  document.getElementById("clienteId").value = "";
  document.getElementById("btnGuardarCliente").textContent = "Registrar cliente";
  document.querySelectorAll(".is-valid, .is-invalid").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });
}

function marcarCampo(input, esValido) {
  input.classList.toggle("is-valid", esValido);
  input.classList.toggle("is-invalid", !esValido);
}

async function llamarClientes(ruta, opciones) {
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  var token = obtenerTokenPanther();
  if (token && ruta !== "useraction/login") {
    headers.Authorization = token;
    headers.keyAPI = token;
  }

  var bodySerializado = opciones && opciones.body ? JSON.stringify(opciones.body) : undefined;

  if (typeof window.pantherFetch === "function") {
    return window.pantherFetch(ruta, {
      method: (opciones && opciones.method) || "GET",
      headers: headers,
      body: bodySerializado
    });
  }

  var url = typeof window.construirUrlApiTaller === "function"
    ? window.construirUrlApiTaller(ruta)
    : API_CLIENTES + "/" + String(ruta || "").replace(/^\/+/, "");
  var respuesta = await fetch(url, {
    method: (opciones && opciones.method) || "GET",
    headers: headers,
    body: bodySerializado
  });
  var json = {};
  try {
    json = await respuesta.json();
  } catch (error) {
    json = {};
  }
  return { respuesta: respuesta, json: json };
}

function mensajeErrorConexion() {
  return "No hay conexión con el servidor del taller. Verifica que el servicio esté activo e intenta nuevamente.";
}

function mensajeApi(json) {
  if (!json) {
    return "El servidor no respondió.";
  }
  if (typeof json.data === "string" && json.data) {
    return json.data;
  }
  return "No fue posible completar la operación.";
}

function avisar(mensaje, tipo) {
  var aviso = document.getElementById("toastCliente");
  aviso.className = "rep-toast rep-toast-" + tipo;
  aviso.textContent = mensaje;
  aviso.hidden = false;
  window.clearTimeout(avisar.temporizador);
  avisar.temporizador = window.setTimeout(function () {
    aviso.hidden = true;
  }, 4500);
}

function escapar(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}