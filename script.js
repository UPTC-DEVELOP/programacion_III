// Base de datos simulada en memoria
let listaClientes = JSON.parse(localStorage.getItem("olimac_clientes")) || [];

document.addEventListener("DOMContentLoaded", () => {
  const formCliente = document.getElementById("formCliente");
  const cedulaInput = document.getElementById("cedulaCliente");
  const correoInput = document.getElementById("correoCliente");
  const telefonoInput = document.getElementById("telefonoCliente");

  renderizarTabla();

  // Validaciones en tiempo real con expresiones regulares (Regex)
  cedulaInput.addEventListener("input", function () {
    const regexCedula = /^[0-9]{7,10}$/;
    validarCampo(this, regexCedula.test(this.value));
  });

  correoInput.addEventListener("input", function () {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validarCampo(this, regexEmail.test(this.value));
  });

  telefonoInput.addEventListener("input", function () {
    const regexTel = /^[0-9]{10}$/;
    validarCampo(this, regexTel.test(this.value));
  });

  // Evento Submit para Guardar o Editar
  formCliente.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombreCliente").value.trim();
    const cedula = document.getElementById("cedulaCliente").value.trim();
    const correo = document.getElementById("correoCliente").value.trim();
    const telefono = document.getElementById("telefonoCliente").value.trim();
    const id = document.getElementById("clienteId").value;

    // Validación general antes de registrar
    if (!nombre || !/^[0-9]{7,10}$/.test(cedula) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || !/^[0-9]{10}$/.test(telefono)) {
      mostrarAlerta("Por favor complete todos los campos con un formato válido.","danger");
      return;
    }

    if (id) {
      // Editar registro existente
      const index = listaClientes.findIndex(c => c.cedula === id);
      if (index !== -1) {
        listaClientes[index] = { nombre, cedula, correo, telefono };
        localStorage.setItem("olimac_clientes", JSON.stringify(listaClientes));
        mostrarAlerta("Cliente actualizado con éxito.", "success");
      }
    } else {
      // Validar si el cliente ya existe
      if (listaClientes.some(c => c.cedula === cedula)) {
        mostrarAlerta("Esa cédula/NIT ya se encuentra registrada.", "warning");
        return;
      }
      // Agregar nuevo cliente
      listaClientes.push({ nombre, cedula, correo, telefono });
      localStorage.setItem("olimac_clientes", JSON.stringify(listaClientes));
      mostrarAlerta("Cliente registrado correctamente.", "success");
    }

    renderizarTabla();
    limpiarFormulario();
  });
});

// Retroalimentación visual de validación en HTML
function validarCampo(input, esValido) {
  if (esValido) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  } else {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
  }
}

// Renderizar tabla dinámicamente
function renderizarTabla() {
  const tbody = document.getElementById("tablaClientes");
  tbody.innerHTML = "";

  if (listaClientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay clientes registrados en el sistema.</td></tr>`;
    return;
  }

  listaClientes.forEach(cliente => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${cliente.cedula}</strong></td>
        <td>${cliente.nombre}</td>
        <td>${cliente.correo}</td>
        <td>${cliente.telefono}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="cargarParaEditar('${cliente.cedula}')">✏️ Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarCliente('${cliente.cedula}')">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// Cargar datos en el formulario para modificar
function cargarParaEditar(cedula) {
  const cliente = listaClientes.find(c => c.cedula === cedula);
  if (cliente) {
    document.getElementById("clienteId").value = cliente.cedula;
    document.getElementById("nombreCliente").value = cliente.nombre;
    document.getElementById("cedulaCliente").value = cliente.cedula;
    document.getElementById("correoCliente").value = cliente.correo;
    document.getElementById("telefonoCliente").value = cliente.telefono;
    document.getElementById("btnGuardar").innerText = "Actualizar Cliente";
    document.getElementById("btnGuardar").className = "btn btn-warning";
  }
}

// Eliminar registro
function eliminarCliente(cedula) {
  if (confirm("¿Está seguro de eliminar este cliente?")) {
    listaClientes = listaClientes.filter(c => c.cedula !== cedula);

    localStorage.setItem("olimac_clientes", JSON.stringify(listaClientes));

    renderizarTabla();
    mostrarAlerta("Cliente eliminado del sistema.", "warning");
  }
}

// Limpiar inputs
function limpiarFormulario() {
  document.getElementById("formCliente").reset();
  document.getElementById("clienteId").value = "";
  document.getElementById("btnGuardar").innerText = "Registrar Cliente";
  document.getElementById("btnGuardar").className = "btn btn-success";
  document.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
    el.classList.remove("is-valid", "is-invalid");
  });
}

// Alerta dinámica
function mostrarAlerta(mensaje, tipo) {
  const alerta = document.getElementById("alertaCliente");
  if (alerta) {
    alerta.className = `alert alert-${tipo} animate__animated animate__fadeIn d-block mb-3`;
    alerta.innerText = mensaje;
    alerta.classList.remove("d-none");
    setTimeout(() => alerta.classList.add("d-none"), 3500);
  }
}