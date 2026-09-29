

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

  const dashboard = document.getElementById("dashboard");
  const clientes = document.getElementById("clientes");
  const empleados = document.getElementById("empleados");

  const titulo = document.querySelector(".topbar-sistema h2");
  const subtitulo = document.querySelector(".topbar-sistema p");

  if (
    !enlaceInicio ||
    !enlaceClientes ||
    !enlaceEmpleados ||
    !dashboard ||
    !clientes ||
    !empleados
  ) {
    return;
  }

  function ocultarSecciones() {
    dashboard.hidden = true;
    clientes.hidden = true;
    empleados.hidden = true;

    enlaceInicio.classList.remove("activo");
    enlaceClientes.classList.remove("activo");
    enlaceEmpleados.classList.remove("activo");
  }

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

 // CRUD CLIENTES - CREATE

document.addEventListener("DOMContentLoaded", () => {
  const clientes = [];

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

  return String(mayorId + 1).padStart(4, "0");
}

  function mostrarClientes(lista = clientes) {
  tablaClientes.innerHTML = "";

  lista.forEach((cliente) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${cliente.id}</td>
      <td>${cliente.cedula}</td>
      <td>${cliente.nombres}</td>
      <td>${cliente.apellidos}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.direccion}</td>
      <td>
        <button
          type="button"
          class="btn-editar-cliente"
          data-id="${cliente.id}"
        >
          Editar
        </button>

        <button
          type="button"
          class="btn-eliminar-cliente"
          data-id="${cliente.id}"
        >
          Eliminar
        </button>
      </td>
    `;

    tablaClientes.appendChild(fila);
  });

  cantidadClientes.textContent =
    `${lista.length} ${lista.length === 1 ? "cliente" : "clientes"}`;
}

 buscarCliente.addEventListener("input", () => {
  const texto = buscarCliente.value.toLowerCase().trim();

  const resultados = clientes.filter((cliente) => {
    return (
      cliente.cedula.toLowerCase().includes(texto) ||
      cliente.nombres.toLowerCase().includes(texto) ||
      cliente.apellidos.toLowerCase().includes(texto)
    );
  });

  mostrarClientes(resultados);
});


  function abrirModalEditar(id) {
  const cliente = clientes.find((item) => item.id === id);

  if (!cliente) {
    return;
  }

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

  idCliente.value = generarIdCliente();

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
});

confirmarEliminarCliente.addEventListener("click", () => {
  const posicion = clientes.findIndex(
    (cliente) => cliente.id === idClienteEliminar
  );

  if (posicion === -1) {
    return;
  }

  clientes.splice(posicion, 1);

  mostrarClientes();

  modalEliminarCliente.hidden = true;
  idClienteEliminar = null;

  alert("Cliente eliminado correctamente.");
});

 formularioCliente.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const clienteExistente = clientes.find(
    (cliente) => cliente.id === idCliente.value
  );

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

  mostrarClientes();

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