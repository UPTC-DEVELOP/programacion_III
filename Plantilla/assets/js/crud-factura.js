document.addEventListener("DOMContentLoaded", function () {
  protegerRutaFactura();
  const sesion = obtenerSesionTaller();
  if (!sesion) {
    return;
  }

  const etiquetaUsuario = document.getElementById("usuarioSesion");
  if (etiquetaUsuario) {
    etiquetaUsuario.innerText = sesion.userName || "sesión activa";
  }

  document.getElementById("btnCerrarSesion").addEventListener("click", function () {
    cerrarSesionTaller();
    window.location.replace("login.html");
  });

  const formFactura = document.getElementById("formFactura");
  const btnEmitir = document.getElementById("btnEmitirFactura");
  document.getElementById("fechaVencimiento").value = fechaHoy();
  document.getElementById("consecutivoDcto").value = siguienteConsecutivoFactura();

  cargarConfigFactura().then(function () {
    mostrarUltimaFactura();
  });
  llenarSelectClientesTaller();
  agregarLineaItemFactura();
  calcularTotalesFactura();
  enlazarValidacionEnVivo();

  document.getElementById("clienteTaller").addEventListener("change", aplicarClienteTaller);
  document.getElementById("lineasItems").addEventListener("input", function (evento) {
    calcularTotalesFactura();
    if (evento.target && evento.target.classList.contains("form-control")) {
      validarInputItem(evento.target);
    }
  });
  document.getElementById("btnAgregarItem").addEventListener("click", function () {
    agregarLineaItemFactura();
    calcularTotalesFactura();
  });

  formFactura.addEventListener("submit", async function (e) {
    e.preventDefault();
    mostrarResultadoFactura("");
    const payload = armarPayloadFactura();
    if (!payload) {
      mostrarAlertaFactura("Revise los campos marcados en rojo.", "danger");
      enfocarPrimerError();
      return;
    }

    btnEmitir.disabled = true;
    btnEmitir.innerText = "Emitiendo...";
    mostrarAlertaFactura("Enviando factura nacional a Clarisa...", "info");

    try {
      const resultado = await emitirFacturaNacional(payload, obtenerTokenTaller());
      const json = resultado.json || {};
      if (resultado.status === 401) {
        mostrarAlertaFactura(extraerMensajeClarisa(json, "La sesión expiró. Inicie sesión otra vez."), "danger");
        cerrarSesionTaller();
        window.setTimeout(function () {
          window.location.replace("login.html");
        }, 1400);
        return;
      }
      if ((resultado.status === 200 && json.success !== false) || facturaEnValidacion(json)) {
        guardarConsecutivoFactura(payload.consecutivoDcto);
        const numero = (payload.prefijoDcto || "") + payload.consecutivoDcto;
        let estado = null;
        try {
          estado = await consultarEstadoFactura(payload.nit, numero, obtenerTokenTaller());
        } catch (e) {
          estado = null;
        }
        const data = estado && estado.json && estado.json.data ? estado.json.data : {};
        recordarFacturaEmitida(payload.nit, numero);
        mostrarAlertaFactura("Factura recibida por Clarisa. La DIAN la está verificando.", "success");
        pintarEstadoFactura(data, numero);
        return;
      }
      marcarErroresClarisa(json);
      mostrarAlertaFactura(extraerMensajeClarisa(json, "El API rechazó la factura."), "danger");
      enfocarPrimerError();
    } catch (error) {
      mostrarAlertaFactura(error.message || "No fue posible emitir la factura.", "danger");
    } finally {
      btnEmitir.disabled = false;
      btnEmitir.innerText = "Emitir factura nacional";
    }
  });
});

function fechaHoy() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return fecha.getFullYear() + "-" + mes + "-" + dia;
}

function siguienteConsecutivoFactura() {
  const actual = Number(localStorage.getItem("olimac_consecutivo_factura") || "0");
  return String(actual + 1);
}

function guardarConsecutivoFactura(valor) {
  const numero = Number(valor) || 0;
  const actual = Number(localStorage.getItem("olimac_consecutivo_factura") || "0");
  if (numero > actual) {
    localStorage.setItem("olimac_consecutivo_factura", String(numero));
  }
}

async function cargarConfigFactura() {
  const config = await obtenerConfigClarisa();
  if (config.nit) {
    document.getElementById("nitEmisor").value = config.nit;
  }
  if (config.numeroResolucion) {
    document.getElementById("numeroResolucion").value = config.numeroResolucion;
  }
  if (config.prefijoDcto) {
    document.getElementById("prefijoDcto").value = config.prefijoDcto;
  }
  if (config.consecutivoDcto) {
    const sugerido = Number(config.consecutivoDcto);
    const actual = Number(document.getElementById("consecutivoDcto").value || "0");
    if (sugerido > actual) {
      document.getElementById("consecutivoDcto").value = String(sugerido);
    }
  }
}

function llenarSelectClientesTaller() {
  const select = document.getElementById("clienteTaller");
  const clientes = JSON.parse(localStorage.getItem("olimac_clientes") || "[]");
  select.innerHTML = "<option value=\"\">Seleccione un cliente del taller (opcional)</option>";
  clientes.forEach(function (cliente) {
    select.innerHTML += "<option value=\"" + cliente.cedula + "\">" + cliente.nombre + " — " + cliente.cedula + "</option>";
  });
}

function aplicarClienteTaller() {
  const cedula = document.getElementById("clienteTaller").value;
  const clientes = JSON.parse(localStorage.getItem("olimac_clientes") || "[]");
  const cliente = clientes.find(function (item) {
    return item.cedula === cedula;
  });
  if (!cliente) {
    return;
  }
  document.getElementById("nombreRazonSocial").value = cliente.nombre || "";
  document.getElementById("numIdentificacion").value = cliente.cedula || "";
  document.getElementById("emailCliente").value = cliente.correo || "";
  document.getElementById("telefonoCliente").value = cliente.telefono || "";
  document.getElementById("tipoIdentificacion").value = "CC";
  document.getElementById("naturalezaCliente").value = "NATURAL";
}

function agregarLineaItemFactura() {
  const wrap = document.getElementById("lineasItems");
  const fila = document.createElement("div");
  fila.className = "row g-2 mb-2 linea-item";
  fila.innerHTML = `
    <fieldset class="col-md-4">
      <label class="form-label text-dark fw-bold">Ítem / servicio</label>
      <input type="text" class="form-control item-nombre" maxlength="1000" placeholder="Alineacion" required>
      <p class="invalid-feedback">El nombre del ítem es obligatorio (mínimo 4 caracteres).</p>
    </fieldset>
    <fieldset class="col-md-2">
      <label class="form-label text-dark fw-bold">Código</label>
      <input type="text" class="form-control item-codigo" maxlength="15" placeholder="SRV01" required>
      <p class="invalid-feedback">El código del ítem es obligatorio.</p>
    </fieldset>
    <fieldset class="col-md-2">
      <label class="form-label text-dark fw-bold">Cantidad</label>
      <input type="number" min="1" step="1" class="form-control item-cantidad" value="1" required>
      <p class="invalid-feedback">La cantidad debe ser mayor a 0.</p>
    </fieldset>
    <fieldset class="col-md-2">
      <label class="form-label text-dark fw-bold">Precio base</label>
      <input type="number" min="0" step="0.01" class="form-control item-precio" placeholder="100000" required>
      <p class="invalid-feedback">El precio base es obligatorio.</p>
    </fieldset>
    <fieldset class="col-md-1">
      <label class="form-label text-dark fw-bold">IVA %</label>
      <input type="number" min="0" max="100" step="1" class="form-control item-iva" value="19" required>
      <p class="invalid-feedback">IVA entre 0 y 100.</p>
    </fieldset>
    <fieldset class="col-md-1 d-flex align-items-end">
      <button type="button" class="btn btn-outline-danger w-100" onclick="this.closest('.linea-item').remove(); calcularTotalesFactura();">Quitar</button>
    </fieldset>
  `;
  wrap.appendChild(fila);
}

function leerLineasFactura() {
  const filas = document.querySelectorAll("#lineasItems .linea-item");
  const lineas = [];
  filas.forEach(function (fila) {
    lineas.push({
      nombre: fila.querySelector(".item-nombre").value.trim(),
      codigo: fila.querySelector(".item-codigo").value.trim(),
      cantidad: Number(fila.querySelector(".item-cantidad").value),
      precio: Number(fila.querySelector(".item-precio").value),
      iva: Number(fila.querySelector(".item-iva").value),
      fila: fila
    });
  });
  return lineas;
}

function calcularTotalesFactura() {
  const lineas = leerLineasFactura();
  let subtotal = 0;
  let impuestos = 0;
  lineas.forEach(function (linea) {
    if (linea.cantidad > 0 && linea.precio >= 0) {
      const base = linea.precio * linea.cantidad;
      subtotal += base;
      impuestos += base * ((linea.iva || 0) / 100);
    }
  });
  const total = subtotal + impuestos;
  document.getElementById("subtotalFactura").innerText = formatearDinero(subtotal);
  document.getElementById("impuestosFactura").innerText = formatearDinero(impuestos);
  document.getElementById("totalFactura").innerText = formatearDinero(total);
  return { subtotal: subtotal, impuestos: impuestos, total: total };
}

function formatearDinero(valor) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(valor || 0);
}

function validarCampoFactura(input, esValido, mensaje) {
  const feedback = input.parentElement.querySelector(".invalid-feedback");
  if (esValido) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  } else {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
    if (feedback && mensaje) {
      feedback.innerText = mensaje;
    }
  }
  return esValido;
}

function enfocarPrimerError() {
  const primero = document.querySelector("#formFactura .is-invalid");
  if (primero) {
    primero.scrollIntoView({ behavior: "smooth", block: "center" });
    primero.focus();
  }
}

function enlazarValidacionEnVivo() {
  const reglas = [
    ["nitEmisor", function (valor) { return /^[0-9]{3,13}$/.test(valor); }, "El NIT emisor es obligatorio (3 a 13 dígitos, sin DV)."],
    ["numeroResolucion", function (valor) { return /^[0-9]{1,14}$/.test(valor); }, "La resolución DIAN es obligatoria (solo números)."],
    ["consecutivoDcto", function (valor) { return Number(valor) > 0; }, "Indique un consecutivo mayor a 0."],
    ["fechaVencimiento", function (valor) { return valor.length === 10; }, "La fecha de vencimiento es obligatoria."],
    ["nombreRazonSocial", function (valor) { return valor.trim().length >= 5; }, "Mínimo 5 caracteres (ej. CONSUMIDOR FINAL)."],
    ["numIdentificacion", function (valor) { return /^[0-9]{3,13}$/.test(valor); }, "Solo dígitos, 3 a 13 (ej. 222222222222)."],
    ["emailCliente", function (valor) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor); }, "Ingrese un correo válido."],
    ["telefonoCliente", function (valor) { return valor === "" || /^[0-9]{7,15}$/.test(valor); }, "El teléfono debe ser numérico (máximo 15 dígitos)."],
    ["ciudadCliente", function (valor) { return valor === "" || /^[0-9]{5}$/.test(valor); }, "Use el código DANE de 5 dígitos (Tunja: 15001)."]
  ];
  reglas.forEach(function (regla) {
    const input = document.getElementById(regla[0]);
    if (!input) {
      return;
    }
    input.addEventListener("input", function () {
      validarCampoFactura(this, regla[1](this.value.trim()), regla[2]);
    });
  });
}

function validarInputItem(input) {
  if (input.classList.contains("item-nombre")) {
    validarCampoFactura(input, input.value.trim().length >= 4, "El nombre del ítem es obligatorio (mínimo 4 caracteres).");
  } else if (input.classList.contains("item-codigo")) {
    validarCampoFactura(input, input.value.trim().length > 0, "El código del ítem es obligatorio.");
  } else if (input.classList.contains("item-cantidad")) {
    validarCampoFactura(input, Number(input.value) > 0, "La cantidad debe ser mayor a 0.");
  } else if (input.classList.contains("item-precio")) {
    validarCampoFactura(input, input.value !== "" && Number(input.value) >= 0, "El precio base es obligatorio.");
  } else if (input.classList.contains("item-iva")) {
    validarCampoFactura(input, input.value !== "" && Number(input.value) >= 0 && Number(input.value) <= 100, "IVA entre 0 y 100.");
  }
}

function validarFormularioFactura() {
  let valido = true;
  valido = validarCampoFactura(document.getElementById("nitEmisor"), /^[0-9]{3,13}$/.test(document.getElementById("nitEmisor").value.trim()), "El NIT emisor es obligatorio (3 a 13 dígitos, sin DV).") && valido;
  valido = validarCampoFactura(document.getElementById("numeroResolucion"), /^[0-9]{1,14}$/.test(document.getElementById("numeroResolucion").value.trim()), "La resolución DIAN es obligatoria (solo números).") && valido;
  valido = validarCampoFactura(document.getElementById("consecutivoDcto"), Number(document.getElementById("consecutivoDcto").value) > 0, "Indique un consecutivo mayor a 0.") && valido;
  valido = validarCampoFactura(document.getElementById("fechaVencimiento"), document.getElementById("fechaVencimiento").value.length === 10, "La fecha de vencimiento es obligatoria.") && valido;
  valido = validarCampoFactura(document.getElementById("nombreRazonSocial"), document.getElementById("nombreRazonSocial").value.trim().length >= 5, "Mínimo 5 caracteres (ej. CONSUMIDOR FINAL).") && valido;
  valido = validarCampoFactura(document.getElementById("numIdentificacion"), /^[0-9]{3,13}$/.test(document.getElementById("numIdentificacion").value.trim()), "Solo dígitos, 3 a 13 (ej. 222222222222).") && valido;
  valido = validarCampoFactura(document.getElementById("emailCliente"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById("emailCliente").value.trim()), "Ingrese un correo válido.") && valido;

  const telefono = document.getElementById("telefonoCliente").value.trim();
  if (telefono) {
    valido = validarCampoFactura(document.getElementById("telefonoCliente"), /^[0-9]{7,15}$/.test(telefono), "El teléfono debe ser numérico (máximo 15 dígitos).") && valido;
  }

  const filas = document.querySelectorAll("#lineasItems .linea-item");
  if (filas.length === 0) {
    mostrarAlertaFactura("Debe agregar al menos un ítem o servicio.", "danger");
    return false;
  }
  filas.forEach(function (fila) {
    validarInputItem(fila.querySelector(".item-nombre"));
    validarInputItem(fila.querySelector(".item-codigo"));
    validarInputItem(fila.querySelector(".item-cantidad"));
    validarInputItem(fila.querySelector(".item-precio"));
    validarInputItem(fila.querySelector(".item-iva"));
    if (fila.querySelector(".is-invalid")) {
      valido = false;
    }
  });
  return valido;
}

function armarPayloadFactura() {
  if (!validarFormularioFactura()) {
    return null;
  }

  const nit = document.getElementById("nitEmisor").value.trim();
  const numeroResolucion = document.getElementById("numeroResolucion").value.trim();
  const prefijoDcto = document.getElementById("prefijoDcto").value.trim();
  const consecutivoDcto = Number(document.getElementById("consecutivoDcto").value);
  const fechaVencimiento = document.getElementById("fechaVencimiento").value;
  const formaPago = document.getElementById("formaPago").value;
  const mediosPago = document.getElementById("mediosPago").value;
  const nombreRazonSocial = document.getElementById("nombreRazonSocial").value.trim();
  const tipoIdentificacion = document.getElementById("tipoIdentificacion").value;
  const numIdentificacion = document.getElementById("numIdentificacion").value.trim();
  const naturaleza = document.getElementById("naturalezaCliente").value;
  const direccion = document.getElementById("direccionCliente").value.trim();
  const ciudad = document.getElementById("ciudadCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();
  const email = document.getElementById("emailCliente").value.trim();
  const respFiscales = document.getElementById("respFiscales").value;
  const respTributarias = document.getElementById("respTributarias").value;
  const observacion = document.getElementById("observacionFactura").value.trim();
  const lineas = leerLineasFactura();
  const totales = calcularTotalesFactura();

  const items = lineas.map(function (linea) {
    const item = {
      codigo: linea.codigo,
      nombreItem: linea.nombre,
      nombreItemVenta: linea.nombre,
      precioBaseUnitario: linea.precio,
      cantidad: linea.cantidad,
      unidad: "94",
      observacion: linea.nombre,
      impuestos: [{
        tipo: linea.iva === 0 ? "EXE" : "IVA",
        claseImpuesto: "PO",
        tarifaTributo: linea.iva
      }]
    };
    return item;
  });

  const cliente = {
    nombreRazonSocial: nombreRazonSocial,
    tipoIdentificacion: tipoIdentificacion,
    numIdentificacion: numIdentificacion,
    naturaleza: naturaleza,
    respFiscales: respFiscales,
    respTributarias: respTributarias,
    email: email
  };
  if (direccion) {
    cliente.direccion = direccion;
  }
  if (ciudad) {
    cliente.ciudad = ciudad;
  }
  if (telefono) {
    cliente.telefono = telefono;
  }

  const payload = {
    nit: nit,
    numeroResolucion: numeroResolucion,
    consecutivoDcto: String(consecutivoDcto),
    fechaVencimiento: fechaVencimiento,
    formaPago: formaPago,
    mediosPago: [mediosPago],
    total: Number(totales.total.toFixed(2)),
    cliente: cliente,
    items: items
  };
  if (prefijoDcto) {
    payload.prefijoDcto = prefijoDcto;
  }

  if (observacion) {
    payload.observacion = observacion;
  }
  return payload;
}

function marcarErroresClarisa(json) {
  const data = json && json.data ? json.data : {};
  const lista = Array.isArray(data.errores) ? data.errores : [];
  if (!lista.length) {
    return false;
  }
  let marcado = false;
  lista.forEach(function (error) {
    const texto = String(error.errorMessage || error.mensaje || error.message || "").toLowerCase();
    const codigo = String(error.codError || "").toUpperCase();
    if (codigo === "VOFAC01" || texto.indexOf("nit") !== -1) {
      validarCampoFactura(document.getElementById("nitEmisor"), false, error.errorMessage || "El NIT emisor es obligatorio.");
      marcado = true;
    }
    if (codigo === "VOITE01" || texto.indexOf("codigo") !== -1) {
      document.querySelectorAll(".item-codigo").forEach(function (input) {
        validarCampoFactura(input, false, error.errorMessage || "El código del ítem es obligatorio.");
      });
      marcado = true;
    }
    if (codigo === "VOITE02" || texto.indexOf("nombreitem") !== -1 || texto.indexOf("nombre item") !== -1) {
      document.querySelectorAll(".item-nombre").forEach(function (input) {
        validarCampoFactura(input, false, error.errorMessage || "El nombre del ítem es obligatorio.");
      });
      marcado = true;
    }
    if (texto.indexOf("resolucion") !== -1) {
      validarCampoFactura(document.getElementById("numeroResolucion"), false, error.errorMessage || "Revise la resolución DIAN.");
      marcado = true;
    }
    if (texto.indexOf("consecutivo") !== -1) {
      validarCampoFactura(document.getElementById("consecutivoDcto"), false, error.errorMessage || "Revise el consecutivo.");
      marcado = true;
    }
    if (texto.indexOf("email") !== -1 || texto.indexOf("correo") !== -1) {
      validarCampoFactura(document.getElementById("emailCliente"), false, error.errorMessage || "Revise el correo del adquiriente.");
      marcado = true;
    }
  });
  return marcado;
}

function facturaEnValidacion(json) {
  const texto = JSON.stringify(json || "").toLowerCase();
  return texto.indexOf("proceso de valid") !== -1;
}

function recordarFacturaEmitida(nit, numero) {
  localStorage.setItem("olimac_ultima_factura", JSON.stringify({ nit: nit, numero: numero }));
}

async function mostrarUltimaFactura() {
  let guardada = null;
  try {
    guardada = JSON.parse(localStorage.getItem("olimac_ultima_factura") || "null");
  } catch (e) {
    guardada = null;
  }
  if (!guardada || !guardada.nit || !guardada.numero) {
    const nit = document.getElementById("nitEmisor").value.trim();
    const prefijo = document.getElementById("prefijoDcto").value.trim();
    const consecutivo = Number(document.getElementById("consecutivoDcto").value);
    if (!nit || !prefijo || !(consecutivo > 1)) {
      return;
    }
    guardada = { nit: nit, numero: prefijo + String(consecutivo - 1) };
  }
  let estado = null;
  try {
    estado = await consultarEstadoFactura(guardada.nit, guardada.numero, obtenerTokenTaller());
  } catch (e) {
    estado = null;
  }
  const data = estado && estado.json && estado.json.data ? estado.json.data : null;
  if (!data || !data.numeroDocumento) {
    return;
  }
  recordarFacturaEmitida(guardada.nit, data.numeroDocumento);
  mostrarAlertaFactura("Última factura consultada en Clarisa.", "success");
  pintarEstadoFactura(data, data.numeroDocumento);
}

function pintarEstadoFactura(data, numero) {
  const caja = document.getElementById("resultadoFactura");
  if (!caja) {
    return;
  }
  document.getElementById("resNumero").innerText = (data && data.numeroDocumento) || numero || "—";
  document.getElementById("resClarisa").innerText = (data && data.estadoClarisa) || "—";
  document.getElementById("resDian").innerText = (data && data.estadoDIAN) || "—";
  document.getElementById("resCufe").innerText = (data && (data.uuid || data.cufe || data.CUFE || data.cufeDocumento)) || "Aún no reportado";
  caja.classList.remove("d-none");
}

function mostrarAlertaFactura(mensaje, tipo) {
  const alerta = document.getElementById("alertaFactura");
  if (alerta) {
    alerta.className = "alert alert-" + tipo + " animate__animated animate__fadeIn d-block mb-3";
    alerta.innerText = mensaje;
    alerta.classList.remove("d-none");
  }
}

function mostrarResultadoFactura(texto) {
  const caja = document.getElementById("resultadoFactura");
  if (!caja || texto) {
    return;
  }
  caja.classList.add("d-none");
  document.getElementById("resNumero").innerText = "—";
  document.getElementById("resClarisa").innerText = "—";
  document.getElementById("resDian").innerText = "—";
  document.getElementById("resCufe").innerText = "—";
}
