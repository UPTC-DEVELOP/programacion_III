/* =========================================================
   TallerMax — Gestión de Empleados
   
   ========================================================= */

(function () {
  "use strict";

  // ---------- 1. REFERENCIAS A ELEMENTOS DEL HTML ----------
   const formulario        = document.getElementById("formularioNuevoEmpleado");
  const tituloFormulario  = document.getElementById("tituloFormularioEmpleado");
  const inputCedulaEditando = document.getElementById("empleadoCedulaEditando");

  const inputCedula    = document.getElementById("cedulaEmpleado");
  const inputNombres   = document.getElementById("nombresEmpleado");
  const inputApellidos = document.getElementById("apellidosEmpleado");
  const selectCargo    = document.getElementById("cargoEmpleado");

  const botonNuevo     = document.getElementById("botonNuevoEmpleado");
  const botonCancelar  = document.getElementById("botonCancelarEmpleado");
  const inputBuscar    = document.getElementById("buscarEmpleado");

  const estadoFormulario = document.getElementById("estadoFormularioEmpleado");
  const estadoGeneral    = document.getElementById("estadoEmpleados");

  const cuerpoTabla   = document.getElementById("cuerpoTablaEmpleados");
  const sinResultados = document.getElementById("mensajeSinEmpleados");

  const LLAVE_ALMACENAMIENTO = "tallermax_empleados";

  const CARGOS_VALIDOS = [
    "Mecánico",
    "Electricista automotriz",
    "Recepcionista",
    "Administrador",
    "Ayudante de taller",
  ];

  // ---------- 2. "BASE DE DATOS" EN MEMORIA ----------
  let empleados = [];
   // Guarda el temporizador que cierra el formulario después de guardar
  let temporizadorCierre = null;
  let temporizadorEstado = null;

   // ---------- 3. ALMACENAMIENTO (localStorage) ----------
  // Usamos try/catch porque localStorage puede fallar (navegación privada,
  // almacenamiento lleno, permisos del navegador, etc.)

  function cargarEmpleados() {
    try {
      const datosGuardados = localStorage.getItem(LLAVE_ALMACENAMIENTO);
      empleados = datosGuardados ? JSON.parse(datosGuardados) : [];
    } catch (error) {
      console.error("No se pudieron cargar los empleados guardados:", error);
      empleados = [];
      mostrarEstadoGeneral("No se pudo leer la información guardada en este navegador.", "error");
    }
  }

   
  function guardarEmpleados() {
    try {
       localStorage.setItem(LLAVE_ALMACENAMIENTO, JSON.stringify(empleados));
      return true;
    } catch (error) {
      console.error("No se pudieron guardar los empleados:", error);
      mostrarEstadoGeneral("No se pudo guardar el cambio en este navegador.", "error");
      return false;
    }
  }

// ---------- 4. VALIDACIONES ----------
  // Cada función devuelve un texto con el error, o "" si todo está bien.

  function validarCedula(valor, cedulaQueEstamosEditando) {
    if (!valor) {
      return "La cédula es obligatoria.";
    }
    if (!/^\d{10}$/.test(valor)) {
      return "La cédula debe tener exactamente 10 dígitos numéricos.";
    }
    const yaExiste = empleados.some(function (emp) {
      return emp.cedula === valor && valor !== cedulaQueEstamosEditando;
    });
    if (yaExiste) {
      return "Ya existe un empleado registrado con esta cédula.";
    }
    return "";
  }
  function validarNombres(valor) {
    if (!valor) {
      return "Los nombres son obligatorios.";
    }
    if (valor.length > 60) {
      return "Los nombres no pueden superar 60 caracteres.";
    }
    return "";
  }

  function validarApellidos(valor) {
    if (!valor) {
      return "Los apellidos son obligatorios.";
    }
    if (valor.length > 60) {
      return "Los apellidos no pueden superar 60 caracteres.";
    }
    return "";
  }

  function validarCargo(valor) {
    if (!valor) {
      return "Debe seleccionar un cargo.";
    }
    if (!CARGOS_VALIDOS.includes(valor)) {
      return "El cargo seleccionado no es válido.";
    }
    return "";
  }

  // Muestra (o borra) el error debajo de un campo y le pone el borde rojo
  function mostrarErrorCampo(campo, mensaje) {
    const spanError = formulario.querySelector('[data-error-for="' + campo.id + '"]');
    if (spanError) {
      spanError.textContent = mensaje;
    }

    // Quitamos la clase y la volvemos a poner para que la sacudida
    // se repita cada vez que el usuario vuelve a fallar.
    campo.classList.remove("invalid");
    if (mensaje) {
      void campo.offsetWidth; // truco para reiniciar la animación CSS
      campo.classList.add("invalid");
    }
  }

  function validarFormularioCompleto() {
    const cedulaOriginal = inputCedulaEditando.value;

    const msjCedula    = validarCedula(inputCedula.value.trim(), cedulaOriginal);
    const msjNombres   = validarNombres(inputNombres.value.trim());
    const msjApellidos = validarApellidos(inputApellidos.value.trim());
    const msjCargo     = validarCargo(selectCargo.value);

    mostrarErrorCampo(inputCedula, msjCedula);
    mostrarErrorCampo(inputNombres, msjNombres);
    mostrarErrorCampo(inputApellidos, msjApellidos);
    mostrarErrorCampo(selectCargo, msjCargo);

    return !msjCedula && !msjNombres && !msjApellidos && !msjCargo;
  }

  function limpiarErrores() {
    [inputCedula, inputNombres, inputApellidos, selectCargo].forEach(function (campo) {
      mostrarErrorCampo(campo, "");
    });
  }

  // ---------- 5. MENSAJES ----------

  // Mensaje general (arriba de la tabla): desaparece solo a los 3 segundos
  function mostrarEstadoGeneral(texto, tipo) {
    estadoGeneral.textContent = texto;
    estadoGeneral.className = "estado-formulario " + (tipo === "exito" ? "success" : "error");

    if (temporizadorEstado) {
      clearTimeout(temporizadorEstado);
    }
    temporizadorEstado = setTimeout(function () {
      estadoGeneral.textContent = "";
      estadoGeneral.className = "estado-formulario";
    }, 3000);
  }

  // Mensaje dentro del formulario
  function mostrarEstadoFormulario(texto, tipo) {
    estadoFormulario.textContent = texto;
    estadoFormulario.className = "estado-formulario " + (tipo === "exito" ? "success" : "error");
  }

   // ---------- 6. ABRIR Y CERRAR EL FORMULARIO ----------

  // Abre el formulario vacío para registrar un empleado nuevo
  function abrirFormularioNuevo() {
    cancelarCierrePendiente();
    formulario.reset();
    limpiarErrores();
    mostrarEstadoFormulario("", "exito");

    inputCedulaEditando.value = "";
    tituloFormulario.textContent = "Nuevo empleado";

    formulario.hidden = false;
    botonNuevo.setAttribute("aria-expanded", "true");
    inputCedula.focus();
  }

  // Abre el formulario con los datos ya llenos, listo para editar
  function abrirFormularioEdicion(cedula) {
    const empleado = empleados.find(function (emp) {
      return emp.cedula === cedula;
    });
    if (!empleado) return;

    cancelarCierrePendiente();
    limpiarErrores();
    mostrarEstadoFormulario("", "exito");

    inputCedulaEditando.value = empleado.cedula;
    inputCedula.value = empleado.cedula;
    inputNombres.value = empleado.nombres;
    inputApellidos.value = empleado.apellidos;
    selectCargo.value = empleado.cargo;
    tituloFormulario.textContent = "Editar empleado";

    formulario.hidden = false;
    botonNuevo.setAttribute("aria-expanded", "true");
    formulario.scrollIntoView({ behavior: "smooth", block: "center" });
  }


  // Cierra el formulario y lo deja limpio, sin datos de una edición anterior
  function cerrarFormulario() {
    cancelarCierrePendiente();
    formulario.reset();
    limpiarErrores();
    inputCedulaEditando.value = "";
    formulario.hidden = true;
    botonNuevo.setAttribute("aria-expanded", "false");
    mostrarEstadoFormulario("", "exito");
  }


  // Si el usuario abre el formulario otra vez antes de que se cierre solo, no lo cerramos
  function cancelarCierrePendiente() {
    if (temporizadorCierre) {
      clearTimeout(temporizadorCierre);
      temporizadorCierre = null;
    }
  }

  botonNuevo.addEventListener("click", abrirFormularioNuevo);
  botonCancelar.addEventListener("click", cerrarFormulario);

// ---------- 7. GUARDAR (REGISTRAR O ACTUALIZAR) ----------

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (!validarFormularioCompleto()) {
      mostrarEstadoFormulario("Revisa los campos marcados en rojo.", "error");
      return;
    }

    const cedulaOriginal = inputCedulaEditando.value;

    const datosEmpleado = {
      cedula: inputCedula.value.trim(),
      nombres: inputNombres.value.trim(),
      apellidos: inputApellidos.value.trim(),
      cargo: selectCargo.value,
    };

    let textoExito = "";

    if (cedulaOriginal) {
      // --- MODO ACTUALIZAR ---
      const indice = empleados.findIndex(function (emp) {
        return emp.cedula === cedulaOriginal;
      });
      if (indice === -1) {
        mostrarEstadoFormulario("No se encontró el empleado que intentas actualizar.", "error");
        return;
      }
      empleados[indice] = datosEmpleado;
      textoExito = 'Empleado "' + datosEmpleado.nombres + '" actualizado correctamente.';
    } else {
      // --- MODO REGISTRAR ---
      empleados.push(datosEmpleado);
      textoExito = 'Empleado "' + datosEmpleado.nombres + '" registrado correctamente.';
    }

    if (!guardarEmpleados()) {
      return; // guardarEmpleados() ya mostró el aviso de error
    }

    mostrarEstadoFormulario(textoExito, "exito");

    inputBuscar.value = ""; // limpiamos el buscador para que se vea el empleado guardado
    renderizarTabla(datosEmpleado.cedula);

    temporizadorCierre = setTimeout(cerrarFormulario, 1200);
  });

  // Mientras el usuario escribe: la cédula solo acepta números y se borra el error de ese campo
  inputCedula.addEventListener("input", function () {
    inputCedula.value = inputCedula.value.replace(/\D/g, "");
  });

  [inputCedula, inputNombres, inputApellidos, selectCargo].forEach(function (campo) {
    campo.addEventListener("input", function () {
      if (campo.classList.contains("invalid")) {
        mostrarErrorCampo(campo, "");
      }
    });
  });

// ---------- 8. ELIMINAR ----------

  function eliminarEmpleado(cedula) {
    const empleado = empleados.find(function (emp) {
      return emp.cedula === cedula;
    });
    if (!empleado) return;

    const confirmado = window.confirm(
      '¿Seguro que quieres eliminar a "' + empleado.nombres + " " + empleado.apellidos +
      '"? Esta acción no se puede deshacer.'
    );
    if (!confirmado) return;

    empleados = empleados.filter(function (emp) {
      return emp.cedula !== cedula;
    });

    if (guardarEmpleados()) {
      mostrarEstadoGeneral("Empleado eliminado.", "exito");
    }

    // Si justo se estaba editando a este empleado, cerramos el formulario
    if (inputCedulaEditando.value === cedula) {
      cerrarFormulario();
    }

    renderizarTabla();
  }

  // ---------- 9. BUSCADOR EN TIEMPO REAL ----------
  // Filtra por cédula o por nombre completo mientras se escribe

  inputBuscar.addEventListener("input", function () {
    renderizarTabla();
  });

  function obtenerEmpleadosFiltrados() {
    const texto = inputBuscar.value.trim().toLowerCase();

    if (texto === "") {
      return empleados;
    }

    return empleados.filter(function (emp) {
      const nombreCompleto = (emp.nombres + " " + emp.apellidos).toLowerCase();
      return emp.cedula.includes(texto) || nombreCompleto.includes(texto);
    });
  }

// ---------- 10. DIBUJAR LA TABLA ----------
  // Las celdas se crean con textContent (no con innerHTML), así un nombre
  // como "<b>Hola</b>" se ve como texto y nunca se ejecuta como HTML.

  function crearCelda(texto, etiqueta) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    // El CSS usa data-etiqueta para mostrar la tabla como tarjetas en el celular
    celda.setAttribute("data-etiqueta", etiqueta);
    return celda;
  }

  function crearBotonAccion(texto, clase, accion, cedula) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "enlace-accion-empleado " + clase;
    boton.textContent = texto;
    boton.dataset.accion = accion;
    boton.dataset.cedula = cedula;
    return boton;
  }

  // "cedulaParaResaltar": si se manda, esa fila se ilumina un momento
  function renderizarTabla(cedulaParaResaltar) {
    const lista = obtenerEmpleadosFiltrados();

    cuerpoTabla.innerHTML = "";

    if (lista.length === 0) {
      sinResultados.textContent = empleados.length === 0
        ? "Aún no hay empleados registrados."
        : "No se encontraron empleados con esos datos.";
      sinResultados.hidden = false;
      return;
    }
    sinResultados.hidden = true;

    lista.forEach(function (emp) {
      const fila = document.createElement("tr");

      fila.appendChild(crearCelda(emp.cedula, "Cédula"));
      fila.appendChild(crearCelda(emp.nombres, "Nombres"));
      fila.appendChild(crearCelda(emp.apellidos, "Apellidos"));
      fila.appendChild(crearCelda(emp.cargo, "Cargo"));

      const celdaAcciones = document.createElement("td");
      celdaAcciones.setAttribute("data-etiqueta", "Acciones");
      celdaAcciones.appendChild(crearBotonAccion("Editar", "enlace-editar-empleado", "editar", emp.cedula));
      celdaAcciones.appendChild(crearBotonAccion("Eliminar", "enlace-eliminar-empleado", "eliminar", emp.cedula));
      fila.appendChild(celdaAcciones);

      if (cedulaParaResaltar && emp.cedula === cedulaParaResaltar) {
        fila.classList.add("fila-resaltada");
      }

      cuerpoTabla.appendChild(fila);
    });
  }

  // Un solo "oyente" en la tabla para todos los botones (delegación de eventos)
  cuerpoTabla.addEventListener("click", function (evento) {
    const boton = evento.target.closest("button");
    if (!boton) return;

    if (boton.dataset.accion === "editar") {
      abrirFormularioEdicion(boton.dataset.cedula);
    } else if (boton.dataset.accion === "eliminar") {
      eliminarEmpleado(boton.dataset.cedula);
    }
  });

  // ---------- 11. INICIO ----------
  cargarEmpleados();
  renderizarTabla();

})(); // Fin del módulo (IIFE): nada de esto queda expuesto en "window"

