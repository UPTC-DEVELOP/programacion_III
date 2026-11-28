var API_VEHICULOS = typeof window.API_TALLER === "string" ? window.API_TALLER : "../backend/rest";
var CLAVE_PANTHER = "olimac_panther_token";
var CLAVE_PANTHER_USUARIO = "olimac_panther_user";
var listaVehiculosApi = [];
var catalogoClientesVeh = [];

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("formVehiculo");

  document.getElementById("placaVehiculo").addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    marcarCampoVeh(this, /^[A-Z0-9-]{5,15}$/.test(this.value.trim()));
  });
  document.getElementById("marcaVehiculo").addEventListener("input", function () {
    marcarCampoVeh(this, this.value.trim().length > 0 && this.value.trim().length <= 60);
  });
  document.getElementById("modeloVehiculo").addEventListener("input", function () {
    marcarCampoVeh(this, this.value.trim().length > 0 && this.value.trim().length <= 60);
  });
  document.getElementById("colorVehiculo").addEventListener("input", function () {
    marcarCampoVeh(this, this.value.trim().length > 0 && this.value.trim().length <= 40);
  });
  document.getElementById("tipoVehiculo").addEventListener("change", function () {
    marcarCampoVeh(this, this.value !== "");
  });
  document.getElementById("clienteVehiculo").addEventListener("change", function () {
    marcarCampoVeh(this, this.value !== "");
  });

  document.getElementById("formSesionPanther").addEventListener("submit", entrarPantherVeh);
  document.getElementById("btnCerrarSesionPanther").addEventListener("click", function () {
    cerrarSesionVeh(true);
  });
  form.addEventListener("submit", guardarVehiculo);
  document.getElementById("btnLimpiarVehiculo").addEventListener("click", limpiarFormularioVehiculo);
  document.getElementById("buscarVehiculo").addEventListener("input", pintarTablaVehiculos);
  document.getElementById("tablaVehiculos").addEventListener("click", function (evento) {
    var boton = evento.target.closest("button");
    if (!boton) {
      return;
    }
    var id = boton.getAttribute("data-id");
    if (boton.getAttribute("data-accion") === "editar") {
      cargarParaEditarVehiculo(id);
    }
    if (boton.getAttribute("data-accion") === "eliminar") {
      eliminarVehiculo(id);
    }
  });

  actualizarVistaSesionVeh();
  if (obtenerTokenVeh()) {
    cargarDatosVehiculos();
  }
});

function obtenerTokenVeh() {
  return sessionStorage.getItem(CLAVE_PANTHER) || "";
}

function obtenerUsuarioVeh() {
  return sessionStorage.getItem(CLAVE_PANTHER_USUARIO) || "";
}

function guardarSesionVeh(token, usuario) {
  sessionStorage.setItem(CLAVE_PANTHER, token);
  sessionStorage.setItem(CLAVE_PANTHER_USUARIO, usuario);
}

function limpiarStorageVeh() {
  sessionStorage.removeItem(CLAVE_PANTHER);
  sessionStorage.removeItem(CLAVE_PANTHER_USUARIO);
}

async function entrarPantherVeh(evento) {
  evento.preventDefault();
  var campoUsuario = document.getElementById("usuarioPanther");
  var campoContrasenia = document.getElementById("contraseniaPanther");
  var btnEntrar = document.getElementById("btnEntrarPanther");
  var usuario = campoUsuario.value.trim();
  var contrasenia = campoContrasenia.value;

  if (!usuario || !contrasenia) {
    avisarVeh("Escriba su usuario y contraseña.", "aviso");
    (usuario ? campoContrasenia : campoUsuario).focus();
    return;
  }

  btnEntrar.disabled = true;
  try {
    var resultado = await llamarVehiculos("useraction/login", {
      method: "POST",
      body: { user: usuario, password: contrasenia }
    });
    var token = resultado.json && resultado.json.data && resultado.json.data.keyAPI;
    var usuarioAutenticado = (resultado.json && resultado.json.data && resultado.json.data.user) || usuario;
    if (!resultado.respuesta.ok || !token) {
      avisarVeh(mensajeApiVeh(resultado.json) || "Usuario o contraseña incorrectos.", "error");
      return;
    }
    guardarSesionVeh(token, usuarioAutenticado);
    campoUsuario.value = "";
    campoContrasenia.value = "";
    actualizarVistaSesionVeh();
    avisarVeh("Sesión iniciada correctamente.", "ok");
    await cargarDatosVehiculos();
  } catch (error) {
    avisarVeh(mensajeErrorConexionVeh(), "error");
  } finally {
    btnEntrar.disabled = false;
  }
}

function actualizarVistaSesionVeh() {
  var activa = Boolean(obtenerTokenVeh());
  var formLogin = document.getElementById("formSesionPanther");
  var barraActiva = document.getElementById("sesionActivaPanther");
  var etiquetaUsuario = document.getElementById("usuarioActivoPanther");
  var avisoBloqueo = document.getElementById("avisoBloqueoVehiculos");
  var panelCrud = document.getElementById("panelCrudVehiculos");

  formLogin.hidden = activa;
  barraActiva.hidden = !activa;
  avisoBloqueo.hidden = activa;
  panelCrud.hidden = !activa;
  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = activa ? obtenerUsuarioVeh() : "";
  }
  panelCrud.querySelectorAll("input, button, select, textarea").forEach(function (control) {
    control.disabled = !activa;
  });
}

function cerrarSesionVeh(notificar) {
  limpiarStorageVeh();
  listaVehiculosApi = [];
  catalogoClientesVeh = [];
  limpiarFormularioVehiculo();
  document.getElementById("buscarVehiculo").value = "";
  document.getElementById("tablaVehiculos").innerHTML = "";
  document.getElementById("clienteVehiculo").innerHTML = '<option value="">Seleccione un cliente</option>';
  actualizarVistaSesionVeh();
  if (notificar) {
    avisarVeh("Sesión cerrada.", "aviso");
  }
}

function esErrorAuthVeh(resultado) {
  if (!resultado || !resultado.respuesta) {
    return false;
  }
  if (resultado.respuesta.status === 401 || resultado.respuesta.status === 403) {
    return true;
  }
  var texto = resultado.json && typeof resultado.json.data === "string" ? resultado.json.data.toLowerCase() : "";
  return resultado.respuesta.status === 400 && (texto.indexOf("authorization") !== -1 || texto.indexOf("keyapi") !== -1);
}

function listaDesdeRespuestaVeh(resultado) {
  if (resultado.respuesta.status === 204) {
    return [];
  }
  if (resultado.respuesta.ok && Array.isArray(resultado.json.data)) {
    return resultado.json.data;
  }
  return null;
}

async function cargarDatosVehiculos() {
  if (!obtenerTokenVeh()) {
    actualizarVistaSesionVeh();
    return;
  }
  try {
    var resultados = await Promise.all([
      llamarVehiculos("clientes"),
      llamarVehiculos("vehiculos")
    ]);
    var resClientes = resultados[0];
    var resVehiculos = resultados[1];

    if (esErrorAuthVeh(resClientes) || esErrorAuthVeh(resVehiculos)) {
      cerrarSesionVeh(false);
      avisarVeh("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }

    var clientes = listaDesdeRespuestaVeh(resClientes);
    if (clientes === null && resClientes.respuesta.ok) {
      clientes = Array.isArray(resClientes.json.data) ? resClientes.json.data : [];
    }
    if (clientes === null) {
      avisarVeh(mensajeApiVeh(resClientes.json) || "No fue posible cargar clientes.", "error");
      return;
    }
    catalogoClientesVeh = clientes;
    llenarSelectClientesVeh();

    var vehiculos = listaDesdeRespuestaVeh(resVehiculos);
    if (vehiculos === null) {
      avisarVeh(mensajeApiVeh(resVehiculos.json), "error");
      return;
    }
    listaVehiculosApi = vehiculos;
    pintarTablaVehiculos();
  } catch (error) {
    avisarVeh(mensajeErrorConexionVeh(), "error");
  }
}

function llenarSelectClientesVeh(clienteSeleccionado) {
  var select = document.getElementById("clienteVehiculo");
  var valorActual = clienteSeleccionado != null ? String(clienteSeleccionado) : select.value;
  select.innerHTML = '<option value="">Seleccione un cliente</option>';
  catalogoClientesVeh.forEach(function (cliente) {
    var opcion = document.createElement("option");
    opcion.value = cliente.id;
    opcion.textContent = (cliente.nombre || "") + " - " + (cliente.cedula || "");
    select.appendChild(opcion);
  });
  if (valorActual) {
    select.value = valorActual;
  }
}

function nombreClientePorId(clienteId) {
  var encontrado = catalogoClientesVeh.find(function (item) {
    return String(item.id) === String(clienteId);
  });
  if (!encontrado) {
    return clienteId ? "#" + clienteId : "-";
  }
  return (encontrado.nombre || "") + " (" + (encontrado.cedula || "") + ")";
}

async function guardarVehiculo(evento) {
  evento.preventDefault();
  if (!obtenerTokenVeh()) {
    actualizarVistaSesionVeh();
    avisarVeh("Debes iniciar sesión antes de registrar o editar vehículos.", "aviso");
    return;
  }

  var placa = document.getElementById("placaVehiculo").value.trim().toUpperCase();
  var marca = document.getElementById("marcaVehiculo").value.trim();
  var modelo = document.getElementById("modeloVehiculo").value.trim();
  var color = document.getElementById("colorVehiculo").value.trim();
  var tipo = document.getElementById("tipoVehiculo").value.trim();
  var clienteId = document.getElementById("clienteVehiculo").value.trim();
  var id = document.getElementById("vehiculoId").value;

  if (
    !/^[A-Z0-9-]{5,15}$/.test(placa) ||
    marca.length === 0 ||
    marca.length > 60 ||
    modelo.length === 0 ||
    modelo.length > 60 ||
    color.length === 0 ||
    color.length > 40 ||
    tipo === "" ||
    !/^\d+$/.test(clienteId)
  ) {
    avisarVeh("Complete todos los campos con un formato válido.", "error");
    return;
  }

  var cuerpo = {
    placa: placa,
    marca: marca,
    modelo: modelo,
    color: color,
    tipo: tipo,
    cliente_id: Number(clienteId)
  };
  var ruta = id ? "vehiculos/" + encodeURIComponent(id) : "vehiculos";
  var metodo = id ? "PUT" : "POST";

  try {
    var resultado = await llamarVehiculos(ruta, { method: metodo, body: cuerpo });
    if (esErrorAuthVeh(resultado)) {
      cerrarSesionVeh(false);
      avisarVeh("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarVeh(mensajeApiVeh(resultado.json), "error");
      return;
    }
    avisarVeh(id ? "Vehículo actualizado." : "Vehículo registrado correctamente.", "ok");
    limpiarFormularioVehiculo();
    await cargarDatosVehiculos();
  } catch (error) {
    avisarVeh(mensajeErrorConexionVeh(), "error");
  }
}

function cargarParaEditarVehiculo(id) {
  var vehiculo = listaVehiculosApi.find(function (item) {
    return String(item.id) === String(id);
  });
  if (!vehiculo) {
    return;
  }
  document.getElementById("vehiculoId").value = vehiculo.id;
  document.getElementById("placaVehiculo").value = vehiculo.placa || "";
  document.getElementById("marcaVehiculo").value = vehiculo.marca || "";
  document.getElementById("modeloVehiculo").value = vehiculo.modelo || "";
  document.getElementById("colorVehiculo").value = vehiculo.color || "";
  document.getElementById("tipoVehiculo").value = vehiculo.tipo || "";
  llenarSelectClientesVeh(vehiculo.cliente_id);
  document.getElementById("btnGuardarVehiculo").textContent = "Actualizar vehículo";
}

async function eliminarVehiculo(id) {
  if (!obtenerTokenVeh()) {
    actualizarVistaSesionVeh();
    avisarVeh("Debes iniciar sesión para eliminar vehículos.", "aviso");
    return;
  }
  if (!window.confirm("¿Está seguro de eliminar este vehículo?")) {
    return;
  }
  try {
    var resultado = await llamarVehiculos("vehiculos/" + encodeURIComponent(id), { method: "DELETE" });
    if (esErrorAuthVeh(resultado)) {
      cerrarSesionVeh(false);
      avisarVeh("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarVeh(mensajeApiVeh(resultado.json), "error");
      return;
    }
    avisarVeh("Vehículo eliminado.", "aviso");
    limpiarFormularioVehiculo();
    await cargarDatosVehiculos();
  } catch (error) {
    avisarVeh(mensajeErrorConexionVeh(), "error");
  }
}

function pintarTablaVehiculos() {
  var tbody = document.getElementById("tablaVehiculos");
  if (!obtenerTokenVeh()) {
    tbody.innerHTML = "";
    return;
  }
  var texto = document.getElementById("buscarVehiculo").value.trim().toLowerCase();
  var visibles = listaVehiculosApi.filter(function (item) {
    var clienteTxt = nombreClientePorId(item.cliente_id);
    var bolsa = (
      (item.placa || "") + " " +
      (item.marca || "") + " " +
      (item.modelo || "") + " " +
      (item.color || "") + " " +
      (item.tipo || "") + " " +
      clienteTxt
    ).toLowerCase();
    return bolsa.indexOf(texto) !== -1;
  });

  tbody.innerHTML = "";
  if (visibles.length === 0) {
    tbody.innerHTML = '<tr><td class="rep-vacio" colspan="7">No hay vehículos para mostrar.</td></tr>';
    return;
  }

  visibles.forEach(function (item) {
    var fila = document.createElement("tr");
    fila.innerHTML =
      "<td><strong>" + escaparVeh(item.placa) + "</strong></td>" +
      "<td>" + escaparVeh(item.marca) + "</td>" +
      "<td>" + escaparVeh(item.modelo) + "</td>" +
      "<td>" + escaparVeh(item.color) + "</td>" +
      "<td>" + escaparVeh(item.tipo) + "</td>" +
      "<td>" + escaparVeh(nombreClientePorId(item.cliente_id)) + "</td>" +
      '<td><div class="rep-fila-acciones">' +
      '<button type="button" class="rep-boton rep-boton-editar" data-accion="editar" data-id="' + escaparVeh(item.id) + '">Editar</button>' +
      '<button type="button" class="rep-boton rep-boton-eliminar" data-accion="eliminar" data-id="' + escaparVeh(item.id) + '">Eliminar</button>' +
      "</div></td>";
    tbody.appendChild(fila);
  });
}

function limpiarFormularioVehiculo() {
  document.getElementById("formVehiculo").reset();
  document.getElementById("vehiculoId").value = "";
  document.getElementById("btnGuardarVehiculo").textContent = "Registrar vehículo";
  llenarSelectClientesVeh("");
  document.querySelectorAll(".is-valid, .is-invalid").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });
}

function marcarCampoVeh(input, esValido) {
  input.classList.toggle("is-valid", esValido);
  input.classList.toggle("is-invalid", !esValido);
}

async function llamarVehiculos(ruta, opciones) {
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  var token = obtenerTokenVeh();
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
    : API_VEHICULOS + "/" + String(ruta || "").replace(/^\/+/, "");
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

function mensajeErrorConexionVeh() {
  return "No hay conexión con el servidor del taller. Verifica que el servicio esté activo e intenta nuevamente.";
}

function mensajeApiVeh(json) {
  if (!json) {
    return "El servidor no respondió.";
  }
  if (typeof json.data === "string" && json.data) {
    return json.data;
  }
  return "No fue posible completar la operación.";
}

function avisarVeh(mensaje, tipo) {
  var aviso = document.getElementById("toastVehiculo");
  aviso.className = "rep-toast rep-toast-" + tipo;
  aviso.textContent = mensaje;
  aviso.hidden = false;
  window.clearTimeout(avisarVeh.temporizador);
  avisarVeh.temporizador = window.setTimeout(function () {
    aviso.hidden = true;
  }, 4500);
}

function escaparVeh(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
