var API_REPUESTOS = typeof window.API_TALLER === "string" ? window.API_TALLER : "../backend/rest";
var CLAVE_PANTHER = "olimac_panther_token";
var CLAVE_PANTHER_USUARIO = "olimac_panther_user";
var CLAVE_PANTHER_LOGOUT_LEGACY = "olimac_panther_logout_manual";
var listaRepuestosApi = [];

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("formRepuesto");
  var buscar = document.getElementById("buscarRepuesto");
  var referencia = document.getElementById("referenciaRepuesto");
  var descripcion = document.getElementById("descripcionRepuesto");
  var marca = document.getElementById("marcaRepuesto");
  var precio = document.getElementById("precioRepuesto");

  referencia.addEventListener("input", function () {
    this.value = this.value.toUpperCase();
    marcarCampo(this, /^[A-Z0-9-]{3,20}$/.test(this.value));
  });
  descripcion.addEventListener("input", function () {
    marcarCampo(this, this.value.trim().length > 0 && this.value.trim().length <= 150);
  });
  marca.addEventListener("input", function () {
    marcarCampo(this, this.value.trim().length > 0 && this.value.trim().length <= 50);
  });
  precio.addEventListener("input", function () {
    marcarCampo(this, /^\d+(\.\d{1,2})?$/.test(this.value) && Number(this.value) > 0);
  });

  document.getElementById("formSesionPanther").addEventListener("submit", entrarPanther);
  document.getElementById("btnCerrarSesionPanther").addEventListener("click", function () {
    cerrarSesionPanther(true);
  });
  form.addEventListener("submit", guardarRepuesto);
  document.getElementById("btnLimpiarRepuesto").addEventListener("click", limpiarFormularioRepuesto);
  buscar.addEventListener("input", pintarTabla);
  document.getElementById("tablaRepuestos").addEventListener("click", function (evento) {
    var boton = evento.target.closest("button");
    if (!boton) {
      return;
    }
    var id = boton.getAttribute("data-id");
    if (boton.getAttribute("data-accion") === "editar") {
      cargarParaEditar(id);
    }
    if (boton.getAttribute("data-accion") === "eliminar") {
      eliminarRepuesto(id);
    }
  });

  // Limpiar bandera heredada si existía
  sessionStorage.removeItem(CLAVE_PANTHER_LOGOUT_LEGACY);

  // Sin auto-login: si no existe un token guardado por el usuario, inicia CERRADA
  actualizarVistaSesion();
  if (obtenerTokenPanther()) {
    cargarRepuestos();
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
    var resultado = await llamarRepuestos("useraction/login", {
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
    await cargarRepuestos();
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
  var avisoBloqueo = document.getElementById("avisoBloqueoRepuestos");
  var panelCrud = document.getElementById("panelCrudRepuestos");

  // Cuando hay sesión activa: ocultar formulario login + aviso y mostrar barra de sesión + CRUD
  // Cuando NO hay sesión: mostrar formulario login + aviso y ocultar barra de sesión + CRUD
  formLogin.hidden = activa;
  barraActiva.hidden = !activa;
  avisoBloqueo.hidden = activa;
  panelCrud.hidden = !activa;

  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = activa ? usuario : "";
  }

  // Habilitar / deshabilitar controles del CRUD como resguardo adicional
  var controlesCrud = panelCrud.querySelectorAll("input, button, select, textarea");
  controlesCrud.forEach(function (control) {
    control.disabled = !activa;
  });
}

function cerrarSesionPanther(notificar) {
  limpiarStoragePanther();
  listaRepuestosApi = [];
  limpiarFormularioRepuesto();
  document.getElementById("buscarRepuesto").value = "";
  document.getElementById("tablaRepuestos").innerHTML = "";
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

async function cargarRepuestos() {
  if (!obtenerTokenPanther()) {
    actualizarVistaSesion();
    return;
  }
  try {
    var resultado = await llamarRepuestos("repuestos");
    if (esErrorAutenticacion(resultado)) {
      cerrarSesionPanther(false);
      avisar("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisar(mensajeApi(resultado.json), "error");
      return;
    }
    listaRepuestosApi = Array.isArray(resultado.json.data) ? resultado.json.data : [];
    reflejarCatalogoLocal();
    pintarTabla();
  } catch (error) {
    avisar(mensajeErrorConexion(), "error");
  }
}

async function guardarRepuesto(evento) {
  evento.preventDefault();
  if (!obtenerTokenPanther()) {
    actualizarVistaSesion();
    avisar("Debes iniciar sesión antes de registrar o editar repuestos.", "aviso");
    return;
  }

  var referencia = document.getElementById("referenciaRepuesto").value.trim().toUpperCase();
  var descripcion = document.getElementById("descripcionRepuesto").value.trim();
  var marca = document.getElementById("marcaRepuesto").value.trim();
  var precio = document.getElementById("precioRepuesto").value.trim();
  var id = document.getElementById("repuestoId").value;

  if (!/^[A-Z0-9-]{3,20}$/.test(referencia) || descripcion.length === 0 || descripcion.length > 150 || marca.length === 0 || marca.length > 50 || !/^\d+(\.\d{1,2})?$/.test(precio) || Number(precio) <= 0) {
    avisar("Complete todos los campos con un formato válido.", "error");
    return;
  }

  var repetida = listaRepuestosApi.some(function (item) {
    return item.referencia === referencia && String(item.id) !== String(id);
  });
  if (repetida) {
    avisar("Esa referencia ya se encuentra registrada.", "aviso");
    return;
  }

  var cuerpo = {
    referencia: referencia,
    descripcion: descripcion,
    marca: marca,
    precio: Number(precio)
  };
  var ruta = id ? "repuestos/" + encodeURIComponent(id) : "repuestos";
  var metodo = id ? "PUT" : "POST";

  try {
    var resultado = await llamarRepuestos(ruta, { method: metodo, body: cuerpo });
    if (esErrorAutenticacion(resultado)) {
      cerrarSesionPanther(false);
      avisar("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisar(mensajeApi(resultado.json), "error");
      return;
    }
    avisar(id ? "Repuesto actualizado." : "Repuesto registrado correctamente.", "ok");
    limpiarFormularioRepuesto();
    await cargarRepuestos();
  } catch (error) {
    avisar(mensajeErrorConexion(), "error");
  }
}

function cargarParaEditar(id) {
  var repuesto = listaRepuestosApi.find(function (item) {
    return String(item.id) === String(id);
  });
  if (!repuesto) {
    return;
  }
  document.getElementById("repuestoId").value = repuesto.id;
  document.getElementById("referenciaRepuesto").value = repuesto.referencia;
  document.getElementById("descripcionRepuesto").value = repuesto.descripcion;
  document.getElementById("marcaRepuesto").value = repuesto.marca;
  document.getElementById("precioRepuesto").value = Number(repuesto.precio);
  document.getElementById("btnGuardarRepuesto").textContent = "Actualizar repuesto";
}

async function eliminarRepuesto(id) {
  if (!obtenerTokenPanther()) {
    actualizarVistaSesion();
    avisar("Debes iniciar sesión para eliminar repuestos.", "aviso");
    return;
  }
  if (!window.confirm("¿Está seguro de eliminar este repuesto?")) {
    return;
  }
  try {
    var resultado = await llamarRepuestos("repuestos/" + encodeURIComponent(id), { method: "DELETE" });
    if (esErrorAutenticacion(resultado)) {
      cerrarSesionPanther(false);
      avisar("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisar(mensajeApi(resultado.json), "error");
      return;
    }
    avisar("Repuesto eliminado.", "aviso");
    limpiarFormularioRepuesto();
    await cargarRepuestos();
  } catch (error) {
    avisar(mensajeErrorConexion(), "error");
  }
}

function pintarTabla() {
  var tbody = document.getElementById("tablaRepuestos");
  if (!obtenerTokenPanther()) {
    tbody.innerHTML = "";
    return;
  }

  var texto = document.getElementById("buscarRepuesto").value.trim().toLowerCase();
  var visibles = listaRepuestosApi.filter(function (item) {
    var bolsa = (item.referencia + " " + item.descripcion + " " + item.marca).toLowerCase();
    return bolsa.indexOf(texto) !== -1;
  });

  tbody.innerHTML = "";
  if (visibles.length === 0) {
    tbody.innerHTML = '<tr><td class="rep-vacio" colspan="5">No hay repuestos para mostrar.</td></tr>';
    return;
  }

  visibles.forEach(function (item) {
    var fila = document.createElement("tr");
    fila.innerHTML =
      "<td><strong>" + escapar(item.referencia) + "</strong></td>" +
      "<td>" + escapar(item.descripcion) + "</td>" +
      "<td>" + escapar(item.marca) + "</td>" +
      "<td>" + Number(item.precio).toLocaleString("es-CO") + "</td>" +
      '<td><div class="rep-fila-acciones">' +
      '<button type="button" class="rep-boton rep-boton-editar" data-accion="editar" data-id="' + escapar(item.id) + '">Editar</button>' +
      '<button type="button" class="rep-boton rep-boton-eliminar" data-accion="eliminar" data-id="' + escapar(item.id) + '">Eliminar</button>' +
      "</div></td>";
    tbody.appendChild(fila);
  });
}

function limpiarFormularioRepuesto() {
  document.getElementById("formRepuesto").reset();
  document.getElementById("repuestoId").value = "";
  document.getElementById("btnGuardarRepuesto").textContent = "Registrar repuesto";
  document.querySelectorAll(".is-valid, .is-invalid").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });
}

function marcarCampo(input, esValido) {
  input.classList.toggle("is-valid", esValido);
  input.classList.toggle("is-invalid", !esValido);
}

function reflejarCatalogoLocal() {
  if (typeof guardarRepuestos !== "function") {
    return;
  }
  guardarRepuestos(listaRepuestosApi.map(function (item) {
    return {
      referencia: item.referencia,
      descripcion: item.descripcion,
      marca: item.marca,
      precio: Number(item.precio)
    };
  }));
}

async function llamarRepuestos(ruta, opciones) {
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
    : API_REPUESTOS + "/" + String(ruta || "").replace(/^\/+/, "");
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
  var aviso = document.getElementById("toastRepuesto");
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
