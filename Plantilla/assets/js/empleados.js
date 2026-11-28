var API_EMPLEADOS = typeof window.API_TALLER === "string" ? window.API_TALLER : "../backend/rest";
var CLAVE_PANTHER = "olimac_panther_token";
var CLAVE_PANTHER_USUARIO = "olimac_panther_user";
var listaEmpleadosApi = [];

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("formEmpleado");
  var buscar = document.getElementById("buscarEmpleado");

  document.getElementById("cedulaEmpleado").addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
    marcarCampoEmp(this, /^[0-9]{5,20}$/.test(this.value));
  });
  document.getElementById("nombreEmpleado").addEventListener("input", function () {
    marcarCampoEmp(this, this.value.trim().length > 0 && this.value.trim().length <= 120);
  });
  document.getElementById("telefonoEmpleado").addEventListener("input", function () {
    marcarCampoEmp(this, /^[0-9+\-\s]{7,20}$/.test(this.value.trim()));
  });
  document.getElementById("correoEmpleado").addEventListener("input", function () {
    var val = this.value.trim();
    marcarCampoEmp(this, val.length > 0 && val.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
  });
  document.getElementById("cargoEmpleado").addEventListener("change", function () {
    marcarCampoEmp(this, this.value !== "");
  });
  document.getElementById("salarioEmpleado").addEventListener("input", function () {
    var val = this.value.trim();
    marcarCampoEmp(this, val !== "" && !isNaN(Number(val)) && Number(val) >= 0);
  });

  document.getElementById("formSesionPanther").addEventListener("submit", entrarPantherEmp);
  document.getElementById("btnCerrarSesionPanther").addEventListener("click", function () {
    cerrarSesionEmp(true);
  });
  form.addEventListener("submit", guardarEmpleado);
  document.getElementById("btnLimpiarEmpleado").addEventListener("click", limpiarFormularioEmpleado);
  buscar.addEventListener("input", pintarTablaEmpleados);
  document.getElementById("tablaEmpleados").addEventListener("click", function (evento) {
    var boton = evento.target.closest("button");
    if (!boton) {
      return;
    }
    var id = boton.getAttribute("data-id");
    if (boton.getAttribute("data-accion") === "editar") {
      cargarParaEditarEmpleado(id);
    }
    if (boton.getAttribute("data-accion") === "eliminar") {
      eliminarEmpleado(id);
    }
  });

  actualizarVistaSesionEmp();
  if (obtenerTokenEmp()) {
    cargarEmpleados();
  }
});

function obtenerTokenEmp() {
  return sessionStorage.getItem(CLAVE_PANTHER) || "";
}

function obtenerUsuarioEmp() {
  return sessionStorage.getItem(CLAVE_PANTHER_USUARIO) || "";
}

function guardarSesionEmp(token, usuario) {
  sessionStorage.setItem(CLAVE_PANTHER, token);
  sessionStorage.setItem(CLAVE_PANTHER_USUARIO, usuario);
}

function limpiarStorageEmp() {
  sessionStorage.removeItem(CLAVE_PANTHER);
  sessionStorage.removeItem(CLAVE_PANTHER_USUARIO);
}

async function entrarPantherEmp(evento) {
  evento.preventDefault();
  var campoUsuario = document.getElementById("usuarioPanther");
  var campoContrasenia = document.getElementById("contraseniaPanther");
  var btnEntrar = document.getElementById("btnEntrarPanther");
  var usuario = campoUsuario.value.trim();
  var contrasenia = campoContrasenia.value;

  if (!usuario || !contrasenia) {
    avisarEmp("Escriba su usuario y contraseña.", "aviso");
    (usuario ? campoContrasenia : campoUsuario).focus();
    return;
  }

  btnEntrar.disabled = true;
  try {
    var resultado = await llamarEmpleados("useraction/login", {
      method: "POST",
      body: { user: usuario, password: contrasenia }
    });
    var token = resultado.json && resultado.json.data && resultado.json.data.keyAPI;
    var usuarioAutenticado = (resultado.json && resultado.json.data && resultado.json.data.user) || usuario;
    if (!resultado.respuesta.ok || !token) {
      avisarEmp(mensajeApiEmp(resultado.json) || "Usuario o contraseña incorrectos.", "error");
      return;
    }
    guardarSesionEmp(token, usuarioAutenticado);
    campoUsuario.value = "";
    campoContrasenia.value = "";
    actualizarVistaSesionEmp();
    avisarEmp("Sesión iniciada correctamente.", "ok");
    await cargarEmpleados();
  } catch (error) {
    avisarEmp(mensajeErrorConexionEmp(), "error");
  } finally {
    btnEntrar.disabled = false;
  }
}

function actualizarVistaSesionEmp() {
  var activa = Boolean(obtenerTokenEmp());
  var formLogin = document.getElementById("formSesionPanther");
  var barraActiva = document.getElementById("sesionActivaPanther");
  var etiquetaUsuario = document.getElementById("usuarioActivoPanther");
  var avisoBloqueo = document.getElementById("avisoBloqueoEmpleados");
  var panelCrud = document.getElementById("panelCrudEmpleados");

  formLogin.hidden = activa;
  barraActiva.hidden = !activa;
  avisoBloqueo.hidden = activa;
  panelCrud.hidden = !activa;
  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = activa ? obtenerUsuarioEmp() : "";
  }
  panelCrud.querySelectorAll("input, button, select, textarea").forEach(function (control) {
    control.disabled = !activa;
  });
}

function cerrarSesionEmp(notificar) {
  limpiarStorageEmp();
  listaEmpleadosApi = [];
  limpiarFormularioEmpleado();
  document.getElementById("buscarEmpleado").value = "";
  document.getElementById("tablaEmpleados").innerHTML = "";
  actualizarVistaSesionEmp();
  if (notificar) {
    avisarEmp("Sesión cerrada.", "aviso");
  }
}

function esErrorAuthEmp(resultado) {
  if (!resultado || !resultado.respuesta) {
    return false;
  }
  if (resultado.respuesta.status === 401 || resultado.respuesta.status === 403) {
    return true;
  }
  var texto = resultado.json && typeof resultado.json.data === "string" ? resultado.json.data.toLowerCase() : "";
  return resultado.respuesta.status === 400 && (texto.indexOf("authorization") !== -1 || texto.indexOf("keyapi") !== -1);
}

function listaDesdeRespuestaEmp(resultado) {
  if (resultado.respuesta.status === 204) {
    return [];
  }
  if (resultado.respuesta.ok && Array.isArray(resultado.json.data)) {
    return resultado.json.data;
  }
  return null;
}

async function cargarEmpleados() {
  if (!obtenerTokenEmp()) {
    actualizarVistaSesionEmp();
    return;
  }
  try {
    var resultado = await llamarEmpleados("empleados");
    if (esErrorAuthEmp(resultado)) {
      cerrarSesionEmp(false);
      avisarEmp("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    var lista = listaDesdeRespuestaEmp(resultado);
    if (lista === null) {
      avisarEmp(mensajeApiEmp(resultado.json), "error");
      return;
    }
    listaEmpleadosApi = lista;
    pintarTablaEmpleados();
  } catch (error) {
    avisarEmp(mensajeErrorConexionEmp(), "error");
  }
}

async function guardarEmpleado(evento) {
  evento.preventDefault();
  if (!obtenerTokenEmp()) {
    actualizarVistaSesionEmp();
    avisarEmp("Debes iniciar sesión antes de registrar o editar empleados.", "aviso");
    return;
  }

  var cedula = document.getElementById("cedulaEmpleado").value.trim();
  var nombre = document.getElementById("nombreEmpleado").value.trim();
  var telefono = document.getElementById("telefonoEmpleado").value.trim();
  var correo = document.getElementById("correoEmpleado").value.trim().toLowerCase();
  var cargo = document.getElementById("cargoEmpleado").value.trim();
  var salario = document.getElementById("salarioEmpleado").value.trim();
  var id = document.getElementById("empleadoId").value;

  if (
    !/^[0-9]{5,20}$/.test(cedula) ||
    nombre.length === 0 ||
    nombre.length > 120 ||
    !/^[0-9+\-\s]{7,20}$/.test(telefono) ||
    correo.length === 0 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
    cargo === "" ||
    salario === "" ||
    isNaN(Number(salario)) ||
    Number(salario) < 0
  ) {
    avisarEmp("Complete todos los campos con un formato válido.", "error");
    return;
  }

  var cuerpo = {
    cedula: cedula,
    nombre: nombre,
    telefono: telefono,
    correo: correo,
    cargo: cargo,
    salario: Number(salario)
  };
  var ruta = id ? "empleados/" + encodeURIComponent(id) : "empleados";
  var metodo = id ? "PUT" : "POST";

  try {
    var resultado = await llamarEmpleados(ruta, { method: metodo, body: cuerpo });
    if (esErrorAuthEmp(resultado)) {
      cerrarSesionEmp(false);
      avisarEmp("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarEmp(mensajeApiEmp(resultado.json), "error");
      return;
    }
    avisarEmp(id ? "Empleado actualizado." : "Empleado registrado correctamente.", "ok");
    limpiarFormularioEmpleado();
    await cargarEmpleados();
  } catch (error) {
    avisarEmp(mensajeErrorConexionEmp(), "error");
  }
}

function cargarParaEditarEmpleado(id) {
  var empleado = listaEmpleadosApi.find(function (item) {
    return String(item.id) === String(id);
  });
  if (!empleado) {
    return;
  }
  document.getElementById("empleadoId").value = empleado.id;
  document.getElementById("cedulaEmpleado").value = empleado.cedula || "";
  document.getElementById("nombreEmpleado").value = empleado.nombre || "";
  document.getElementById("telefonoEmpleado").value = empleado.telefono || "";
  document.getElementById("correoEmpleado").value = empleado.correo || "";
  document.getElementById("cargoEmpleado").value = empleado.cargo || "";
  document.getElementById("salarioEmpleado").value = empleado.salario || "";
  document.getElementById("btnGuardarEmpleado").textContent = "Actualizar empleado";
}

async function eliminarEmpleado(id) {
  if (!obtenerTokenEmp()) {
    actualizarVistaSesionEmp();
    avisarEmp("Debes iniciar sesión para eliminar empleados.", "aviso");
    return;
  }
  if (!window.confirm("¿Está seguro de eliminar este empleado?")) {
    return;
  }
  try {
    var resultado = await llamarEmpleados("empleados/" + encodeURIComponent(id), { method: "DELETE" });
    if (esErrorAuthEmp(resultado)) {
      cerrarSesionEmp(false);
      avisarEmp("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarEmp(mensajeApiEmp(resultado.json), "error");
      return;
    }
    avisarEmp("Empleado eliminado.", "aviso");
    limpiarFormularioEmpleado();
    await cargarEmpleados();
  } catch (error) {
    avisarEmp(mensajeErrorConexionEmp(), "error");
  }
}

function pintarTablaEmpleados() {
  var tbody = document.getElementById("tablaEmpleados");
  if (!obtenerTokenEmp()) {
    tbody.innerHTML = "";
    return;
  }
  var texto = document.getElementById("buscarEmpleado").value.trim().toLowerCase();
  var visibles = listaEmpleadosApi.filter(function (item) {
    var bolsa = (
      (item.cedula || "") + " " +
      (item.nombre || "") + " " +
      (item.telefono || "") + " " +
      (item.correo || "") + " " +
      (item.cargo || "")
    ).toLowerCase();
    return bolsa.indexOf(texto) !== -1;
  });

  tbody.innerHTML = "";
  if (visibles.length === 0) {
    tbody.innerHTML = '<tr><td class="rep-vacio" colspan="7">No hay empleados para mostrar.</td></tr>';
    return;
  }

  visibles.forEach(function (item) {
    var fila = document.createElement("tr");
    fila.innerHTML =
      "<td><strong>" + escaparEmp(item.cedula) + "</strong></td>" +
      "<td>" + escaparEmp(item.nombre) + "</td>" +
      "<td>" + escaparEmp(item.telefono) + "</td>" +
      "<td>" + escaparEmp(item.correo) + "</td>" +
      "<td>" + escaparEmp(item.cargo) + "</td>" +
      "<td>$" + escaparEmp(item.salario) + "</td>" +
      '<td><div class="rep-fila-acciones">' +
      '<button type="button" class="rep-boton rep-boton-editar" data-accion="editar" data-id="' + escaparEmp(item.id) + '">Editar</button>' +
      '<button type="button" class="rep-boton rep-boton-eliminar" data-accion="eliminar" data-id="' + escaparEmp(item.id) + '">Eliminar</button>' +
      "</div></td>";
    tbody.appendChild(fila);
  });
}

function limpiarFormularioEmpleado() {
  document.getElementById("formEmpleado").reset();
  document.getElementById("empleadoId").value = "";
  document.getElementById("btnGuardarEmpleado").textContent = "Registrar empleado";
  document.querySelectorAll(".is-valid, .is-invalid").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });
}

function marcarCampoEmp(input, esValido) {
  input.classList.toggle("is-valid", esValido);
  input.classList.toggle("is-invalid", !esValido);
}

async function llamarEmpleados(ruta, opciones) {
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  var token = obtenerTokenEmp();
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
    : API_EMPLEADOS + "/" + String(ruta || "").replace(/^\/+/, "");
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

function mensajeErrorConexionEmp() {
  return "No hay conexión con el servidor del taller. Verifica que el servicio esté activo e intenta nuevamente.";
}

function mensajeApiEmp(json) {
  if (!json) {
    return "El servidor no respondió.";
  }
  if (typeof json.data === "string" && json.data) {
    return json.data;
  }
  return "No fue posible completar la operación.";
}

function avisarEmp(mensaje, tipo) {
  var aviso = document.getElementById("toastEmpleado");
  aviso.className = "rep-toast rep-toast-" + tipo;
  aviso.textContent = mensaje;
  aviso.hidden = false;
  window.clearTimeout(avisarEmp.temporizador);
  avisarEmp.temporizador = window.setTimeout(function () {
    aviso.hidden = true;
  }, 4500);
}

function escaparEmp(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
