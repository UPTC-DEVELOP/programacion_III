
// DATOS COMPARTIDOS DEL TALLER
// Las listas van aquí afuera para que los módulos puedan usarlas entre sí
// (por ejemplo, el vehículo necesita saber qué clientes existen).
const datosTaller = {
  clientes: [],
  vehiculos: []
};
(() => {
  const imagenes = document.querySelectorAll("#inicio .imagen-carrusel");
  const anterior = document.getElementById("foto-anterior");
  const siguiente = document.getElementById("foto-siguiente");
  const pausa = document.getElementById("pausar-carrusel");
  const indicadores = document.querySelectorAll("#inicio .indicador");

  // Verifica que existan los elementos necesarios 
  if (!imagenes.length || !anterior || !siguiente || !pausa) {
    return;
  }

  let posicion = 0;
  let temporizador = null;


  // Cambia la imagen visible
  function mostrarImagen(nuevaPosicion) {
    posicion = (nuevaPosicion + imagenes.length) % imagenes.length;

    imagenes.forEach((imagen, indice) => {
      imagen.hidden = indice !== posicion;
    });

    indicadores.forEach((indicador, indice) => {
      const estaActivo = indice === posicion;

      indicador.classList.toggle("activo", estaActivo);

      if (estaActivo) {
        indicador.setAttribute("aria-current", "true");
      } else {
        indicador.removeAttribute("aria-current");
      }
    });
  }


  // Reproducción automática
  function iniciarCarrusel() {
    clearInterval(temporizador);

    temporizador = setInterval(() => {
      mostrarImagen(posicion + 1);
    }, 5000);

    pausa.textContent = "⏸";
    pausa.setAttribute("aria-label", "Pausar carrusel");
  }


  // Detiene la reproducción automática
  function detenerCarrusel() {
    clearInterval(temporizador);
    temporizador = null;

    pausa.textContent = "▶";
    pausa.setAttribute("aria-label", "Reanudar carrusel");
  }


  // imagen anterior
  anterior.addEventListener("click", () => {
    mostrarImagen(posicion - 1);

    if (temporizador !== null) {
      iniciarCarrusel();
    }
  });


  // imagen siguiente
  siguiente.addEventListener("click", () => {
    mostrarImagen(posicion + 1);

    if (temporizador !== null) {
      iniciarCarrusel();
    }
  });


  // pausar o reanudar el carrusel
  pausa.addEventListener("click", () => {
    if (temporizador !== null) {
      detenerCarrusel();
    } else {
      iniciarCarrusel();
    }
  });


  // indicadores inferiores
  indicadores.forEach((indicador, indice) => {
    indicador.addEventListener("click", () => {
      mostrarImagen(indice);

      if (temporizador !== null) {
        iniciarCarrusel();
      }
    });
  });


  // estado inicial
  mostrarImagen(0);



  const reducirMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if (reducirMovimiento.matches) {
    detenerCarrusel();
  } else {
    iniciarCarrusel();
  }
})();

// VALIDACIÓN DEL FORMULARIO DE SOLICITUD DE INFORMACIÓN

document.addEventListener("DOMContentLoaded", () => {

  const formulario = document.getElementById("form-solicitud");
  const estadoSistema = document.getElementById("estado-sistema");

  if (!formulario) return;

  const mensajesError = {
    nombre: "Ingresa un nombre válido (mínimo 3 caracteres).",
    taller: "Ingresa el nombre del taller (mínimo 3 caracteres).",
    correo: "Ingresa un correo electrónico válido.",
    telefono: "Ingresa un teléfono válido (solo números, +, espacios, guiones).",
    "num-empleados": "El número de empleados no puede ser negativo.",
    "plan-interes": "Selecciona un plan de interés.",
    mensaje: "Escribe tu mensaje con al menos 10 caracteres."
  };

  function validarCampo(campo) {
    const spanError = document.getElementById(`error-${campo.id}`);
    const esValido = campo.checkValidity();

    if (!esValido) {
      campo.classList.add("campo-invalido");

      if (spanError) {
        spanError.textContent =
          mensajesError[campo.id] || "Este campo no es válido.";
      }
    } else {
      campo.classList.remove("campo-invalido");

      if (spanError) {
        spanError.textContent = "";
      }
    }

    return esValido;
  }

  const campos = formulario.querySelectorAll(
    "input, select, textarea"
  );

  campos.forEach((campo) => {

    campo.addEventListener("blur", () => {
      validarCampo(campo);
    });

    campo.addEventListener("input", () => {
      if (campo.classList.contains("campo-invalido")) {
        validarCampo(campo);
      }
    });

  });

  function mostrarMensajeEstado(texto, tipo) {

    if (!estadoSistema) return;

    estadoSistema.textContent = texto;
    estadoSistema.classList.remove("exito", "error");
    estadoSistema.classList.add(tipo);
  }

  formulario.addEventListener("submit", (evento) => {

    evento.preventDefault();

    let formularioValido = true;
    let primerCampoInvalido = null;

    campos.forEach((campo) => {

      const esValido = validarCampo(campo);

      if (!esValido) {
        formularioValido = false;

        if (!primerCampoInvalido) {
          primerCampoInvalido = campo;
        }
      }
    });

    if (!formularioValido) {

      mostrarMensajeEstado(
        "Revisa los campos marcados en rojo antes de enviar la solicitud.",
        "error"
      );

      if (primerCampoInvalido) {
        primerCampoInvalido.focus();
      }

      return;
    }

    const nombre =
      formulario.querySelector("#nombre").value.trim();

    const taller =
      formulario.querySelector("#taller").value.trim();

    mostrarMensajeEstado(
      `¡Gracias, ${nombre}! Registramos la solicitud de "${taller}". Un asesor te contactará pronto.`,
      "exito"
    );

    formulario.reset();

    campos.forEach((campo) => {
      campo.classList.remove("campo-invalido");
    });

  });

});


// LOGIN Y ACCESO AL APLICATIVO
document.addEventListener("DOMContentLoaded", () => {

  const botonLoginHeader = document.querySelector(".btn-login-header");
  const botonLogin = document.querySelector(".btn-login");

  const sistema = document.getElementById("sistema");
  const login = document.getElementById("login");
  const headerPrincipal = document.querySelector("body > header");
  const main = document.querySelector("main");
  const footer = document.getElementById("contacto");

  // Mostrar pantalla de login desde el landing
  if (botonLoginHeader && login && main) {
    botonLoginHeader.addEventListener("click", (evento) => {
      evento.preventDefault();

      main.querySelectorAll(":scope > section").forEach((seccion) => {
        seccion.hidden = true;
      });

      login.hidden = false;

      if (headerPrincipal) {
        headerPrincipal.hidden = true;
      }

      if (footer) {
        footer.hidden = true;
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  // Entrar al aplicativo desde el login
  if (botonLogin && sistema && login && main) {
    botonLogin.addEventListener("click", () => {

      main.querySelectorAll(":scope > section").forEach((seccion) => {
        seccion.hidden = true;
      });

      login.hidden = true;
      sistema.hidden = false;

      if (headerPrincipal) {
        headerPrincipal.hidden = true;
      }

      if (footer) {
        footer.hidden = true;
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

});

// NAVEGACIÓN DEL SISTEMA

document.addEventListener("DOMContentLoaded", () => {
  const enlaceInicio = document.querySelector(
    '.menu-sistema a[href="#dashboard"]'
  );

  const enlaceClientes = document.querySelector(
    '.menu-sistema a[href="#clientes"]'
  );

  const enlaceEmpleados = document.querySelector(
    '.menu-sistema a[href="#empleados"]'
  );
  const enlaceVehiculos = document.querySelector(
    '.menu-sistema a[href="#vehiculos"]'
  );

  const dashboard = document.getElementById("dashboard");
  const clientes = document.getElementById("clientes");
  const empleados = document.getElementById("empleados");
   const vehiculos = document.getElementById("vehiculos");

  const titulo = document.querySelector(".topbar-sistema h2");
  const subtitulo = document.querySelector(".topbar-sistema p");

  if (
    !enlaceInicio ||
    !enlaceClientes ||
    !enlaceEmpleados ||
    !dashboard ||
    !clientes ||
    !empleados ||
    !enlaceVehiculos ||
    !vehiculos
  ) {
    return;
  }

  function ocultarSecciones() {
    dashboard.hidden = true;
    clientes.hidden = true;
    empleados.hidden = true;
     vehiculos.hidden = true;

    enlaceInicio.classList.remove("activo");
    enlaceClientes.classList.remove("activo");
    enlaceEmpleados.classList.remove("activo");
     enlaceVehiculos.classList.remove("activo");
  }

  enlaceVehiculos.addEventListener("click", (evento) => {
    evento.preventDefault();

    ocultarSecciones();

    vehiculos.hidden = false;
    enlaceVehiculos.classList.add("activo");

    if (titulo) titulo.textContent = "Vehículos";
    if (subtitulo) {
      subtitulo.textContent = "Registro y consulta de vehículos";
    }
  });

  enlaceInicio.addEventListener("click", (evento) => {
    evento.preventDefault();

    ocultarSecciones();

    dashboard.hidden = false;
    enlaceInicio.classList.add("activo");

    if (titulo) titulo.textContent = "Inicio";
    if (subtitulo) subtitulo.textContent = "Panel principal";
  });

  enlaceClientes.addEventListener("click", (evento) => {
    evento.preventDefault();

    ocultarSecciones();

    clientes.hidden = false;
    enlaceClientes.classList.add("activo");

    if (titulo) titulo.textContent = "Clientes";
    if (subtitulo) {
      subtitulo.textContent = "Registro y consulta de clientes";
    }
  });

  enlaceEmpleados.addEventListener("click", (evento) => {
    evento.preventDefault();

    ocultarSecciones();

    empleados.hidden = false;
    enlaceEmpleados.classList.add("activo");

    if (titulo) titulo.textContent = "Empleados";
    if (subtitulo) {
      subtitulo.textContent = "Registro y consulta de empleados";
    }
  });
});

 // CRUD CLIENTES 

document.addEventListener("DOMContentLoaded", () => {
 const clientes = datosTaller.clientes;
  const btnNuevoCliente = document.querySelector(".btn-nuevo-cliente");
  const modalCliente = document.getElementById("modal-cliente");
  const btnCerrarCliente = document.querySelector(".cerrar-modal-cliente");
  const btnCancelarCliente = document.querySelector(".btn-cancelar-cliente");

  const formularioCliente = document.getElementById("formulario-cliente");
  const tablaClientes = document.getElementById("lista-clientes");
  const cantidadClientes = document.getElementById("cantidad-clientes");
  const buscarCliente = document.getElementById("buscar-cliente");

  const modalEliminarCliente = document.getElementById("modal-eliminar-cliente");
  const cancelarEliminarCliente = document.getElementById("cancelar-eliminar-cliente");
  const confirmarEliminarCliente = document.getElementById("confirmar-eliminar-cliente");

  const eliminarIdCliente = document.getElementById("eliminar-id-cliente");
  const eliminarCedulaCliente = document.getElementById("eliminar-cedula-cliente");
  const eliminarNombreCliente = document.getElementById("eliminar-nombre-cliente");

let idClienteEliminar = null;

  const idCliente = document.getElementById("id-cliente");
  const cedulaCliente = document.getElementById("cedula-cliente");
  const nombresCliente = document.getElementById("nombres-cliente");
  const apellidosCliente = document.getElementById("apellidos-cliente");
  const telefonoCliente = document.getElementById("telefono-cliente");
  const direccionCliente = document.getElementById("direccion-cliente");
  const tituloModalCliente =
  document.getElementById("titulo-modal-cliente");

const descripcionModalCliente =
  document.getElementById("descripcion-modal-cliente");

const guardarCliente =
  document.getElementById("guardar-cliente");

  function generarIdCliente() {
  if (clientes.length === 0) {
    return "0001";
  }

  const mayorId = Math.max(
    ...clientes.map((cliente) => Number(cliente.id))
  );

  if (mayorId >= 9999) {
    return null;
  }

  return String(mayorId + 1).padStart(4, "0");
}

  function mostrarClientes(lista = clientes) {
  tablaClientes.innerHTML = "";

  if (lista.length === 0) {
  const fila = document.createElement("tr");
  const celda = document.createElement("td");

  celda.colSpan = 7;
  celda.textContent =
    clientes.length === 0
      ? "Todavía no existen clientes registrados."
      : "No se encontraron clientes.";

  fila.appendChild(celda);
  tablaClientes.appendChild(fila);
}

  lista.forEach((cliente) => {
    const fila = document.createElement("tr");

    const datosCliente = [
  cliente.id,
  cliente.cedula,
  cliente.nombres,
  cliente.apellidos,
  cliente.telefono,
  cliente.direccion
];

datosCliente.forEach((dato) => {
  const celda = document.createElement("td");
  celda.textContent = dato;
  fila.appendChild(celda);
});

const celdaAcciones = document.createElement("td");

const botonEditar = document.createElement("button");
botonEditar.type = "button";
botonEditar.className = "btn-editar-cliente";
botonEditar.dataset.id = cliente.id;
botonEditar.textContent = "Editar";

const botonEliminar = document.createElement("button");
botonEliminar.type = "button";
botonEliminar.className = "btn-eliminar-cliente";
botonEliminar.dataset.id = cliente.id;
botonEliminar.textContent = "Eliminar";

celdaAcciones.appendChild(botonEditar);
celdaAcciones.appendChild(botonEliminar);

fila.appendChild(celdaAcciones);

tablaClientes.appendChild(fila);
  });

  cantidadClientes.textContent =
    `${lista.length} ${lista.length === 1 ? "cliente" : "clientes"}`;
}

  function aplicarFiltroClientes() {
  const texto = buscarCliente.value.toLowerCase().trim();

  const resultados = clientes.filter((cliente) => {
    return (
      cliente.cedula.toLowerCase().includes(texto) ||
      cliente.nombres.toLowerCase().includes(texto) ||
      cliente.apellidos.toLowerCase().includes(texto)
    );
  });

  mostrarClientes(resultados);
}

buscarCliente.addEventListener("input", aplicarFiltroClientes);


  function abrirModalEditar(id) {
  const cliente = clientes.find((item) => item.id === id);

  if (!cliente) {
    return;
  }

  modoEdicionCliente = true;

  idCliente.value = cliente.id;
  cedulaCliente.value = cliente.cedula;
  nombresCliente.value = cliente.nombres;
  apellidosCliente.value = cliente.apellidos;
  telefonoCliente.value = cliente.telefono;
  direccionCliente.value = cliente.direccion;

  tituloModalCliente.textContent = "Editar cliente";
  descripcionModalCliente.textContent =
    "Modifica la información del cliente.";
  guardarCliente.textContent = "Actualizar cliente";

  modalCliente.hidden = false;

  cedulaCliente.focus();
}
  btnNuevoCliente.addEventListener("click", () => {
  formularioCliente.reset();

   modoEdicionCliente = false;

  const nuevoId = generarIdCliente();

if (nuevoId === null) {
  alert("No es posible registrar más clientes. Se alcanzó el límite de 9999 registros.");
  return;
}

idCliente.value = nuevoId;

  tituloModalCliente.textContent = "Registrar cliente";
  descripcionModalCliente.textContent =
    "Ingresa la información del nuevo cliente.";
  guardarCliente.textContent = "Guardar cliente";

  modalCliente.hidden = false;

  cedulaCliente.focus();
});

  tablaClientes.addEventListener("click", (evento) => {
  const botonEditar = evento.target.closest(".btn-editar-cliente");
  const botonEliminar = evento.target.closest(".btn-eliminar-cliente");

  if (botonEditar) {
    abrirModalEditar(botonEditar.dataset.id);
    return;
  }
 if (botonEliminar) {
  const id = botonEliminar.dataset.id;

  const cliente = clientes.find(
    (cliente) => cliente.id === id
  );

  if (!cliente) {
    return;
  }

  idClienteEliminar = cliente.id;

  eliminarIdCliente.textContent = cliente.id;
  eliminarCedulaCliente.textContent = cliente.cedula;
  eliminarNombreCliente.textContent =
    `${cliente.nombres} ${cliente.apellidos}`;

  modalEliminarCliente.hidden = false;
}
});

cancelarEliminarCliente.addEventListener("click", () => {
  modalEliminarCliente.hidden = true;
  idClienteEliminar = null;

  alert("Eliminación cancelada. El cliente se conserva.");
});

confirmarEliminarCliente.addEventListener("click", () => {
  const posicion = clientes.findIndex(
    (cliente) => cliente.id === idClienteEliminar
  );

  if (posicion === -1) {
  alert("El cliente seleccionado ya no existe.");
  modalEliminarCliente.hidden = true;
  idClienteEliminar = null;
  return;
}

 clientes.splice(posicion, 1);

 aplicarFiltroClientes();

 modalEliminarCliente.hidden = true;
  idClienteEliminar = null;

  alert("Cliente eliminado correctamente.");
});
 function validarDatosCliente() {
  const cedula = cedulaCliente.value.trim();
  const nombres = nombresCliente.value.trim();
  const apellidos = apellidosCliente.value.trim();
  const telefono = telefonoCliente.value.trim();
  const direccion = direccionCliente.value.trim();
  const patronNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

  if (!cedula || !nombres || !apellidos || !telefono || !direccion) {
    alert("Todos los campos son obligatorios.");
    return false;
  }

  if (!/^\d+$/.test(cedula)) {
    alert("La cédula debe contener únicamente números.");
    cedulaCliente.focus();
    return false;
  }

  if (cedula.length > 10) {
    alert("La cédula debe tener máximo 10 dígitos.");
    cedulaCliente.focus();
    return false;
  }

  const cedulaDuplicada = clientes.some(
  (cliente) =>
    cliente.cedula === cedula &&
    cliente.id !== idCliente.value
);

  if (cedulaDuplicada) {
  alert("La cédula ya está registrada.");
  cedulaCliente.focus();
  return false;
}

 if (!patronNombre.test(nombres)) {
  alert("Los nombres solo deben contener letras.");
  nombresCliente.focus();
  return false;
}

if (!patronNombre.test(apellidos)) {
  alert("Los apellidos solo deben contener letras.");
  apellidosCliente.focus();
  return false;
}
  if (nombres.length > 40) {
  alert("Los nombres deben tener máximo 40 caracteres.");
  nombresCliente.focus();
  return false;
}

if (apellidos.length > 40) {
  alert("Los apellidos deben tener máximo 40 caracteres.");
  apellidosCliente.focus();
  return false;
}

if (direccion.length > 80) {
  alert("La dirección debe tener máximo 80 caracteres.");
  direccionCliente.focus();
  return false;
}
 

  if (!/^\d{10}$/.test(telefono)) {
    alert("El teléfono debe contener exactamente 10 dígitos.");
    telefonoCliente.focus();
    return false;
  }

  return true;
}
 
  let modoEdicionCliente = false;

  formularioCliente.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!validarDatosCliente()) {
  return;
}

  const clienteExistente = clientes.find(
    (cliente) => cliente.id === idCliente.value
  );
  if (modoEdicionCliente && !clienteExistente) {
  alert("El cliente seleccionado ya no existe.");
  return;
}

  if (clienteExistente) {
    clienteExistente.cedula = cedulaCliente.value.trim();
    clienteExistente.nombres = nombresCliente.value.trim();
    clienteExistente.apellidos = apellidosCliente.value.trim();
    clienteExistente.telefono = telefonoCliente.value.trim();
    clienteExistente.direccion = direccionCliente.value.trim();

    alert("Cliente actualizado correctamente.");
  } else {
    const nuevoCliente = {
      id: idCliente.value,
      cedula: cedulaCliente.value.trim(),
      nombres: nombresCliente.value.trim(),
      apellidos: apellidosCliente.value.trim(),
      telefono: telefonoCliente.value.trim(),
      direccion: direccionCliente.value.trim()
    };

    clientes.push(nuevoCliente);

    alert("Cliente registrado correctamente.");
  }

  aplicarFiltroClientes();

  formularioCliente.reset();

  modalCliente.hidden = true;
});
  btnCerrarCliente.addEventListener("click", () => {
    formularioCliente.reset();
    modalCliente.hidden = true;
  });

  btnCancelarCliente.addEventListener("click", () => {
    formularioCliente.reset();
    modalCliente.hidden = true;
  });

    mostrarClientes();
});
  // CRUD EMPLEADOS
    document.addEventListener("DOMContentLoaded", () => {
    const empleados = [];
    
    const seccionEmpleados = document.getElementById("empleados");
    const btnRegistrar = document.getElementById("btn-registrar-empleado");
    const btnCerrar = document.getElementById("cerrar-modal-empleado");
    const btnCancelar = document.getElementById("btn-cancelar-empleado");

    const modal = document.getElementById("modal-empleado");
    const formulario = document.getElementById("formulario-empleado");

    const buscar = document.getElementById("buscar-empleado");
    const tabla = document.getElementById("tabla-empleados-body");
    const cantidad = document.getElementById("cantidad-empleados");

    const tituloModal = document.getElementById("titulo-modal-empleado");

    const idEmpleado = document.getElementById("empleado-id");
    const cedula = document.getElementById("empleado-cedula");
    const nombres = document.getElementById("empleado-nombres");
    const apellidos = document.getElementById("empleado-apellidos");
    const telefono = document.getElementById("empleado-telefono");
    const cargo = document.getElementById("empleado-cargo");

    if (
        !seccionEmpleados ||
        !btnRegistrar ||
        !modal ||
        !formulario ||
        !tabla
    ) {
        return;
    }

    function mostrarEmpleados(lista = empleados) {

        tabla.innerHTML = "";

        lista.forEach((empleado) => {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${empleado.id}</td>
                <td>${empleado.cedula}</td>
                <td>${empleado.nombres}</td>
                <td>${empleado.apellidos}</td>
                <td>${empleado.telefono}</td>
                <td>${empleado.cargo}</td>

                <td>
                    <div class="acciones-empleado">

                        <button
                            type="button"
                            class="btn-editar-empleado"
                            data-id="${empleado.id}"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="btn-eliminar-empleado"
                            data-id="${empleado.id}"
                        >
                            Eliminar
                        </button>

                    </div>
                </td>
            `;

            tabla.appendChild(fila);
        });

        cantidad.textContent =
            `${lista.length} ${lista.length === 1 ? "empleado" : "empleados"}`;
    }

    function abrirModalRegistrar() {
    formulario.reset();

    idEmpleado.value = "";

    tituloModal.textContent = "Registrar empleado";

    modal.style.display = "flex";

    cedula.focus();
}

  function abrirModalEditar(id) {
  const empleado = empleados.find(
    (item) => item.id === id
  );

  if (!empleado) {
    return;
  }

  idEmpleado.value = empleado.id;
  cedula.value = empleado.cedula;
  nombres.value = empleado.nombres;
  apellidos.value = empleado.apellidos;
  telefono.value = empleado.telefono;
  cargo.value = empleado.cargo;

        tituloModal.textContent = "Editar empleado";

        modal.style.display = "flex";

        cedula.focus();
    }

    function cerrarModal() {

        modal.style.display = "none";

        formulario.reset();

        idEmpleado.value = "";
    }

    function generarId() {

        if (empleados.length === 0) {
            return "001";
        }

        return String(empleados.length + 1).padStart(3, "0");
    }

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const datos = {
            cedula: cedula.value.trim(),
            nombres: nombres.value.trim(),
            apellidos: apellidos.value.trim(),
            telefono: telefono.value.trim(),
            cargo: cargo.value
        };

        if (
            !datos.cedula ||
            !datos.nombres ||
            !datos.apellidos ||
            !datos.telefono ||
            !datos.cargo
        ) {
            alert("Completa todos los campos.");
            return;
        }

        if (idEmpleado.value) {

            const empleado = empleados.find(
                (item) => item.id === idEmpleado.value
            );

            if (empleado) {

                empleado.cedula = datos.cedula;
                empleado.nombres = datos.nombres;
                empleado.apellidos = datos.apellidos;
                empleado.telefono = datos.telefono;
                empleado.cargo = datos.cargo;

                alert("Empleado actualizado correctamente.");
            }

        } else {

            const nuevoEmpleado = {
                id: generarId(),
                cedula: datos.cedula,
                nombres: datos.nombres,
                apellidos: datos.apellidos,
                telefono: datos.telefono,
                cargo: datos.cargo
            };

            empleados.push(nuevoEmpleado);

            alert("Empleado registrado correctamente.");
        }

        mostrarEmpleados();

        cerrarModal();
    });

    tabla.addEventListener("click", (evento) => {

        const botonEditar =
            evento.target.closest(".btn-editar-empleado");

        const botonEliminar =
            evento.target.closest(".btn-eliminar-empleado");

        if (botonEditar) {

            abrirModalEditar(
                botonEditar.dataset.id
            );

            return;
        }

        if (botonEliminar) {

            const id = botonEliminar.dataset.id;

            const posicion = empleados.findIndex(
                (empleado) => empleado.id === id
            );

            if (posicion === -1) {
                return;
            }

            const empleado = empleados[posicion];

            const confirmar = confirm(
                `¿Deseas eliminar al empleado ${empleado.nombres} ${empleado.apellidos}?`
            );

            if (!confirmar) {
                return;
            }

            empleados.splice(posicion, 1);

            mostrarEmpleados();

            alert("Empleado eliminado correctamente.");
        }

    });

    buscar.addEventListener("input", () => {

        const texto = buscar.value
            .toLowerCase()
            .trim();

        const resultados = empleados.filter((empleado) => {

            return (
                empleado.cedula.toLowerCase().includes(texto) ||
                empleado.nombres.toLowerCase().includes(texto) ||
                empleado.apellidos.toLowerCase().includes(texto)
            );

        });

        mostrarEmpleados(resultados);
    });

    btnRegistrar.addEventListener(
        "click",
        abrirModalRegistrar
    );

    btnCerrar.addEventListener(
        "click",
        cerrarModal
    );

    btnCancelar.addEventListener(
        "click",
        cerrarModal
    );

    modal.addEventListener("click", (evento) => {

        if (evento.target === modal) {
            cerrarModal();
        }

    });

    mostrarEmpleados();

})

// CRUD VEHÍCULOS

document.addEventListener("DOMContentLoaded", () => {
  const vehiculos = datosTaller.vehiculos;
  const clientes = datosTaller.clientes;

  const enlaceVehiculos = document.querySelector(
    '.menu-sistema a[href="#vehiculos"]'
  );

  const btnNuevoVehiculo = document.getElementById("btn-nuevo-vehiculo");
  const modalVehiculo = document.getElementById("modal-vehiculo");
  const btnCerrarVehiculo = document.getElementById("cerrar-modal-vehiculo");
  const btnCancelarVehiculo = document.getElementById("btn-cancelar-vehiculo");

  const formularioVehiculo = document.getElementById("formulario-vehiculo");
  const tablaVehiculos = document.getElementById("lista-vehiculos");
  const cantidadVehiculos = document.getElementById("cantidad-vehiculos");
  const buscarVehiculo = document.getElementById("buscar-vehiculo");

  const tituloModalVehiculo = document.getElementById("titulo-modal-vehiculo");
  const descripcionModalVehiculo = document.getElementById("descripcion-modal-vehiculo");
  const guardarVehiculo = document.getElementById("guardar-vehiculo");

  // Campos del formulario
  const idVehiculo = document.getElementById("id-vehiculo");
  const placaVehiculo = document.getElementById("placa-vehiculo");
  const marcaVehiculo = document.getElementById("marca-vehiculo");
  const lineaVehiculo = document.getElementById("linea-vehiculo");
  const modeloVehiculo = document.getElementById("modelo-vehiculo");
  const colorVehiculo = document.getElementById("color-vehiculo");
  const propietarioVehiculo = document.getElementById("propietario-vehiculo");

  // Modal eliminar
  const modalEliminarVehiculo = document.getElementById("modal-eliminar-vehiculo");
  const cancelarEliminarVehiculo = document.getElementById("cancelar-eliminar-vehiculo");
  const confirmarEliminarVehiculo = document.getElementById("confirmar-eliminar-vehiculo");
  const eliminarIdVehiculo = document.getElementById("eliminar-id-vehiculo");
  const eliminarPlacaVehiculo = document.getElementById("eliminar-placa-vehiculo");
  const eliminarDescripcionVehiculo = document.getElementById("eliminar-descripcion-vehiculo");

  if (!btnNuevoVehiculo || !modalVehiculo || !formularioVehiculo || !tablaVehiculos) {
    return;
  }

  let modoEdicionVehiculo = false;
  let idVehiculoEliminar = null;

  // El modelo no puede ser mayor al año siguiente al actual
  const anioMaximo = new Date().getFullYear() + 1;
  modeloVehiculo.max = anioMaximo;

  // ---------- GENERAR ID (0001, 0002, ...) ----------
  function generarIdVehiculo() {
    if (vehiculos.length === 0) {
      return "0001";
    }

    const mayorId = Math.max(
      ...vehiculos.map((vehiculo) => Number(vehiculo.id))
    );

    if (mayorId >= 9999) {
      return null;
    }

    return String(mayorId + 1).padStart(4, "0");
  }

  // ---------- NOMBRE DEL PROPIETARIO ----------
  // El vehículo guarda el ID del cliente; el nombre se busca en la lista de clientes
  function nombrePropietario(idCliente) {
    const cliente = clientes.find((item) => item.id === idCliente);

    if (!cliente) {
      return "Sin propietario";
    }

    return `${cliente.nombres} ${cliente.apellidos}`;
  }

  // ---------- LLENAR LA LISTA DE PROPIETARIOS ----------
  function llenarPropietarios() {
    propietarioVehiculo.innerHTML = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccione un cliente";
    propietarioVehiculo.appendChild(opcionInicial);

    clientes.forEach((cliente) => {
      const opcion = document.createElement("option");
      opcion.value = cliente.id;
      opcion.textContent =
        `${cliente.cedula} - ${cliente.nombres} ${cliente.apellidos}`;
      propietarioVehiculo.appendChild(opcion);
    });
  }

  // ---------- MOSTRAR LA TABLA ----------
  function mostrarVehiculos(lista = vehiculos) {
    tablaVehiculos.innerHTML = "";

    if (lista.length === 0) {
      const fila = document.createElement("tr");
      const celda = document.createElement("td");

      celda.colSpan = 8;
      celda.textContent =
        vehiculos.length === 0
          ? "Todavía no existen vehículos registrados."
          : "No se encontraron vehículos.";

      fila.appendChild(celda);
      tablaVehiculos.appendChild(fila);
    }

    lista.forEach((vehiculo) => {
      const fila = document.createElement("tr");

      // ID
      const celdaId = document.createElement("td");
      celdaId.textContent = vehiculo.id;
      fila.appendChild(celdaId);

      // Placa (con estilo de placa amarilla)
      const celdaPlaca = document.createElement("td");
      const placa = document.createElement("span");
      placa.className = "placa-tabla";
      placa.textContent = vehiculo.placa;
      celdaPlaca.appendChild(placa);
      fila.appendChild(celdaPlaca);

      // Resto de datos
      const datosVehiculo = [
        vehiculo.marca,
        vehiculo.linea,
        vehiculo.modelo,
        vehiculo.color,
        nombrePropietario(vehiculo.idCliente)
      ];

      datosVehiculo.forEach((dato) => {
        const celda = document.createElement("td");
        celda.textContent = dato;
        fila.appendChild(celda);
      });

      // Botones
      const celdaAcciones = document.createElement("td");

      const botonEditar = document.createElement("button");
      botonEditar.type = "button";
      botonEditar.className = "btn-editar-vehiculo";
      botonEditar.dataset.id = vehiculo.id;
      botonEditar.textContent = "Editar";

      const botonEliminar = document.createElement("button");
      botonEliminar.type = "button";
      botonEliminar.className = "btn-eliminar-vehiculo";
      botonEliminar.dataset.id = vehiculo.id;
      botonEliminar.textContent = "Eliminar";

      celdaAcciones.appendChild(botonEditar);
      celdaAcciones.appendChild(botonEliminar);
      fila.appendChild(celdaAcciones);

      tablaVehiculos.appendChild(fila);
    });

    cantidadVehiculos.textContent =
      `${lista.length} ${lista.length === 1 ? "vehículo" : "vehículos"}`;
  }

  // ---------- BUSCAR ----------
  function aplicarFiltroVehiculos() {
    const texto = buscarVehiculo.value.toLowerCase().trim();

    const resultados = vehiculos.filter((vehiculo) => {
      return (
        vehiculo.placa.toLowerCase().includes(texto) ||
        vehiculo.marca.toLowerCase().includes(texto) ||
        nombrePropietario(vehiculo.idCliente).toLowerCase().includes(texto)
      );
    });

    mostrarVehiculos(resultados);
  }

  buscarVehiculo.addEventListener("input", aplicarFiltroVehiculos);

  // Al entrar a la sección se actualiza la tabla
  // (por si cambiaron los nombres de los clientes)
  if (enlaceVehiculos) {
    enlaceVehiculos.addEventListener("click", aplicarFiltroVehiculos);
  }

  // ---------- ABRIR Y CERRAR EL MODAL ----------
  function cerrarModalVehiculo() {
    formularioVehiculo.reset();
    modalVehiculo.hidden = true;
  }

  btnNuevoVehiculo.addEventListener("click", () => {
    // Un vehículo siempre debe tener dueño
    if (clientes.length === 0) {
      alert("Primero debes registrar al menos un cliente para asignarle el vehículo.");
      return;
    }

    const nuevoId = generarIdVehiculo();

    if (nuevoId === null) {
      alert("No es posible registrar más vehículos. Se alcanzó el límite de 9999 registros.");
      return;
    }

    formularioVehiculo.reset();
    modoEdicionVehiculo = false;
    llenarPropietarios();

    idVehiculo.value = nuevoId;

    tituloModalVehiculo.textContent = "Registrar vehículo";
    descripcionModalVehiculo.textContent = "Ingresa la información del nuevo vehículo.";
    guardarVehiculo.textContent = "Guardar vehículo";

    modalVehiculo.hidden = false;
    placaVehiculo.focus();
  });

  function abrirModalEditarVehiculo(id) {
    const vehiculo = vehiculos.find((item) => item.id === id);

    if (!vehiculo) {
      return;
    }

    modoEdicionVehiculo = true;
    llenarPropietarios();

    idVehiculo.value = vehiculo.id;
    placaVehiculo.value = vehiculo.placa;
    marcaVehiculo.value = vehiculo.marca;
    lineaVehiculo.value = vehiculo.linea;
    modeloVehiculo.value = vehiculo.modelo;
    colorVehiculo.value = vehiculo.color;
    propietarioVehiculo.value = vehiculo.idCliente;

    tituloModalVehiculo.textContent = "Editar vehículo";
    descripcionModalVehiculo.textContent = "Modifica la información del vehículo.";
    guardarVehiculo.textContent = "Actualizar vehículo";

    modalVehiculo.hidden = false;
    placaVehiculo.focus();
  }

  btnCerrarVehiculo.addEventListener("click", cerrarModalVehiculo);
  btnCancelarVehiculo.addEventListener("click", cerrarModalVehiculo);

  // La placa se escribe siempre en mayúsculas
  placaVehiculo.addEventListener("input", () => {
    placaVehiculo.value = placaVehiculo.value.toUpperCase();
  });

  // ---------- VALIDAR ----------
  function validarDatosVehiculo() {
    const placa = placaVehiculo.value.trim().toUpperCase();
    const marca = marcaVehiculo.value.trim();
    const linea = lineaVehiculo.value.trim();
    const modelo = modeloVehiculo.value.trim();
    const color = colorVehiculo.value.trim();
    const propietario = propietarioVehiculo.value;
    const patronTexto = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]+$/;

    if (!placa || !marca || !linea || !modelo || !color || !propietario) {
      alert("Todos los campos son obligatorios.");
      return false;
    }

    // Placa de carro en Colombia: 3 letras y 3 números (ABC123)
    if (!/^[A-Z]{3}\d{3}$/.test(placa)) {
      alert("La placa debe tener 3 letras y 3 números. Ejemplo: ABC123");
      placaVehiculo.focus();
      return false;
    }

    const placaDuplicada = vehiculos.some(
      (vehiculo) =>
        vehiculo.placa === placa &&
        vehiculo.id !== idVehiculo.value
    );

    if (placaDuplicada) {
      alert("Ya existe un vehículo registrado con esa placa.");
      placaVehiculo.focus();
      return false;
    }

    if (!patronTexto.test(marca)) {
      alert("La marca solo debe contener letras.");
      marcaVehiculo.focus();
      return false;
    }

    const anio = Number(modelo);

    if (!Number.isInteger(anio) || anio < 1950 || anio > anioMaximo) {
      alert(`El modelo debe ser un año entre 1950 y ${anioMaximo}.`);
      modeloVehiculo.focus();
      return false;
    }

    if (!patronTexto.test(color)) {
      alert("El color solo debe contener letras.");
      colorVehiculo.focus();
      return false;
    }

    const clienteExiste = clientes.some((cliente) => cliente.id === propietario);

    if (!clienteExiste) {
      alert("El propietario seleccionado ya no existe.");
      propietarioVehiculo.focus();
      return false;
    }

    return true;
  }

  // ---------- GUARDAR (CREAR O ACTUALIZAR) ----------
  formularioVehiculo.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (!validarDatosVehiculo()) {
      return;
    }

    const datos = {
      placa: placaVehiculo.value.trim().toUpperCase(),
      marca: marcaVehiculo.value.trim(),
      linea: lineaVehiculo.value.trim(),
      modelo: modeloVehiculo.value.trim(),
      color: colorVehiculo.value.trim(),
      idCliente: propietarioVehiculo.value
    };

    const vehiculoExistente = vehiculos.find(
      (vehiculo) => vehiculo.id === idVehiculo.value
    );

    if (modoEdicionVehiculo && !vehiculoExistente) {
      alert("El vehículo seleccionado ya no existe.");
      return;
    }

    if (vehiculoExistente) {
      vehiculoExistente.placa = datos.placa;
      vehiculoExistente.marca = datos.marca;
      vehiculoExistente.linea = datos.linea;
      vehiculoExistente.modelo = datos.modelo;
      vehiculoExistente.color = datos.color;
      vehiculoExistente.idCliente = datos.idCliente;

      alert("Vehículo actualizado correctamente.");
    } else {
      vehiculos.push({
        id: idVehiculo.value,
        ...datos
      });

      alert("Vehículo registrado correctamente.");
    }

    aplicarFiltroVehiculos();
    cerrarModalVehiculo();
  });

  // ---------- BOTONES EDITAR Y ELIMINAR DE LA TABLA ----------
  tablaVehiculos.addEventListener("click", (evento) => {
    const botonEditar = evento.target.closest(".btn-editar-vehiculo");
    const botonEliminar = evento.target.closest(".btn-eliminar-vehiculo");

    if (botonEditar) {
      abrirModalEditarVehiculo(botonEditar.dataset.id);
      return;
    }

    if (botonEliminar) {
      const vehiculo = vehiculos.find(
        (item) => item.id === botonEliminar.dataset.id
      );

      if (!vehiculo) {
        return;
      }

      idVehiculoEliminar = vehiculo.id;

      eliminarIdVehiculo.textContent = vehiculo.id;
      eliminarPlacaVehiculo.textContent = vehiculo.placa;
      eliminarDescripcionVehiculo.textContent =
        `${vehiculo.marca} ${vehiculo.linea} ${vehiculo.modelo}`;

      modalEliminarVehiculo.hidden = false;
    }
  });

  // ---------- ELIMINAR ----------
  cancelarEliminarVehiculo.addEventListener("click", () => {
    modalEliminarVehiculo.hidden = true;
    idVehiculoEliminar = null;
  });

  confirmarEliminarVehiculo.addEventListener("click", () => {
    const posicion = vehiculos.findIndex(
      (vehiculo) => vehiculo.id === idVehiculoEliminar
    );

    if (posicion === -1) {
      alert("El vehículo seleccionado ya no existe.");
    } else {
      vehiculos.splice(posicion, 1);
      aplicarFiltroVehiculos();
      alert("Vehículo eliminado correctamente.");
    }

    modalEliminarVehiculo.hidden = true;
    idVehiculoEliminar = null;
  });

  mostrarVehiculos();
});
