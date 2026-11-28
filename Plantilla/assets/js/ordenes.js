var API_ORDENES_BASE = typeof window.API_TALLER === "string" ? window.API_TALLER : "../backend/rest";
var CLAVE_TOKEN_ORD = "olimac_panther_token";
var CLAVE_USUARIO_ORD = "olimac_panther_user";

var listaOrdenesApi = [];
var catalogosOrdenes = {
  clientes: [],
  vehiculos: [],
  empleados: [],
  inventario: []
};
var ordenEnEdicion = null;

document.addEventListener("DOMContentLoaded", function () {
  var formSesion = document.getElementById("formSesionOrdenes");
  var btnCerrarSesion = document.getElementById("btnCerrarSesionOrdenes");
  var formOrden = document.getElementById("formOrden");
  var selectCliente = document.getElementById("clienteOrden");
  var selectVehiculo = document.getElementById("vehiculoOrden");
  var inputPlaca = document.getElementById("placaOrden");
  var inputHoras = document.getElementById("horasOrden");
  var btnAgregarLinea = document.getElementById("btnAgregarRepuestoOrden");
  var btnLimpiar = document.getElementById("btnLimpiarOrden");
  var inputBuscar = document.getElementById("buscarOrdenes");
  var selectFiltroEstado = document.getElementById("filtroEstadoOrdenes");
  var tbody = document.getElementById("tablaOrdenes");
  var modal = document.getElementById("modalDetalleOrden");
  var btnCerrarModal = document.getElementById("btnCerrarDetalleOrden");

  formSesion.addEventListener("submit", iniciarSesionOrdenes);
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", function () {
      cerrarSesionOrdenes(true);
    });
  }

  selectCliente.addEventListener("change", function () {
    llenarSelectVehiculos(selectVehiculo.value);
  });

  selectVehiculo.addEventListener("change", sincronizarVehiculoSeleccionado);

  inputPlaca.addEventListener("input", function () {
    this.value = this.value.toUpperCase();
    marcarCampoOrd(this, /^[A-Z0-9-]{5,15}$/.test(this.value.trim()));
  });

  inputHoras.addEventListener("input", function () {
    var val = this.value.trim();
    marcarCampoOrd(this, /^\d+(\.\d{1,2})?$/.test(val) && Number(val) > 0);
  });

  btnAgregarLinea.addEventListener("click", function () {
    agregarLineaRepuestoOrden();
  });
  btnLimpiar.addEventListener("click", limpiarFormularioOrden);
  formOrden.addEventListener("submit", guardarOrden);
  inputBuscar.addEventListener("input", pintarTablaOrdenes);
  selectFiltroEstado.addEventListener("change", pintarTablaOrdenes);

  tbody.addEventListener("click", function (evento) {
    var boton = evento.target.closest("button");
    if (!boton) {
      return;
    }
    var id = boton.getAttribute("data-id");
    var accion = boton.getAttribute("data-accion");
    if (accion === "detalle") {
      abrirDetalleOrden(id);
    }
    if (accion === "editar") {
      cargarParaEditarOrden(id);
    }
    if (accion === "eliminar") {
      eliminarOrden(id);
    }
  });

  btnCerrarModal.addEventListener("click", cerrarDetalleOrden);
  modal.addEventListener("click", function (evento) {
    if (evento.target === modal) {
      cerrarDetalleOrden();
    }
  });
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && !modal.hidden) {
      cerrarDetalleOrden();
    }
  });

  inicializarFechaIngresoActual();
  actualizarVistaSesionOrdenes();
  if (obtenerTokenOrdenes()) {
    cargarDatosOrdenes();
  }
});

function obtenerTokenOrdenes() {
  return sessionStorage.getItem(CLAVE_TOKEN_ORD) || "";
}

function obtenerUsuarioOrdenes() {
  return sessionStorage.getItem(CLAVE_USUARIO_ORD) || "";
}

function guardarSesionOrdenes(token, usuario) {
  sessionStorage.setItem(CLAVE_TOKEN_ORD, token);
  sessionStorage.setItem(CLAVE_USUARIO_ORD, usuario);
}

function limpiarSesionOrdenes() {
  sessionStorage.removeItem(CLAVE_TOKEN_ORD);
  sessionStorage.removeItem(CLAVE_USUARIO_ORD);
}

async function iniciarSesionOrdenes(evento) {
  evento.preventDefault();
  var campoUsuario = document.getElementById("usuarioOrdenes");
  var campoContrasenia = document.getElementById("contraseniaOrdenes");
  var btnEntrar = document.getElementById("btnEntrarOrdenes");
  var usuario = campoUsuario.value.trim();
  var contrasenia = campoContrasenia.value;

  if (!usuario || !contrasenia) {
    avisarOrden("Escriba su usuario y contraseña.", "aviso");
    (usuario ? campoContrasenia : campoUsuario).focus();
    return;
  }

  btnEntrar.disabled = true;
  try {
    var resultado = await llamarApiOrdenes("useraction/login", {
      method: "POST",
      body: { user: usuario, password: contrasenia }
    });
    var token = resultado.json && resultado.json.data && resultado.json.data.keyAPI;
    var usuarioAutenticado = (resultado.json && resultado.json.data && resultado.json.data.user) || usuario;
    if (!resultado.respuesta.ok || !token) {
      avisarOrden(mensajeApiOrd(resultado.json) || "Usuario o contraseña incorrectos.", "error");
      return;
    }

    guardarSesionOrdenes(token, usuarioAutenticado);
    campoUsuario.value = "";
    campoContrasenia.value = "";
    actualizarVistaSesionOrdenes();
    avisarOrden("Sesión iniciada correctamente.", "ok");
    await cargarDatosOrdenes();
  } catch (error) {
    avisarOrden(mensajeErrorConexionOrd(), "error");
  } finally {
    btnEntrar.disabled = false;
  }
}

function actualizarVistaSesionOrdenes() {
  var activa = Boolean(obtenerTokenOrdenes());
  var usuario = obtenerUsuarioOrdenes();

  var formLogin = document.getElementById("formSesionOrdenes");
  var barraActiva = document.getElementById("sesionActivaOrdenes");
  var etiquetaUsuario = document.getElementById("usuarioActivoOrdenes");
  var avisoBloqueo = document.getElementById("avisoBloqueoOrdenes");
  var panelCrud = document.getElementById("panelCrudOrdenes");

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

function cerrarSesionOrdenes(notificar) {
  limpiarSesionOrdenes();
  listaOrdenesApi = [];
  ordenEnEdicion = null;
  catalogosOrdenes = { clientes: [], vehiculos: [], empleados: [], inventario: [] };
  cerrarDetalleOrden();
  limpiarFormularioOrden();
  document.getElementById("buscarOrdenes").value = "";
  document.getElementById("filtroEstadoOrdenes").value = "";
  document.getElementById("tablaOrdenes").innerHTML = "";
  document.getElementById("usuarioOrdenes").value = "";
  document.getElementById("contraseniaOrdenes").value = "";
  actualizarVistaSesionOrdenes();
  if (notificar) {
    avisarOrden("Sesión cerrada.", "aviso");
  }
  document.getElementById("usuarioOrdenes").focus();
}

function esErrorAutenticacionOrd(resultado) {
  if (!resultado || !resultado.respuesta) {
    return false;
  }
  if (resultado.respuesta.status === 401 || resultado.respuesta.status === 403) {
    return true;
  }
  var texto = resultado.json && typeof resultado.json.data === "string" ? resultado.json.data.toLowerCase() : "";
  return resultado.respuesta.status === 400 && (texto.indexOf("authorization") !== -1 || texto.indexOf("keyapi") !== -1);
}

async function cargarDatosOrdenes() {
  if (!obtenerTokenOrdenes()) {
    actualizarVistaSesionOrdenes();
    return;
  }
  try {
    var respuestas = await Promise.all([
      llamarApiOrdenes("ordenes/catalogos"),
      llamarApiOrdenes("ordenes")
    ]);
    var resCat = respuestas[0];
    var resOrd = respuestas[1];

    if (esErrorAutenticacionOrd(resCat) || esErrorAutenticacionOrd(resOrd)) {
      cerrarSesionOrdenes(false);
      avisarOrden("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }

    if (!resCat.respuesta.ok) {
      avisarOrden(mensajeApiOrd(resCat.json), "error");
      return;
    }
    if (!resOrd.respuesta.ok) {
      avisarOrden(mensajeApiOrd(resOrd.json), "error");
      return;
    }

    var cat = resCat.json.data || {};
    catalogosOrdenes = {
      clientes: Array.isArray(cat.clientes) ? cat.clientes : [],
      vehiculos: Array.isArray(cat.vehiculos) ? cat.vehiculos : [],
      empleados: Array.isArray(cat.empleados) ? cat.empleados : [],
      inventario: Array.isArray(cat.inventario) ? cat.inventario : []
    };
    listaOrdenesApi = Array.isArray(resOrd.json.data) ? resOrd.json.data : [];

    poblarSelectoresOrdenes();
    if (document.querySelectorAll("#lineasRepuestosOrden .ord-linea").length === 0) {
      agregarLineaRepuestoOrden();
    } else {
      refrescarOpcionesLineasRepuesto();
    }
    actualizarResumenOrdenes();
    pintarTablaOrdenes();
  } catch (error) {
    avisarOrden(mensajeErrorConexionOrd(), "error");
  }
}

function poblarSelectoresOrdenes() {
  var selCli = document.getElementById("clienteOrden");
  var selEmp = document.getElementById("empleadoOrden");
  var cliActual = selCli.value;
  var empActual = selEmp.value;

  selCli.innerHTML = "";
  var optCli = document.createElement("option");
  optCli.value = "";
  optCli.textContent = catalogosOrdenes.clientes.length
    ? "Seleccione un cliente (opcional)"
    : "Sin clientes registrados aún";
  selCli.appendChild(optCli);

  catalogosOrdenes.clientes.forEach(function (c) {
    var opt = document.createElement("option");
    opt.value = String(c.id);
    opt.textContent = c.nombre + " — CC " + c.cedula;
    selCli.appendChild(opt);
  });
  selCli.value = cliActual;

  selEmp.innerHTML = "";
  var optEmp = document.createElement("option");
  optEmp.value = "";
  optEmp.textContent = catalogosOrdenes.empleados.length
    ? "Seleccione un mecánico disponible"
    : "Sin mecánicos registrados aún";
  selEmp.appendChild(optEmp);

  catalogosOrdenes.empleados.forEach(function (e) {
    var opt = document.createElement("option");
    opt.value = String(e.id);
    opt.textContent = e.nombre + " — " + e.cargo;
    selEmp.appendChild(opt);
  });
  selEmp.value = empActual;

  llenarSelectVehiculos(document.getElementById("vehiculoOrden").value);
}

function llenarSelectVehiculos(vehiculoActual) {
  var selVeh = document.getElementById("vehiculoOrden");
  var clienteId = document.getElementById("clienteOrden").value;
  var lista = catalogosOrdenes.vehiculos;

  if (clienteId) {
    var filtrados = lista.filter(function (v) {
      return String(v.cliente_id || "") === String(clienteId);
    });
    if (filtrados.length > 0) {
      lista = filtrados;
    }
  }

  selVeh.innerHTML = "";
  var optBase = document.createElement("option");
  optBase.value = "";
  optBase.textContent = catalogosOrdenes.vehiculos.length
    ? "Seleccione un vehículo o escriba la placa"
    : "Sin vehículos registrados aún (ingrese placa)";
  selVeh.appendChild(optBase);

  lista.forEach(function (v) {
    var opt = document.createElement("option");
    opt.value = String(v.id);
    opt.textContent = v.placa + " — " + v.marca + " " + v.modelo + " (" + v.color + ")";
    selVeh.appendChild(opt);
  });

  if (vehiculoActual) {
    selVeh.value = String(vehiculoActual);
  }
}

function sincronizarVehiculoSeleccionado() {
  var vehiculoId = document.getElementById("vehiculoOrden").value;
  var resumen = document.getElementById("infoVehiculoOrden");
  var inputPlaca = document.getElementById("placaOrden");

  var vehiculo = catalogosOrdenes.vehiculos.find(function (v) {
    return String(v.id) === String(vehiculoId);
  });

  if (!vehiculo) {
    resumen.value = "";
    return;
  }

  inputPlaca.value = vehiculo.placa;
  marcarCampoOrd(inputPlaca, true);
  resumen.value = vehiculo.marca + " " + vehiculo.modelo + " · Color: " + vehiculo.color + " · " + vehiculo.tipo;

  if (vehiculo.cliente_id) {
    document.getElementById("clienteOrden").value = String(vehiculo.cliente_id);
  }
}

function stockDisponibleParaEdicion(repuestoId) {
  var inv = catalogosOrdenes.inventario.find(function (i) {
    return String(i.repuesto_id) === String(repuestoId);
  });
  var base = inv ? Number(inv.stock) || 0 : 0;

  if (ordenEnEdicion && ordenEnEdicion.estado !== "CANCELADA" && Array.isArray(ordenEnEdicion.repuestos)) {
    ordenEnEdicion.repuestos.forEach(function (det) {
      if (String(det.repuesto_id) === String(repuestoId)) {
        base += Number(det.cantidad) || 0;
      }
    });
  }
  return base;
}

function construirOpcionesInventarioHtml(repuestoSeleccionadoId) {
  var html = '<option value="">' +
    (catalogosOrdenes.inventario.length ? "Seleccione un repuesto del inventario" : "No hay repuestos en inventario") +
    "</option>";

  catalogosOrdenes.inventario.forEach(function (item) {
    var disp = stockDisponibleParaEdicion(item.repuesto_id);
    var selected = String(item.repuesto_id) === String(repuestoSeleccionadoId || "") ? " selected" : "";
    var etiqueta = item.referencia + " — " + item.descripcion + " (" + item.marca + ") · Stock: " + disp;
    html += '<option value="' + escaparOrd(item.repuesto_id) + '"' + selected + ">" + escaparOrd(etiqueta) + "</option>";
  });

  return html;
}

function agregarLineaRepuestoOrden(repuestoId, cantidad) {
  var contenedor = document.getElementById("lineasRepuestosOrden");
  var fila = document.createElement("div");
  fila.className = "ord-linea";

  fila.innerHTML =
    '<label class="ord-campo">' +
      "<span>Repuesto</span>" +
      '<select class="ord-linea-repuesto">' + construirOpcionesInventarioHtml(repuestoId) + "</select>" +
    "</label>" +
    '<label class="ord-campo">' +
      "<span>Cantidad</span>" +
      '<input type="number" class="ord-linea-cantidad" min="1" step="1" value="' + escaparOrd(cantidad || 1) + '">' +
    "</label>" +
    '<label class="ord-campo">' +
      "<span>Precio unitario</span>" +
      '<input type="text" class="ord-linea-precio" readonly value="$ 0">' +
    "</label>" +
    '<label class="ord-campo">' +
      "<span>Subtotal</span>" +
      '<input type="text" class="ord-linea-subtotal" readonly value="$ 0">' +
    "</label>" +
    '<button type="button" class="ord-boton ord-boton-eliminar ord-linea-quitar">Quitar</button>';

  fila.querySelector(".ord-linea-repuesto").addEventListener("change", function () {
    actualizarLineaRepuesto(fila);
  });
  fila.querySelector(".ord-linea-cantidad").addEventListener("input", function () {
    actualizarLineaRepuesto(fila);
  });
  fila.querySelector(".ord-linea-quitar").addEventListener("click", function () {
    fila.remove();
    recalcularTotalesFormulario();
  });

  contenedor.appendChild(fila);
  actualizarLineaRepuesto(fila);
}

function refrescarOpcionesLineasRepuesto() {
  document.querySelectorAll("#lineasRepuestosOrden .ord-linea").forEach(function (fila) {
    var select = fila.querySelector(".ord-linea-repuesto");
    var val = select.value;
    select.innerHTML = construirOpcionesInventarioHtml(val);
    select.value = val;
    actualizarLineaRepuesto(fila);
  });
}

function actualizarLineaRepuesto(fila) {
  var repId = fila.querySelector(".ord-linea-repuesto").value;
  var inputCant = fila.querySelector(".ord-linea-cantidad");
  var inputPrecio = fila.querySelector(".ord-linea-precio");
  var inputSub = fila.querySelector(".ord-linea-subtotal");

  var item = catalogosOrdenes.inventario.find(function (i) {
    return String(i.repuesto_id) === String(repId);
  });

  if (!item) {
    inputPrecio.value = "$ 0";
    inputSub.value = "$ 0";
    inputCant.removeAttribute("max");
    recalcularTotalesFormulario();
    return;
  }

  var disp = stockDisponibleParaEdicion(item.repuesto_id);
  var cantidad = Math.max(0, parseInt(inputCant.value, 10) || 0);
  var precio = Number(item.precio) || 0;
  var subtotal = cantidad * precio;

  inputCant.setAttribute("max", String(Math.max(disp, 1)));
  inputPrecio.value = formatearMonedaOrd(precio);
  inputSub.value = formatearMonedaOrd(subtotal);

  var estadoSeleccionado = document.getElementById("estadoOrden").value;
  if (estadoSeleccionado !== "CANCELADA" && cantidad > disp) {
    marcarCampoOrd(inputCant, false);
  } else {
    marcarCampoOrd(inputCant, cantidad > 0);
  }

  recalcularTotalesFormulario();
}

function obtenerLineasRepuestosFormulario() {
  var lineas = [];
  var repetidos = {};
  var hayRepetido = false;
  var cantidadInvalida = false;

  document.querySelectorAll("#lineasRepuestosOrden .ord-linea").forEach(function (fila) {
    var repId = fila.querySelector(".ord-linea-repuesto").value;
    var cant = parseInt(fila.querySelector(".ord-linea-cantidad").value, 10);

    if (!repId) {
      return;
    }
    if (!cant || cant <= 0) {
      cantidadInvalida = true;
      return;
    }
    if (repetidos[repId]) {
      hayRepetido = true;
    }
    repetidos[repId] = true;

    var inv = catalogosOrdenes.inventario.find(function (i) {
      return String(i.repuesto_id) === String(repId);
    });
    lineas.push({
      repuesto_id: Number(repId),
      cantidad: cant,
      precio_unitario: inv ? Number(inv.precio) : 0,
      referencia: inv ? inv.referencia : ""
    });
  });

  return {
    lineas: lineas,
    hayRepetido: hayRepetido,
    cantidadInvalida: cantidadInvalida
  };
}

function recalcularTotalesFormulario() {
  var resumen = obtenerLineasRepuestosFormulario();
  var unidades = 0;
  var subtotal = 0;

  resumen.lineas.forEach(function (l) {
    unidades += l.cantidad;
    subtotal += l.cantidad * l.precio_unitario;
  });

  document.getElementById("resumenUnidadesForm").textContent = String(unidades);
  document.getElementById("resumenSubtotalForm").textContent = formatearMonedaOrd(subtotal);
}

function actualizarResumenOrdenes() {
  var total = listaOrdenesApi.length;
  var activas = 0;
  var finalizadas = 0;
  var totalRepuestos = 0;

  listaOrdenesApi.forEach(function (ord) {
    if (ord.estado === "ABIERTA" || ord.estado === "EN_PROCESO") {
      activas += 1;
    } else if (ord.estado === "FINALIZADA") {
      finalizadas += 1;
    }
    totalRepuestos += Number(ord.subtotal_repuestos) || 0;
  });

  document.getElementById("kpiTotalOrdenes").textContent = String(total);
  document.getElementById("kpiOrdenesActivas").textContent = String(activas);
  document.getElementById("kpiOrdenesFinalizadas").textContent = String(finalizadas);
  document.getElementById("kpiSubtotalOrdenes").textContent = formatearMonedaOrd(totalRepuestos);
}

async function guardarOrden(evento) {
  evento.preventDefault();
  if (!obtenerTokenOrdenes()) {
    actualizarVistaSesionOrdenes();
    avisarOrden("Debes iniciar sesión para gestionar órdenes de servicio.", "aviso");
    return;
  }

  var id = document.getElementById("ordenId").value;
  var clienteId = document.getElementById("clienteOrden").value;
  var vehiculoId = document.getElementById("vehiculoOrden").value;
  var placa = document.getElementById("placaOrden").value.trim().toUpperCase();
  var empleadoId = document.getElementById("empleadoOrden").value;
  var fechaIngreso = document.getElementById("fechaIngresoOrden").value;
  var horasTexto = document.getElementById("horasOrden").value.trim();
  var estado = document.getElementById("estadoOrden").value;
  var observaciones = document.getElementById("observacionesOrden").value.trim();

  if (!/^[A-Z0-9-]{5,15}$/.test(placa)) {
    avisarOrden("Ingrese una placa válida (5 a 15 caracteres alfanuméricos).", "error");
    return;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(horasTexto) || Number(horasTexto) <= 0) {
    avisarOrden("Las horas empleadas deben ser un número mayor a 0.", "error");
    return;
  }

  var analisis = obtenerLineasRepuestosFormulario();
  if (analisis.cantidadInvalida) {
    avisarOrden("La cantidad de cada repuesto debe ser un entero mayor a 0.", "error");
    return;
  }
  if (analisis.hayRepetido) {
    avisarOrden("No repitas el mismo repuesto en dos filas; ajusta la cantidad en una sola línea.", "aviso");
    return;
  }

  if (estado !== "CANCELADA") {
    for (var i = 0; i < analisis.lineas.length; i++) {
      var l = analisis.lineas[i];
      var disp = stockDisponibleParaEdicion(l.repuesto_id);
      if (l.cantidad > disp) {
        avisarOrden("Stock insuficiente para " + l.referencia + ". Disponible: " + disp + ".", "aviso");
        return;
      }
    }
  }

  var cuerpo = {
    cliente_id: clienteId ? Number(clienteId) : null,
    vehiculo_id: vehiculoId ? Number(vehiculoId) : null,
    placa: placa,
    empleado_id: empleadoId ? Number(empleadoId) : null,
    fecha_ingreso: fechaIngreso ? fechaIngreso.replace("T", " ") + ":00" : null,
    horas: Number(horasTexto),
    estado: estado,
    observaciones: observaciones,
    repuestos: analisis.lineas.map(function (item) {
      return {
        repuesto_id: item.repuesto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      };
    })
  };

  var ruta = id ? "ordenes/" + encodeURIComponent(id) : "ordenes";
  var metodo = id ? "PUT" : "POST";

  try {
    var resultado = await llamarApiOrdenes(ruta, { method: metodo, body: cuerpo });
    if (esErrorAutenticacionOrd(resultado)) {
      cerrarSesionOrdenes(false);
      avisarOrden("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarOrden(mensajeApiOrd(resultado.json), "error");
      return;
    }

    avisarOrden(id ? "Orden actualizada y stock sincronizado." : "Orden registrada y stock actualizado.", "ok");
    limpiarFormularioOrden();
    await cargarDatosOrdenes();
  } catch (error) {
    avisarOrden(mensajeErrorConexionOrd(), "error");
  }
}

function cargarParaEditarOrden(id) {
  var orden = listaOrdenesApi.find(function (o) {
    return String(o.id) === String(id);
  });
  if (!orden) {
    return;
  }

  ordenEnEdicion = orden;
  document.getElementById("ordenId").value = orden.id;
  document.getElementById("clienteOrden").value = orden.cliente_id ? String(orden.cliente_id) : "";
  llenarSelectVehiculos(orden.vehiculo_id ? String(orden.vehiculo_id) : "");
  document.getElementById("vehiculoOrden").value = orden.vehiculo_id ? String(orden.vehiculo_id) : "";
  sincronizarVehiculoSeleccionado();
  document.getElementById("placaOrden").value = orden.placa || "";
  document.getElementById("empleadoOrden").value = orden.empleado_id ? String(orden.empleado_id) : "";
  document.getElementById("fechaIngresoOrden").value = convertirParaInputFecha(orden.fecha_ingreso);
  document.getElementById("horasOrden").value = Number(orden.horas);
  document.getElementById("estadoOrden").value = orden.estado || "ABIERTA";
  document.getElementById("observacionesOrden").value = orden.observaciones || "";

  var contenedor = document.getElementById("lineasRepuestosOrden");
  contenedor.innerHTML = "";
  if (Array.isArray(orden.repuestos) && orden.repuestos.length > 0) {
    orden.repuestos.forEach(function (det) {
      agregarLineaRepuestoOrden(det.repuesto_id, det.cantidad);
    });
  } else {
    agregarLineaRepuestoOrden();
  }

  document.getElementById("btnGuardarOrden").textContent = "Actualizar orden";
  document.getElementById("placaOrden").focus();
}

async function eliminarOrden(id) {
  if (!obtenerTokenOrdenes()) {
    actualizarVistaSesionOrdenes();
    avisarOrden("Debes iniciar sesión para eliminar órdenes de servicio.", "aviso");
    return;
  }
  if (!window.confirm("¿Está seguro de eliminar esta orden de servicio? Los repuestos descontados se reintegrarán al inventario.")) {
    return;
  }

  try {
    var resultado = await llamarApiOrdenes("ordenes/" + encodeURIComponent(id), { method: "DELETE" });
    if (esErrorAutenticacionOrd(resultado)) {
      cerrarSesionOrdenes(false);
      avisarOrden("Tu sesión expiró. Inicia sesión nuevamente.", "aviso");
      return;
    }
    if (!resultado.respuesta.ok) {
      avisarOrden(mensajeApiOrd(resultado.json), "error");
      return;
    }

    avisarOrden("Orden eliminada y stock reintegrado al inventario.", "aviso");
    limpiarFormularioOrden();
    await cargarDatosOrdenes();
  } catch (error) {
    avisarOrden(mensajeErrorConexionOrd(), "error");
  }
}

function pintarTablaOrdenes() {
  var tbody = document.getElementById("tablaOrdenes");
  if (!obtenerTokenOrdenes()) {
    tbody.innerHTML = "";
    return;
  }

  var texto = document.getElementById("buscarOrdenes").value.trim().toLowerCase();
  var filtroEstado = document.getElementById("filtroEstadoOrdenes").value;

  var visibles = listaOrdenesApi.filter(function (ord) {
    if (filtroEstado && ord.estado !== filtroEstado) {
      return false;
    }
    var bolsa = [
      ord.codigo_orden,
      ord.placa,
      ord.vehiculo_marca || "",
      ord.vehiculo_modelo || "",
      ord.cliente_nombre || "",
      ord.empleado_nombre || "",
      ord.observaciones || ""
    ].join(" ").toLowerCase();
    return bolsa.indexOf(texto) !== -1;
  });

  tbody.innerHTML = "";
  if (visibles.length === 0) {
    tbody.innerHTML = '<tr><td class="ord-vacio" colspan="9">No hay órdenes de servicio para mostrar.</td></tr>';
    return;
  }

  visibles.forEach(function (ord) {
    var fila = document.createElement("tr");
    var infoVeh = [ord.vehiculo_marca, ord.vehiculo_modelo, ord.vehiculo_color].filter(Boolean).join(" · ");
    var repResumen = (ord.total_unidades || 0) + " unds · " + formatearMonedaOrd(ord.subtotal_repuestos || 0);

    fila.innerHTML =
      "<td><strong>" + escaparOrd(ord.codigo_orden) + "</strong></td>" +
      "<td>" + escaparOrd(formatearFechaVisible(ord.fecha_ingreso)) + "</td>" +
      "<td><strong>" + escaparOrd(ord.placa) + "</strong>" +
        (infoVeh ? '<span class="ord-subtexto">' + escaparOrd(infoVeh) + "</span>" : "") + "</td>" +
      "<td>" + escaparOrd(ord.cliente_nombre || "Sin asignar") + "</td>" +
      "<td>" + escaparOrd(ord.empleado_nombre || "Sin asignar") +
        (ord.empleado_cargo ? '<span class="ord-subtexto">' + escaparOrd(ord.empleado_cargo) + "</span>" : "") + "</td>" +
      "<td>" + Number(ord.horas).toLocaleString("es-CO") + " h</td>" +
      "<td>" + construirBadgeEstadoOrd(ord.estado) + "</td>" +
      "<td>" + escaparOrd(repResumen) + "</td>" +
      '<td><div class="ord-fila-acciones">' +
      '<button type="button" class="ord-boton ord-boton-detalle" data-accion="detalle" data-id="' + escaparOrd(ord.id) + '">Detalle</button>' +
      '<button type="button" class="ord-boton ord-boton-editar" data-accion="editar" data-id="' + escaparOrd(ord.id) + '">Editar</button>' +
      '<button type="button" class="ord-boton ord-boton-eliminar" data-accion="eliminar" data-id="' + escaparOrd(ord.id) + '">Eliminar</button>' +
      "</div></td>";

    tbody.appendChild(fila);
  });
}

function abrirDetalleOrden(id) {
  var ord = listaOrdenesApi.find(function (o) {
    return String(o.id) === String(id);
  });
  if (!ord) {
    return;
  }

  document.getElementById("detalleTituloOrden").textContent = "Orden " + ord.codigo_orden;
  document.getElementById("detalleEstadoBadge").innerHTML = construirBadgeEstadoOrd(ord.estado);

  var infoVehiculo = [ord.placa, ord.vehiculo_marca, ord.vehiculo_modelo, ord.vehiculo_color].filter(Boolean).join(" · ");
  var grid = document.getElementById("detalleDatosOrden");
  grid.innerHTML =
    '<div class="ord-detalle-dato"><small>Cliente</small><strong>' + escaparOrd(ord.cliente_nombre || "Sin asignar") + "</strong></div>" +
    '<div class="ord-detalle-dato"><small>Vehículo</small><strong>' + escaparOrd(infoVehiculo) + "</strong></div>" +
    '<div class="ord-detalle-dato"><small>Mecánico asignado</small><strong>' + escaparOrd(ord.empleado_nombre || "Sin asignar") + "</strong></div>" +
    '<div class="ord-detalle-dato"><small>Horas empleadas</small><strong>' + Number(ord.horas).toLocaleString("es-CO") + " h</strong></div>" +
    '<div class="ord-detalle-dato"><small>Fecha y hora de ingreso</small><strong>' + escaparOrd(formatearFechaVisible(ord.fecha_ingreso)) + "</strong></div>" +
    '<div class="ord-detalle-dato"><small>Fecha de salida</small><strong>' + escaparOrd(ord.fecha_salida ? formatearFechaVisible(ord.fecha_salida) : "Pendiente") + "</strong></div>" +
    '<div class="ord-detalle-dato" style="grid-column:1 / -1;"><small>Observaciones</small><strong>' + escaparOrd(ord.observaciones || "Sin observaciones") + "</strong></div>";

  var tbody = document.getElementById("detalleRepuestosOrden");
  tbody.innerHTML = "";
  var repuestos = Array.isArray(ord.repuestos) ? ord.repuestos : [];
  if (repuestos.length === 0) {
    tbody.innerHTML = '<tr><td class="ord-vacio" colspan="6">Esta orden no tiene repuestos asociados.</td></tr>';
  } else {
    repuestos.forEach(function (det) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td><strong>" + escaparOrd(det.referencia) + "</strong></td>" +
        "<td>" + escaparOrd(det.descripcion) + "</td>" +
        "<td>" + escaparOrd(det.marca) + "</td>" +
        "<td>" + escaparOrd(det.cantidad) + "</td>" +
        "<td>" + formatearMonedaOrd(det.precio_unitario) + "</td>" +
        "<td><strong>" + formatearMonedaOrd(det.subtotal) + "</strong></td>";
      tbody.appendChild(tr);
    });
  }

  document.getElementById("detalleSubtotalOrden").textContent = formatearMonedaOrd(ord.subtotal_repuestos || 0);
  document.getElementById("modalDetalleOrden").hidden = false;
}

function cerrarDetalleOrden() {
  document.getElementById("modalDetalleOrden").hidden = true;
}

function construirBadgeEstadoOrd(estado) {
  if (estado === "EN_PROCESO") {
    return '<span class="ord-badge ord-badge-proceso">En proceso</span>';
  }
  if (estado === "FINALIZADA") {
    return '<span class="ord-badge ord-badge-finalizada">Finalizada</span>';
  }
  if (estado === "CANCELADA") {
    return '<span class="ord-badge ord-badge-cancelada">Cancelada</span>';
  }
  return '<span class="ord-badge ord-badge-abierta">Abierta</span>';
}

function limpiarFormularioOrden() {
  ordenEnEdicion = null;
  document.getElementById("formOrden").reset();
  document.getElementById("ordenId").value = "";
  document.getElementById("infoVehiculoOrden").value = "";
  document.getElementById("estadoOrden").value = "ABIERTA";
  document.getElementById("btnGuardarOrden").textContent = "Registrar orden";
  inicializarFechaIngresoActual();
  llenarSelectVehiculos("");

  var contenedor = document.getElementById("lineasRepuestosOrden");
  contenedor.innerHTML = "";
  if (obtenerTokenOrdenes()) {
    agregarLineaRepuestoOrden();
  }
  recalcularTotalesFormulario();

  document.querySelectorAll("#formOrden .is-valid, #formOrden .is-invalid").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });
}

function inicializarFechaIngresoActual() {
  var input = document.getElementById("fechaIngresoOrden");
  if (!input) {
    return;
  }
  var ahora = new Date();
  var pad = function (n) {
    return String(n).padStart(2, "0");
  };
  input.value =
    ahora.getFullYear() + "-" +
    pad(ahora.getMonth() + 1) + "-" +
    pad(ahora.getDate()) + "T" +
    pad(ahora.getHours()) + ":" +
    pad(ahora.getMinutes());
}

function convertirParaInputFecha(fechaSql) {
  if (!fechaSql) {
    return "";
  }
  return String(fechaSql).replace(" ", "T").slice(0, 16);
}

function formatearFechaVisible(fechaSql) {
  if (!fechaSql) {
    return "-";
  }
  return String(fechaSql).slice(0, 16);
}

function marcarCampoOrd(campo, esValido) {
  campo.classList.toggle("is-valid", esValido);
  campo.classList.toggle("is-invalid", !esValido);
}

async function llamarApiOrdenes(ruta, opciones) {
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  var token = obtenerTokenOrdenes();
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
    : API_ORDENES_BASE + "/" + String(ruta || "").replace(/^\/+/, "");
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

function mensajeErrorConexionOrd() {
  return "No hay conexión con el servidor del taller. Verifica que el servicio esté activo e intenta nuevamente.";
}

function mensajeApiOrd(json) {
  if (!json) {
    return "El servidor no respondió.";
  }
  if (typeof json.data === "string" && json.data) {
    return json.data;
  }
  return "No fue posible completar la operación.";
}

function avisarOrden(mensaje, tipo) {
  var aviso = document.getElementById("toastOrden");
  aviso.className = "ord-toast ord-toast-" + tipo;
  aviso.textContent = mensaje;
  aviso.hidden = false;
  window.clearTimeout(avisarOrden.temporizador);
  avisarOrden.temporizador = window.setTimeout(function () {
    aviso.hidden = true;
  }, 4500);
}

function formatearMonedaOrd(valor) {
  return "$ " + (Number(valor) || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function escaparOrd(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
