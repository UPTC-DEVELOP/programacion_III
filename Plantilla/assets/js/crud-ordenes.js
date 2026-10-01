// Órdenes de servicio: usan el inventario y descuentan stock
document.addEventListener("DOMContentLoaded", () => {
  const formOrden = document.getElementById("formOrden");
  const placaInput = document.getElementById("placaOrden");
  const clienteInput = document.getElementById("clienteOrden");
  const mecanicoInput = document.getElementById("mecanicoOrden");
  const horasInput = document.getElementById("horasOrden");

  placaInput.addEventListener("input", function () {
    this.value = this.value.toUpperCase();
    const regexPlaca = /^[A-Z]{3}-?[0-9]{3}[A-Z]?$/;
    validarCampoOrden(this, regexPlaca.test(this.value));
  });

  clienteInput.addEventListener("input", function () {
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,100}$/;
    validarCampoOrden(this, regexNombre.test(this.value.trim()));
  });

  mecanicoInput.addEventListener("input", function () {
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,100}$/;
    validarCampoOrden(this, regexNombre.test(this.value.trim()));
  });

  horasInput.addEventListener("input", function () {
    const regexHoras = /^\d+(\.\d{1,2})?$/;
    validarCampoOrden(this, regexHoras.test(this.value) && Number(this.value) > 0);
  });

  formOrden.addEventListener("submit", function (e) {
    e.preventDefault();

    const placa = document.getElementById("placaOrden").value.trim().toUpperCase();
    const cliente = document.getElementById("clienteOrden").value.trim();
    const mecanico = document.getElementById("mecanicoOrden").value.trim();
    const horas = document.getElementById("horasOrden").value.trim();
    const estado = document.getElementById("estadoOrden").value;
    const id = document.getElementById("ordenId").value;
    const lineas = leerLineasRepuesto();
    const listaOrdenes = obtenerOrdenes();

    if (!/^[A-Z]{3}-?[0-9]{3}[A-Z]?$/.test(placa) || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,100}$/.test(cliente) || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,100}$/.test(mecanico) || !/^\d+(\.\d{1,2})?$/.test(horas) || Number(horas) <= 0) {
      mostrarAlertaOrden("Por favor complete todos los campos con un formato válido.", "danger");
      return;
    }

    if (lineas.length === 0) {
      mostrarAlertaOrden("Debe indicar al menos un repuesto del inventario.", "danger");
      return;
    }

    const previa = id ? listaOrdenes.find(o => idOrden(o) === id) : null;
    if (previa && previa.repuestos) {
      ajustarStockTaller(previa.repuestos, 1);
    }

    let stockOk = true;
    for (let i = 0; i < lineas.length; i++) {
      const item = buscarInventario(lineas[i].referencia);
      if (!item || lineas[i].cantidad > item.stock) {
        stockOk = false;
        mostrarAlertaOrden("Stock insuficiente para " + lineas[i].referencia + ".", "warning");
        break;
      }
    }

    if (!stockOk) {
      if (previa && previa.repuestos) {
        ajustarStockTaller(previa.repuestos, -1);
      }
      return;
    }

    if (id && previa) {
      const index = listaOrdenes.findIndex(o => idOrden(o) === id);
      listaOrdenes[index] = { id, placa, cliente, mecanico, horas: Number(horas), estado, repuestos: lineas };
      mostrarAlertaOrden("Orden actualizada con éxito.", "success");
    } else {
      const nuevoId = siguienteIdOrden();
      listaOrdenes.push({ id: nuevoId, placa, cliente, mecanico, horas: Number(horas), estado, repuestos: lineas });
      mostrarAlertaOrden("Orden " + nuevoId + " registrada correctamente.", "success");
    }

    ajustarStockTaller(lineas, -1);
    guardarOrdenes(listaOrdenes);
    renderizarTablaOrdenes();
    limpiarFormularioOrden();
  });

  if (document.getElementById("lineasRepuestos").children.length === 0) {
    agregarLineaRepuesto();
  }
  renderizarTablaOrdenes();
});

function opcionesInventarioOrden() {
  const inventario = obtenerInventario();
  return inventario.map(item => {
    const extra = buscarRepuesto(item.referencia);
    const nombre = extra ? extra.descripcion : item.referencia;
    return `<option value="${item.referencia}">${item.referencia} — ${nombre} (${item.stock} unds)</option>`;
  }).join("");
}

function agregarLineaRepuesto(referencia, cantidad) {
  const wrap = document.getElementById("lineasRepuestos");
  const fila = document.createElement("div");
  fila.className = "row g-2 mb-2 linea-repuesto";
  fila.innerHTML = `
    <div class="col-md-7">
      <select class="form-select linea-ref" required>
        <option value="">Seleccione un repuesto</option>
        ${opcionesInventarioOrden()}
      </select>
    </div>
    <div class="col-md-3">
      <input type="number" min="1" step="1" class="form-control linea-cant" placeholder="Cant." value="${cantidad || 1}" required>
    </div>
    <div class="col-md-2">
      <button type="button" class="btn btn-outline-danger w-100" onclick="this.parentElement.parentElement.remove()">Quitar</button>
    </div>
  `;
  wrap.appendChild(fila);
  if (referencia) {
    fila.querySelector(".linea-ref").value = referencia;
  }
}

function leerLineasRepuesto() {
  const filas = document.querySelectorAll("#lineasRepuestos .linea-repuesto");
  const lineas = [];
  filas.forEach(fila => {
    const referencia = fila.querySelector(".linea-ref").value;
    const cantidad = Number(fila.querySelector(".linea-cant").value);
    if (referencia && cantidad > 0) {
      lineas.push({ referencia, cantidad });
    }
  });
  return lineas;
}

function textoRepuestos(orden) {
  if (!orden.repuestos || !orden.repuestos.length) {
    return "—";
  }
  return orden.repuestos.map(r => r.referencia + " x" + r.cantidad).join(", ");
}

function validarCampoOrden(input, esValido) {
  if (esValido) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  } else {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
  }
}

function renderizarTablaOrdenes() {
  const tbody = document.getElementById("tablaOrdenes");
  const listaOrdenes = obtenerOrdenes();
  tbody.innerHTML = "";

  if (listaOrdenes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No hay órdenes de servicio registradas en el sistema.</td></tr>`;
    return;
  }

  listaOrdenes.forEach(orden => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${idOrden(orden)}</strong></td>
        <td>${orden.placa}</td>
        <td>${orden.cliente}</td>
        <td>${orden.mecanico}</td>
        <td>${orden.horas}</td>
        <td>${orden.estado}</td>
        <td>${textoRepuestos(orden)}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="cargarParaEditarOrden('${idOrden(orden)}')">✏️ Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarOrden('${idOrden(orden)}')">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  });
}

function cargarParaEditarOrden(id) {
  const orden = obtenerOrdenes().find(o => idOrden(o) === id);
  if (orden) {
    document.getElementById("ordenId").value = idOrden(orden);
    document.getElementById("placaOrden").value = orden.placa;
    document.getElementById("clienteOrden").value = orden.cliente;
    document.getElementById("mecanicoOrden").value = orden.mecanico;
    document.getElementById("horasOrden").value = orden.horas;
    document.getElementById("estadoOrden").value = orden.estado;
    document.getElementById("lineasRepuestos").innerHTML = "";
    const lineas = orden.repuestos && orden.repuestos.length ? orden.repuestos : [{ referencia: "", cantidad: 1 }];
    lineas.forEach(linea => agregarLineaRepuesto(linea.referencia, linea.cantidad));
    document.getElementById("btnGuardarOrden").innerText = "Actualizar Orden";
    document.getElementById("btnGuardarOrden").className = "btn btn-warning";
  }
}

function eliminarOrden(id) {
  if (!confirm("¿Está seguro de eliminar esta orden de servicio? El stock se devolverá al inventario.")) {
    return;
  }
  const listaOrdenes = obtenerOrdenes();
  const previa = listaOrdenes.find(o => idOrden(o) === id);
  if (previa && previa.repuestos) {
    ajustarStockTaller(previa.repuestos, 1);
  }
  guardarOrdenes(listaOrdenes.filter(o => idOrden(o) !== id));
  renderizarTablaOrdenes();
  mostrarAlertaOrden("Orden eliminada y stock restaurado.", "warning");
}

function limpiarFormularioOrden() {
  document.getElementById("formOrden").reset();
  document.getElementById("ordenId").value = "";
  document.getElementById("btnGuardarOrden").innerText = "Registrar Orden";
  document.getElementById("btnGuardarOrden").className = "btn btn-success";
  document.getElementById("lineasRepuestos").innerHTML = "";
  agregarLineaRepuesto();
  document.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
    el.classList.remove("is-valid", "is-invalid");
  });
}

function mostrarAlertaOrden(mensaje, tipo) {
  const alerta = document.getElementById("alertaOrden");
  if (alerta) {
    alerta.className = `alert alert-${tipo} animate__animated animate__fadeIn d-block mb-3`;
    alerta.innerText = mensaje;
    alerta.classList.remove("d-none");
    setTimeout(() => alerta.classList.add("d-none"), 3500);
  }
}
