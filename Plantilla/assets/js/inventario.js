var API_INVENTARIO_BASE = typeof window.API_TALLER === "string" ? window.API_TALLER : "../backend/rest";
var CLAVE_TOKEN_TALLER = "olimac_panther_token";
var CLAVE_USUARIO_TALLER = "olimac_panther_user";

var listaInventarioApi = [];
var catalogoRepuestosApi = [];

document.addEventListener("DOMContentLoaded", function () {
  var formSesion = document.getElementById("formSesionInventario");
  var btnCerrarSesion = document.getElementById("btnCerrarSesionInventario");
  var formInventario = document.getElementById("formInventario");
  var selectRepuesto = document.getElementById("repuestoInventario");
  var inputStock = document.getElementById("stockInventario");
  var inputStockMinimo = document.getElementById("stockMinimoInventario");
  var inputUbicacion = document.getElementById("ubicacionInventario");
  var btnLimpiar = document.getElementById("btnLimpiarInventario");
  var inputBuscar = document.getElementById("buscarInventario");
  var selectFiltroEstado = document.getElementById("filtroEstadoInventario");
  var tbody = document.getElementById("tablaInventario");

  formSesion.addEventListener("submit", iniciarSesionInventario);
  btnCerrarSesion.addEventListener("click", function () {
    cerrarSesionInventario(true);
  });

  selectRepuesto.addEventListener("change", function () {
    actualizarDetalleRepuestoSeleccionado();
    marcarCampoInv(this, this.value !== "");
  });

  inputStock.addEventListener("input", function () {
    marcarCampoInv(this, /^\d+$/.test(this.value.trim()));
  });

  inputStockMinimo.addEventListener("input", function () {
    marcarCampoInv(this, /^\d+$/.test(this.value.trim()));
  });

  inputUbicacion.addEventListener("input", function () {
    marcarCampoInv(this, this.value.trim().length <= 60);
  });

  formInventario.addEventListener("submit", guardarInventario);
  btnLimpiar.addEventListener("click", limpiarFormularioInventario);
  inputBuscar.addEventListener("input", pintarTablaInventario);
  selectFiltroEstado.addEventListener("change", pintarTablaInventario);

  tbody.addEventListener("click", function (evento) {
    var boton = evento.target.closest("button");
    if (!boton) {
      return;
    }
    var id = boton.getAttribute("data-id");
    var accion = boton.getAttribute("data-accion");
    if (accion === "editar") {
      cargarParaEditarInventario(id);
    }
    if (accion === "eliminar") {
      eliminarInventario(id);
    }
  });

  actualizarVistaSesionInventario();
  if (obtenerTokenInventario()) {
    cargarDatosInventario();
  }
});

function obtenerTokenInventario() {
  return sessionStorage.getItem(CLAVE_TOKEN_TALLER) || "";
}

function obtenerUsuarioInventario() {
  return sessionStorage.getItem(CLAVE_USUARIO_TALLER) || "";
}

function guardarSesionInventario(token, usuario) {
  sessionStorage.setItem(CLAVE_TOKEN_TALLER, token);
  sessionStorage.setItem(CLAVE_USUARIO_TALLER, usuario);
}

function limpiarSesionInventario() {
  sessionStorage.removeItem(CLAVE_TOKEN_TALLER);
  sessionStorage.removeItem(CLAVE_USUARIO_TALLER);
}

async function iniciarSesionInventario(evento) {
  evento.preventDefault();
  var campoUsuario = document.getElementById("usuarioInventario");
  var campoContrasenia = document.getElementById("contraseniaInventario");
  var btnEntrar = document.getElementById("btnEntrarInventario");
  var usuario = campoUsuario.value.trim();
  var contrasenia = campoContrasenia.value;

  if (!usuario || !contrasenia) {
    avisarInventario("Escriba su usuario y contraseña.", "aviso");
    (usuario ? campoContrasenia : campoUsuario).focus();
    return;
  }

  btnEntrar.disabled = true;
  try {
    var resultado = await llamarApiInventario("useraction/login", {
      method: "POST",
      body: { user: usuario, password: contrasenia }
    });
    var token = resultado.json && resultado.json.data && resultado.json.data.keyAPI;
    var usuarioAutenticado = (resultado.json && resultado.json.data && resultado.json.data.user) || usuario;
    if (!resultado.respuesta.ok || !token) {
      avisarInventario(mensajeApiInv(resultado.json) || "Usuario o contraseña incorrectos.", "error");
      return;
    }

    guardarSesionInventario(token, usuarioAutenticado);
    campoUsuario.value = "";
    campoContrasenia.value = "";
    actualizarVistaSesionInventario();
    avisarInventario("Sesión iniciada correctamente.", "ok");
    await cargarDatosInventario();
  } catch (error) {
    avisarInventario(mensajeErrorConexionInv(), "error");
  } finally {
    btnEntrar.disabled = false;
  }
}

function actualizarVistaSesionInventario() {
  var activa = Boolean(obtenerTokenInventario());
  var usuario = obtenerUsuarioInventario();

  var formLogin = document.getElementById("formSesionInventario");
  var barraActiva = document.getElementById("sesionActivaInventario");
  var etiquetaUsuario = document.getElementById("usuarioActivoInventario");
  var avisoBloqueo = document.getElementById("avisoBloqueoInventario");
  var panelCrud = document.getElementById("panelCrudInventario");

  formLogin.hidden = activa;
  barraActiva.hidden = !activa;
  avisoBloqueo.hidden = activa;
  panelCrud.hidden = !activa;

  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = activa ? usuario : "";
  }

  panelCrud.querySelectorAll("input, button, select, textarea").forEach(function (control) {
    control.disabled = !activa;
  });
}

function cerrarSesionInventario(notificar) {
  limpiarSesionInventario();
  listaInventarioApi = [];
  catalogoRepuestosApi = [];
  limpiarFormularioInventario();
  document.getElementById("buscarInventario").value = "";
  document.getElementById("filtroEstadoInventario").value = "";
  document.getElementById("tablaInventario").innerHTML = "";
  document.getElementById("usuarioInventario").value = "";
  document.getElementById("contraseniaInventario").value = "";
  actualizarVistaSesionInventario();
  if (notificar) {
    avisarInventario("Sesión cerrada.", "aviso");
  }
  document.getElementById("usuarioInventario").focus();
}

function esErrorAutenticacionInv(resultado) {
  if (!resultado || !resultado.respuesta) {
    return false;
  }
  if (resultado.respuesta.status === 401 || resultado.respuesta.status === 403) {
    return true;
  }
  var texto = resultado.json && typeof resultado.json.data === "string" ? resultado.json.data.toLowerCase() : "";
  return resultado.respuesta.status === 400 && (texto.indexOf("authorization") !== -1 || texto.indexOf("keyapi") !== -1);
}

async function cargarDatosInventario() {
  if (!obtenerTokenInventario()) {
    actualizarVistaSesionInventario();
    return;
  }
  try {
    var respuestas = await Promise.all([
      llamarApiInventario("repuestos"),
      llamarApiInventario("inventario")
    ]);
    var resRep = respuestas[0];
    var resInv = respuestas[1];

    if (esErrorAutenticacionInv(resRep) || esErrorAutenticacionInv(resInv)) {
      cerrarSesionInventario(false);
      avisarInventario("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }

    if (!resRep.respuesta.ok) {
      avisarInventario(mensajeApiInv(resRep.json), "error");
      return;
    }
    if (!resInv.respuesta.ok) {
      avisarInventario(mensajeApiInv(resInv.json), "error");
      return;
    }

    catalogoRepuestosApi = Array.isArray(resRep.json.data) ? resRep.json.data : [];
    listaInventarioApi = Array.isArray(resInv.json.data) ? resInv.json.data : [];

    llenarSelectRepuestosInventario();
    actualizarResumenInventario();
    pintarTablaInventario();
  } catch (error) {
    avisarInventario(mensajeErrorConexionInv(), "error");
  }
}

function llenarSelectRepuestosInventario(repuestoSeleccionadoId) {
  var select = document.getElementById("repuestoInventario");
  var valorActual = repuestoSeleccionadoId !== undefined ? String(repuestoSeleccionadoId) : select.value;
  var enEdicion = document.getElementById("inventarioId").value !== "";

  var ocupados = {};
  listaInventarioApi.forEach(function (item) {
    ocupados[String(item.repuesto_id)] = true;
  });

  select.innerHTML = "";
  var opcionBase = document.createElement("option");
  opcionBase.value = "";
  opcionBase.textContent = catalogoRepuestosApi.length
    ? "Seleccione un repuesto del catálogo"
    : "Primero registre repuestos en el catálogo";
  select.appendChild(opcionBase);

  catalogoRepuestosApi.forEach(function (rep) {
    var idStr = String(rep.id);
    var yaRegistrado = Boolean(ocupados[idStr]) && idStr !== valorActual;
    var opt = document.createElement("option");
    opt.value = idStr;
    opt.textContent = rep.referencia + " — " + rep.descripcion + " (" + rep.marca + ")" + (yaRegistrado ? " [Ya en inventario]" : "");
    if (yaRegistrado && !enEdicion) {
      opt.disabled = true;
    }
    select.appendChild(opt);
  });

  if (valorActual) {
    select.value = valorActual;
  }
  actualizarDetalleRepuestoSeleccionado();
}

function actualizarDetalleRepuestoSeleccionado() {
  var select = document.getElementById("repuestoInventario");
  var info = document.getElementById("detalleRepuestoInventario");
  var rep = catalogoRepuestosApi.find(function (item) {
    return String(item.id) === String(select.value);
  });

  if (!rep) {
    info.value = "";
    return;
  }
  info.value = rep.descripcion + " | " + rep.marca + " | " + formatearMonedaInv(rep.precio);
}

function actualizarResumenInventario() {
  var totalReferencias = listaInventarioApi.length;
  var totalUnidades = 0;
  var valorTotal = 0;
  var bajoStock = 0;
  var agotados = 0;

  listaInventarioApi.forEach(function (item) {
    var stock = Number(item.stock) || 0;
    var precio = Number(item.precio) || 0;
    totalUnidades += stock;
    valorTotal += stock * precio;
    if (item.estado === "AGOTADO") {
      agotados += 1;
    } else if (item.estado === "BAJO_STOCK") {
      bajoStock += 1;
    }
  });

  document.getElementById("kpiTotalReferencias").textContent = String(totalReferencias);
  document.getElementById("kpiTotalUnidades").textContent = totalUnidades.toLocaleString("es-CO") + " unidades en bodega";
  document.getElementById("kpiValorTotal").textContent = formatearMonedaInv(valorTotal);
  document.getElementById("kpiAlertasTotal").textContent = String(bajoStock + agotados);
  document.getElementById("kpiAlertasDetalle").textContent = bajoStock + " bajo stock · " + agotados + " agotados";
}

async function guardarInventario(evento) {
  evento.preventDefault();
  if (!obtenerTokenInventario()) {
    actualizarVistaSesionInventario();
    avisarInventario("Debes iniciar sesión para gestionar el inventario.", "aviso");
    return;
  }

  var id = document.getElementById("inventarioId").value;
  var repuestoId = document.getElementById("repuestoInventario").value;
  var stockTexto = document.getElementById("stockInventario").value.trim();
  var stockMinTexto = document.getElementById("stockMinimoInventario").value.trim();
  var ubicacion = document.getElementById("ubicacionInventario").value.trim();

  if (!repuestoId || !/^\d+$/.test(stockTexto) || !/^\d+$/.test(stockMinTexto) || ubicacion.length > 60) {
    avisarInventario("Complete los campos correctamente. El stock y stock mínimo deben ser enteros mayores o iguales a 0.", "error");
    return;
  }

  var cuerpo = {
    repuesto_id: Number(repuestoId),
    stock: Number(stockTexto),
    stock_minimo: Number(stockMinTexto),
    ubicacion: ubicacion
  };
  var ruta = id ? "inventario/" + encodeURIComponent(id) : "inventario";
  var metodo = id ? "PUT" : "POST";

  try {
    var resultado = await llamarApiInventario(ruta, { method: metodo, body: cuerpo });
    if (esErrorAutenticacionInv(resultado)) {
      cerrarSesionInventario(false);
      avisarInventario("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarInventario(mensajeApiInv(resultado.json), "error");
      return;
    }

    avisarInventario(id ? "Inventario actualizado correctamente." : "Repuesto registrado en inventario.", "ok");
    limpiarFormularioInventario();
    await cargarDatosInventario();
  } catch (error) {
    avisarInventario(mensajeErrorConexionInv(), "error");
  }
}

function cargarParaEditarInventario(id) {
  var item = listaInventarioApi.find(function (registro) {
    return String(registro.id) === String(id);
  });
  if (!item) {
    return;
  }

  document.getElementById("inventarioId").value = item.id;
  llenarSelectRepuestosInventario(item.repuesto_id);
  document.getElementById("repuestoInventario").value = String(item.repuesto_id);
  document.getElementById("repuestoInventario").disabled = true;
  actualizarDetalleRepuestoSeleccionado();
  document.getElementById("stockInventario").value = item.stock;
  document.getElementById("stockMinimoInventario").value = item.stock_minimo;
  document.getElementById("ubicacionInventario").value = item.ubicacion || "";
  document.getElementById("btnGuardarInventario").textContent = "Actualizar inventario";
  document.getElementById("stockInventario").focus();
}

async function eliminarInventario(id) {
  if (!obtenerTokenInventario()) {
    actualizarVistaSesionInventario();
    avisarInventario("Debes iniciar sesión para eliminar registros de inventario.", "aviso");
    return;
  }
  if (!window.confirm("¿Está seguro de eliminar este registro del inventario?")) {
    return;
  }

  try {
    var resultado = await llamarApiInventario("inventario/" + encodeURIComponent(id), { method: "DELETE" });
    if (esErrorAutenticacionInv(resultado)) {
      cerrarSesionInventario(false);
      avisarInventario("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarInventario(mensajeApiInv(resultado.json), "error");
      return;
    }

    avisarInventario("Registro eliminado del inventario.", "aviso");
    limpiarFormularioInventario();
    await cargarDatosInventario();
  } catch (error) {
    avisarInventario(mensajeErrorConexionInv(), "error");
  }
}

function pintarTablaInventario() {
  var tbody = document.getElementById("tablaInventario");
  if (!obtenerTokenInventario()) {
    tbody.innerHTML = "";
    return;
  }

  var texto = document.getElementById("buscarInventario").value.trim().toLowerCase();
  var filtroEstado = document.getElementById("filtroEstadoInventario").value;

  var visibles = listaInventarioApi.filter(function (item) {
    if (filtroEstado && item.estado !== filtroEstado) {
      return false;
    }
    var bolsa = [item.referencia, item.descripcion, item.marca, item.ubicacion || ""].join(" ").toLowerCase();
    return bolsa.indexOf(texto) !== -1;
  });

  tbody.innerHTML = "";
  if (visibles.length === 0) {
    tbody.innerHTML = '<tr><td class="inv-vacio" colspan="9">No hay registros de inventario para mostrar.</td></tr>';
    return;
  }

  visibles.forEach(function (item) {
    var fila = document.createElement("tr");
    var claseStock = item.estado === "DISPONIBLE" ? "" : "inv-stock-critico";
    var badge = construirBadgeEstadoInv(item.estado);
    var valorFila = (Number(item.stock) || 0) * (Number(item.precio) || 0);

    fila.innerHTML =
      "<td><strong>" + escaparInv(item.referencia) + "</strong></td>" +
      "<td>" + escaparInv(item.descripcion) + '<span class="inv-subtexto">' + escaparInv(item.marca) + "</span></td>" +
      "<td>" + formatearMonedaInv(item.precio) + "</td>" +
      '<td class="' + claseStock + '">' + escaparInv(item.stock) + "</td>" +
      "<td>" + escaparInv(item.stock_minimo) + "</td>" +
      "<td>" + escaparInv(item.ubicacion || "Sin asignar") + "</td>" +
      "<td>" + badge + "</td>" +
      "<td>" + formatearMonedaInv(valorFila) + "</td>" +
      '<td><div class="inv-fila-acciones">' +
      '<button type="button" class="inv-boton inv-boton-editar" data-accion="editar" data-id="' + escaparInv(item.id) + '">Editar</button>' +
      '<button type="button" class="inv-boton inv-boton-eliminar" data-accion="eliminar" data-id="' + escaparInv(item.id) + '">Eliminar</button>' +
      "</div></td>";

    tbody.appendChild(fila);
  });
}

function construirBadgeEstadoInv(estado) {
  if (estado === "AGOTADO") {
    return '<span class="inv-badge inv-badge-agotado">Agotado</span>';
  }
  if (estado === "BAJO_STOCK") {
    return '<span class="inv-badge inv-badge-bajo">Bajo stock</span>';
  }
  return '<span class="inv-badge inv-badge-disponible">Disponible</span>';
}

function limpiarFormularioInventario() {
  document.getElementById("formInventario").reset();
  document.getElementById("inventarioId").value = "";
  document.getElementById("detalleRepuestoInventario").value = "";
  document.getElementById("repuestoInventario").disabled = !obtenerTokenInventario();
  document.getElementById("btnGuardarInventario").textContent = "Registrar en inventario";
  document.querySelectorAll("#formInventario .is-valid, #formInventario .is-invalid").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });
  llenarSelectRepuestosInventario("");
}

function marcarCampoInv(campo, esValido) {
  campo.classList.toggle("is-valid", esValido);
  campo.classList.toggle("is-invalid", !esValido);
}

async function llamarApiInventario(ruta, opciones) {
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  var token = obtenerTokenInventario();
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
    : API_INVENTARIO_BASE + "/" + String(ruta || "").replace(/^\/+/, "");
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

function mensajeErrorConexionInv() {
  return "No hay conexión con el servidor del taller. Verifica que el servicio esté activo e intenta nuevamente.";
}

function mensajeApiInv(json) {
  if (!json) {
    return "El servidor no respondió.";
  }
  if (typeof json.data === "string" && json.data) {
    return json.data;
  }
  return "No fue posible completar la operación.";
}

function avisarInventario(mensaje, tipo) {
  var aviso = document.getElementById("toastInventario");
  aviso.className = "inv-toast inv-toast-" + tipo;
  aviso.textContent = mensaje;
  aviso.hidden = false;
  window.clearTimeout(avisarInventario.temporizador);
  avisarInventario.temporizador = window.setTimeout(function () {
    aviso.hidden = true;
  }, 4500);
}

function formatearMonedaInv(valor) {
  return "$ " + (Number(valor) || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function escaparInv(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
