// Catálogo de repuestos (compartido con inventario y órdenes)
document.addEventListener("DOMContentLoaded", () => {
  const formRepuesto = document.getElementById("formRepuesto");
  const referenciaInput = document.getElementById("referenciaRepuesto");
  const descripcionInput = document.getElementById("descripcionRepuesto");
  const marcaInput = document.getElementById("marcaRepuesto");
  const precioInput = document.getElementById("precioRepuesto");

  // Validaciones en tiempo real con expresiones regulares (Regex)
  referenciaInput.addEventListener("input", function () {
    this.value = this.value.toUpperCase();
    const regexRef = /^[A-Z0-9-]{3,20}$/;
    validarCampoRepuesto(this, regexRef.test(this.value));
  });

  descripcionInput.addEventListener("input", function () {
    validarCampoRepuesto(this, this.value.trim().length > 0 && this.value.trim().length <= 150);
  });

  marcaInput.addEventListener("input", function () {
    validarCampoRepuesto(this, this.value.trim().length > 0 && this.value.trim().length <= 50);
  });

  precioInput.addEventListener("input", function () {
    const regexPrecio = /^\d+(\.\d{1,2})?$/;
    validarCampoRepuesto(this, regexPrecio.test(this.value) && Number(this.value) > 0);
  });

  formRepuesto.addEventListener("submit", function (e) {
    e.preventDefault();

    const referencia = document.getElementById("referenciaRepuesto").value.trim().toUpperCase();
    const descripcion = document.getElementById("descripcionRepuesto").value.trim();
    const marca = document.getElementById("marcaRepuesto").value.trim();
    const precio = document.getElementById("precioRepuesto").value.trim();
    const id = document.getElementById("repuestoId").value;
    const listaRepuestos = obtenerRepuestos();

    if (!/^[A-Z0-9-]{3,20}$/.test(referencia) || descripcion.length === 0 || descripcion.length > 150 || marca.length === 0 || marca.length > 50 || !/^\d+(\.\d{1,2})?$/.test(precio) || Number(precio) <= 0) {
      mostrarAlertaRepuesto("Por favor complete todos los campos con un formato válido.", "danger");
      return;
    }

    if (listaRepuestos.some(r => r.referencia === referencia && r.referencia !== id)) {
      mostrarAlertaRepuesto("Esa referencia ya se encuentra registrada.", "warning");
      return;
    }

    const registro = { referencia, descripcion, marca, precio: Number(precio) };

    if (id) {
      const index = listaRepuestos.findIndex(r => r.referencia === id);
      if (index !== -1) {
        listaRepuestos[index] = registro;
        if (id !== referencia) {
          const inventario = obtenerInventario();
          inventario.forEach(item => {
            if (item.referencia === id) {
              item.referencia = referencia;
            }
          });
          guardarInventario(inventario);
        }
        mostrarAlertaRepuesto("Repuesto actualizado con éxito.", "success");
      }
    } else {
      listaRepuestos.push(registro);
      mostrarAlertaRepuesto("Repuesto registrado correctamente.", "success");
    }

    guardarRepuestos(listaRepuestos);
    renderizarTablaRepuestos();
    limpiarFormularioRepuesto();
  });

  renderizarTablaRepuestos();
});

function validarCampoRepuesto(input, esValido) {
  if (esValido) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  } else {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
  }
}

function renderizarTablaRepuestos() {
  const tbody = document.getElementById("tablaRepuestos");
  const listaRepuestos = obtenerRepuestos();
  tbody.innerHTML = "";

  if (listaRepuestos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay repuestos registrados en el sistema.</td></tr>`;
    return;
  }

  listaRepuestos.forEach(repuesto => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${repuesto.referencia}</strong></td>
        <td>${repuesto.descripcion}</td>
        <td>${repuesto.marca}</td>
        <td>${repuesto.precio}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="cargarParaEditarRepuesto('${repuesto.referencia}')">✏️ Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarRepuesto('${repuesto.referencia}')">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  });
}

function cargarParaEditarRepuesto(referencia) {
  const repuesto = buscarRepuesto(referencia);
  if (repuesto) {
    document.getElementById("repuestoId").value = repuesto.referencia;
    document.getElementById("referenciaRepuesto").value = repuesto.referencia;
    document.getElementById("descripcionRepuesto").value = repuesto.descripcion;
    document.getElementById("marcaRepuesto").value = repuesto.marca;
    document.getElementById("precioRepuesto").value = repuesto.precio;
    document.getElementById("btnGuardarRepuesto").innerText = "Actualizar Repuesto";
    document.getElementById("btnGuardarRepuesto").className = "btn btn-warning";
  }
}

function eliminarRepuesto(referencia) {
  if (!confirm("¿Está seguro de eliminar este repuesto?")) {
    return;
  }

  const enInventario = obtenerInventario().some(i => i.referencia === referencia);
  if (enInventario && !confirm("También tiene stock en inventario. Se eliminará de ambos módulos.")) {
    return;
  }

  guardarRepuestos(obtenerRepuestos().filter(r => r.referencia !== referencia));
  guardarInventario(obtenerInventario().filter(i => i.referencia !== referencia));
  renderizarTablaRepuestos();
  mostrarAlertaRepuesto("Repuesto eliminado del sistema.", "warning");
}

function limpiarFormularioRepuesto() {
  document.getElementById("formRepuesto").reset();
  document.getElementById("repuestoId").value = "";
  document.getElementById("btnGuardarRepuesto").innerText = "Registrar Repuesto";
  document.getElementById("btnGuardarRepuesto").className = "btn btn-success";
  document.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
    el.classList.remove("is-valid", "is-invalid");
  });
}

function mostrarAlertaRepuesto(mensaje, tipo) {
  const alerta = document.getElementById("alertaRepuesto");
  if (alerta) {
    alerta.className = `alert alert-${tipo} animate__animated animate__fadeIn d-block mb-3`;
    alerta.innerText = mensaje;
    alerta.classList.remove("d-none");
    setTimeout(() => alerta.classList.add("d-none"), 3500);
  }
}
