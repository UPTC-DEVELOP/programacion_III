var API_PROVEEDORES = typeof window.API_TALLER === "string" ? window.API_TALLER : "../backend/rest";
var CLAVE_PANTHER = "olimac_panther_token";
var CLAVE_PANTHER_USUARIO = "olimac_panther_user";
var listaProveedoresApi = [];

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("formProveedor");

  document.getElementById("nitProveedor").addEventListener("input", function () {
    marcarCampoProv(this, this.value.trim().length >= 5 && this.value.trim().length <= 25);
  });
  document.getElementById("nombreProveedor").addEventListener("input", function () {
    marcarCampoProv(this, this.value.trim().length > 0 && this.value.trim().length <= 120);
  });
  document.getElementById("telefonoProveedor").addEventListener("input", function () {
    marcarCampoProv(this, /^[0-9+\-\s]{7,20}$/.test(this.value.trim()));
  });
  document.getElementById("correoProveedor").addEventListener("input", function () {
    var val = this.value.trim();
    marcarCampoProv(this, val.length > 0 && val.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
  });
  document.getElementById("direccionProveedor").addEventListener("input", function () {
    marcarCampoProv(this, this.value.trim().length > 0 && this.value.trim().length <= 180);
  });

  document.getElementById("formSesionPanther").addEventListener("submit", entrarPantherProv);
  document.getElementById("btnCerrarSesionPanther").addEventListener("click", function () {
    cerrarSesionProv(true);
  });
  form.addEventListener("submit", guardarProveedor);
  document.getElementById("btnLimpiarProveedor").addEventListener("click", limpiarFormularioProveedor);
  document.getElementById("buscarProveedor").addEventListener("input", pintarTablaProveedores);
  document.getElementById("tablaProveedores").addEventListener("click", function (evento) {
    var boton = evento.target.closest("button");
    if (!boton) {
      return;
    }
    var id = boton.getAttribute("data-id");
    if (boton.getAttribute("data-accion") === "editar") {
      cargarParaEditarProveedor(id);
    }
    if (boton.getAttribute("data-accion") === "eliminar") {
      eliminarProveedor(id);
    }
  });

  actualizarVistaSesionProv();
  if (obtenerTokenProv()) {
    cargarProveedores();
  }
});

function obtenerTokenProv() {
  return sessionStorage.getItem(CLAVE_PANTHER) || "";
}

function obtenerUsuarioProv() {
  return sessionStorage.getItem(CLAVE_PANTHER_USUARIO) || "";
}

function guardarSesionProv(token, usuario) {
  sessionStorage.setItem(CLAVE_PANTHER, token);
  sessionStorage.setItem(CLAVE_PANTHER_USUARIO, usuario);
}

function limpiarStorageProv() {
  sessionStorage.removeItem(CLAVE_PANTHER);
  sessionStorage.removeItem(CLAVE_PANTHER_USUARIO);
}

async function entrarPantherProv(evento) {
  evento.preventDefault();
  var campoUsuario = document.getElementById("usuarioPanther");
  var campoContrasenia = document.getElementById("contraseniaPanther");
  var btnEntrar = document.getElementById("btnEntrarPanther");
  var usuario = campoUsuario.value.trim();
  var contrasenia = campoContrasenia.value;

  if (!usuario || !contrasenia) {
    avisarProv("Escriba su usuario y contraseña.", "aviso");
    (usuario ? campoContrasenia : campoUsuario).focus();
    return;
  }

  btnEntrar.disabled = true;
  try {
    var resultado = await llamarProveedores("useraction/login", {
      method: "POST",
      body: { user: usuario, password: contrasenia }
    });
    var token = resultado.json && resultado.json.data && resultado.json.data.keyAPI;
    var usuarioAutenticado = (resultado.json && resultado.json.data && resultado.json.data.user) || usuario;
    if (!resultado.respuesta.ok || !token) {
      avisarProv(mensajeApiProv(resultado.json) || "Usuario o contraseña incorrectos.", "error");
      return;
    }
    guardarSesionProv(token, usuarioAutenticado);
    campoUsuario.value = "";
    campoContrasenia.value = "";
    actualizarVistaSesionProv();
    avisarProv("Sesión iniciada correctamente.", "ok");
    await cargarProveedores();
  } catch (error) {
    avisarProv(mensajeErrorConexionProv(), "error");
  } finally {
    btnEntrar.disabled = false;
  }
}

function actualizarVistaSesionProv() {
  var activa = Boolean(obtenerTokenProv());
  var formLogin = document.getElementById("formSesionPanther");
  var barraActiva = document.getElementById("sesionActivaPanther");
  var etiquetaUsuario = document.getElementById("usuarioActivoPanther");
  var avisoBloqueo = document.getElementById("avisoBloqueoProveedores");
  var panelCrud = document.getElementById("panelCrudProveedores");

  formLogin.hidden = activa;
  barraActiva.hidden = !activa;
  avisoBloqueo.hidden = activa;
  panelCrud.hidden = !activa;
  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = activa ? obtenerUsuarioProv() : "";
  }
  panelCrud.querySelectorAll("input, button, select, textarea").forEach(function (control) {
    control.disabled = !activa;
  });
}

function cerrarSesionProv(notificar) {
  limpiarStorageProv();
  listaProveedoresApi = [];
  limpiarFormularioProveedor();
  document.getElementById("buscarProveedor").value = "";
  document.getElementById("tablaProveedores").innerHTML = "";
  actualizarVistaSesionProv();
  if (notificar) {
    avisarProv("Sesión cerrada.", "aviso");
  }
}

function esErrorAuthProv(resultado) {
  if (!resultado || !resultado.respuesta) {
    return false;
  }
  if (resultado.respuesta.status === 401 || resultado.respuesta.status === 403) {
    return true;
  }
  var texto = resultado.json && typeof resultado.json.data === "string" ? resultado.json.data.toLowerCase() : "";
  return resultado.respuesta.status === 400 && (texto.indexOf("authorization") !== -1 || texto.indexOf("keyapi") !== -1);
}

function listaDesdeRespuestaProv(resultado) {
  if (resultado.respuesta.status === 204) {
    return [];
  }
  if (resultado.respuesta.ok && Array.isArray(resultado.json.data)) {
    return resultado.json.data;
  }
  return null;
}

async function cargarProveedores() {
  if (!obtenerTokenProv()) {
    actualizarVistaSesionProv();
    return;
  }
  try {
    var resultado = await llamarProveedores("proveedores");
    if (esErrorAuthProv(resultado)) {
      cerrarSesionProv(false);
      avisarProv("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    var lista = listaDesdeRespuestaProv(resultado);
    if (lista === null) {
      avisarProv(mensajeApiProv(resultado.json), "error");
      return;
    }
    listaProveedoresApi = lista;
    pintarTablaProveedores();
  } catch (error) {
    avisarProv(mensajeErrorConexionProv(), "error");
  }
}

async function guardarProveedor(evento) {
  evento.preventDefault();
  if (!obtenerTokenProv()) {
    actualizarVistaSesionProv();
    avisarProv("Debes iniciar sesión antes de registrar o editar proveedores.", "aviso");
    return;
  }

  var nit = document.getElementById("nitProveedor").value.trim();
  var nombre = document.getElementById("nombreProveedor").value.trim();
  var telefono = document.getElementById("telefonoProveedor").value.trim();
  var correo = document.getElementById("correoProveedor").value.trim().toLowerCase();
  var direccion = document.getElementById("direccionProveedor").value.trim();
  var id = document.getElementById("proveedorId").value;

  if (
    nit.length < 5 ||
    nit.length > 25 ||
    nombre.length === 0 ||
    nombre.length > 120 ||
    !/^[0-9+\-\s]{7,20}$/.test(telefono) ||
    correo.length === 0 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
    direccion.length === 0 ||
    direccion.length > 180
  ) {
    avisarProv("Complete todos los campos con un formato válido.", "error");
    return;
  }

  var cuerpo = {
    nit: nit,
    nombre: nombre,
    telefono: telefono,
    correo: correo,
    direccion: direccion
  };
  var ruta = id ? "proveedores/" + encodeURIComponent(id) : "proveedores";
  var metodo = id ? "PUT" : "POST";

  try {
    var resultado = await llamarProveedores(ruta, { method: metodo, body: cuerpo });
    if (esErrorAuthProv(resultado)) {
      cerrarSesionProv(false);
      avisarProv("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarProv(mensajeApiProv(resultado.json), "error");
      return;
    }
    avisarProv(id ? "Proveedor actualizado." : "Proveedor registrado correctamente.", "ok");
    limpiarFormularioProveedor();
    await cargarProveedores();
  } catch (error) {
    avisarProv(mensajeErrorConexionProv(), "error");
  }
}

function cargarParaEditarProveedor(id) {
  var proveedor = listaProveedoresApi.find(function (item) {
    return String(item.id) === String(id);
  });
  if (!proveedor) {
    return;
  }
  document.getElementById("proveedorId").value = proveedor.id;
  document.getElementById("nitProveedor").value = proveedor.nit || "";
  document.getElementById("nombreProveedor").value = proveedor.nombre || "";
  document.getElementById("telefonoProveedor").value = proveedor.telefono || "";
  document.getElementById("correoProveedor").value = proveedor.correo || "";
  document.getElementById("direccionProveedor").value = proveedor.direccion || "";
  document.getElementById("btnGuardarProveedor").textContent = "Actualizar proveedor";
}

async function eliminarProveedor(id) {
  if (!obtenerTokenProv()) {
    actualizarVistaSesionProv();
    avisarProv("Debes iniciar sesión para eliminar proveedores.", "aviso");
    return;
  }
  if (!window.confirm("¿Está seguro de eliminar este proveedor?")) {
    return;
  }
  try {
    var resultado = await llamarProveedores("proveedores/" + encodeURIComponent(id), { method: "DELETE" });
    if (esErrorAuthProv(resultado)) {
      cerrarSesionProv(false);
      avisarProv("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarProv(mensajeApiProv(resultado.json), "error");
      return;
    }
    avisarProv("Proveedor eliminado.", "aviso");
    limpiarFormularioProveedor();
    await cargarProveedores();
  } catch (error) {
    avisarProv(mensajeErrorConexionProv(), "error");
  }
}

function pintarTablaProveedores() {
  var tbody = document.getElementById("tablaProveedores");
  if (!obtenerTokenProv()) {
    tbody.innerHTML = "";
    return;
  }
  var texto = document.getElementById("buscarProveedor").value.trim().toLowerCase();
  var visibles = listaProveedoresApi.filter(function (item) {
    var bolsa = (
      (item.nit || "") + " " +
      (item.nombre || "") + " " +
      (item.telefono || "") + " " +
      (item.correo || "") + " " +
      (item.direccion || "")
    ).toLowerCase();
    return bolsa.indexOf(texto) !== -1;
  });

  tbody.innerHTML = "";
  if (visibles.length === 0) {
    tbody.innerHTML = '<tr><td class="rep-vacio" colspan="6">No hay proveedores para mostrar.</td></tr>';
    return;
  }

  visibles.forEach(function (item) {
    var fila = document.createElement("tr");
    fila.innerHTML =
      "<td><strong>" + escaparProv(item.nit) + "</strong></td>" +
      "<td>" + escaparProv(item.nombre) + "</td>" +
      "<td>" + escaparProv(item.telefono) + "</td>" +
      "<td>" + escaparProv(item.correo) + "</td>" +
      "<td>" + escaparProv(item.direccion) + "</td>" +
      '<td><div class="rep-fila-acciones">' +
      '<button type="button" class="rep-boton rep-boton-editar" data-accion="editar" data-id="' + escaparProv(item.id) + '">Editar</button>' +
      '<button type="button" class="rep-boton rep-boton-eliminar" data-accion="eliminar" data-id="' + escaparProv(item.id) + '">Eliminar</button>' +
      "</div></td>";
    tbody.appendChild(fila);
  });
}

function limpiarFormularioProveedor() {
  document.getElementById("formProveedor").reset();
  document.getElementById("proveedorId").value = "";
  document.getElementById("btnGuardarProveedor").textContent = "Registrar proveedor";
  document.querySelectorAll(".is-valid, .is-invalid").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });
}

function marcarCampoProv(input, esValido) {
  input.classList.toggle("is-valid", esValido);
  input.classList.toggle("is-invalid", !esValido);
}

async function llamarProveedores(ruta, opciones) {
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  var token = obtenerTokenProv();
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
    : API_PROVEEDORES + "/" + String(ruta || "").replace(/^\/+/, "");
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

function mensajeErrorConexionProv() {
  return "No hay conexión con el servidor del taller. Verifica que el servicio esté activo e intenta nuevamente.";
}

function mensajeApiProv(json) {
  if (!json) {
    return "El servidor no respondió.";
  }
  if (typeof json.data === "string" && json.data) {
    return json.data;
  }
  return "No fue posible completar la operación.";
}

function avisarProv(mensaje, tipo) {
  var aviso = document.getElementById("toastProveedor");
  aviso.className = "rep-toast rep-toast-" + tipo;
  aviso.textContent = mensaje;
  aviso.hidden = false;
  window.clearTimeout(avisarProv.temporizador);
  avisarProv.temporizador = window.setTimeout(function () {
    aviso.hidden = true;
  }, 4500);
}

function escaparProv(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
