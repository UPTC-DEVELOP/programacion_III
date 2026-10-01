// Inventario: stock de las referencias del catálogo de repuestos
document.addEventListener("DOMContentLoaded", () => {
  const formInventario = document.getElementById("formInventario");
  const referenciaSelect = document.getElementById("referenciaInventario");
  const stockInput = document.getElementById("stockInventario");
  const stockMinimoInput = document.getElementById("stockMinimoInventario");

  llenarSelectInventario();

  referenciaSelect.addEventListener("change", function () {
    const extra = buscarRepuesto(this.value);
    document.getElementById("descripcionInventario").value = extra ? extra.descripcion : "";
    validarCampoInventario(this, this.value !== "");
  });

  stockInput.addEventListener("input", function () {
    const regexEntero = /^\d+$/;
    validarCampoInventario(this, regexEntero.test(this.value));
  });

  stockMinimoInput.addEventListener("input", function () {
    const regexEntero = /^\d+$/;
    validarCampoInventario(this, regexEntero.test(this.value));
  });

  formInventario.addEventListener("submit", function (e) {
    e.preventDefault();

    const referencia = document.getElementById("referenciaInventario").value;
    const stock = document.getElementById("stockInventario").value.trim();
    const stockMinimo = document.getElementById("stockMinimoInventario").value.trim();
    const id = document.getElementById("inventarioId").value;
    const listaInventario = obtenerInventario();

    if (!referencia || !buscarRepuesto(referencia) || !/^\d+$/.test(stock) || !/^\d+$/.test(stockMinimo)) {
      mostrarAlertaInventario("La referencia debe existir en el catálogo y el stock debe ser un entero mayor o igual a 0.", "danger");
      return;
    }

    if (listaInventario.some(i => i.referencia === referencia && i.referencia !== id)) {
      mostrarAlertaInventario("Esa referencia ya tiene stock registrado. Edítela desde la tabla.", "warning");
      return;
    }

    const registro = { referencia, stock: Number(stock), stockMinimo: Number(stockMinimo) };

    if (id) {
      const index = listaInventario.findIndex(i => i.referencia === id);
      if (index !== -1) {
        listaInventario[index] = registro;
        mostrarAlertaInventario("Inventario actualizado con éxito.", "success");
      }
    } else {
      listaInventario.push(registro);
      mostrarAlertaInventario("Registro de inventario guardado correctamente.", "success");
    }

    guardarInventario(listaInventario);
    renderizarTablaInventario();
    limpiarFormularioInventario();
  });

  renderizarTablaInventario();
});

function llenarSelectInventario(valor) {
  const select = document.getElementById("referenciaInventario");
  const catalogo = obtenerRepuestos();
  select.innerHTML = `<option value="">Seleccione una referencia del catálogo</option>`;
  catalogo.forEach(repuesto => {
    select.innerHTML += `<option value="${repuesto.referencia}">${repuesto.referencia} — ${repuesto.descripcion}</option>`;
  });
  if (valor) {
    select.value = valor;
  }
}

function validarCampoInventario(input, esValido) {
  if (esValido) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  } else {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
  }
}

function renderizarTablaInventario() {
  const tbody = document.getElementById("tablaInventario");
  const listaInventario = obtenerInventario();
  tbody.innerHTML = "";

  if (listaInventario.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay registros de inventario en el sistema.</td></tr>`;
    return;
  }

  listaInventario.forEach(item => {
    const extra = buscarRepuesto(item.referencia);
    const descripcion = extra ? extra.descripcion : "—";
    const claseStock = item.stock <= item.stockMinimo ? "text-danger fw-bold" : "";
    tbody.innerHTML += `
      <tr>
        <td><strong>${item.referencia}</strong></td>
        <td>${descripcion}</td>
        <td class="${claseStock}">${item.stock}</td>
        <td>${item.stockMinimo}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="cargarParaEditarInventario('${item.referencia}')">✏️ Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarInventario('${item.referencia}')">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  });
}

function cargarParaEditarInventario(referencia) {
  const item = buscarInventario(referencia);
  if (item) {
    llenarSelectInventario(item.referencia);
    document.getElementById("inventarioId").value = item.referencia;
    const extra = buscarRepuesto(item.referencia);
    document.getElementById("descripcionInventario").value = extra ? extra.descripcion : "";
    document.getElementById("stockInventario").value = item.stock;
    document.getElementById("stockMinimoInventario").value = item.stockMinimo;
    document.getElementById("btnGuardarInventario").innerText = "Actualizar Inventario";
    document.getElementById("btnGuardarInventario").className = "btn btn-warning";
  }
}

function eliminarInventario(referencia) {
  if (confirm("¿Está seguro de eliminar este registro de inventario?")) {
    guardarInventario(obtenerInventario().filter(i => i.referencia !== referencia));
    renderizarTablaInventario();
    mostrarAlertaInventario("Registro de inventario eliminado del sistema.", "warning");
  }
}

function limpiarFormularioInventario() {
  document.getElementById("formInventario").reset();
  document.getElementById("inventarioId").value = "";
  document.getElementById("descripcionInventario").value = "";
  document.getElementById("btnGuardarInventario").innerText = "Registrar en Inventario";
  document.getElementById("btnGuardarInventario").className = "btn btn-success";
  llenarSelectInventario();
  document.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
    el.classList.remove("is-valid", "is-invalid");
  });
}

function mostrarAlertaInventario(mensaje, tipo) {
  const alerta = document.getElementById("alertaInventario");
  if (alerta) {
    alerta.className = `alert alert-${tipo} animate__animated animate__fadeIn d-block mb-3`;
    alerta.innerText = mensaje;
    alerta.classList.remove("d-none");
    setTimeout(() => alerta.classList.add("d-none"), 3500);
  }
}
