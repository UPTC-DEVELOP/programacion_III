/* =========================================================
   TallerMax — Gestión de Empleados
   
   ========================================================= */

(function () {
  "use strict";

  // ---------- 1. REFERENCIAS A ELEMENTOS DEL HTML ----------
  const formEmpleado   = document.getElementById("formEmpleado");
  const inputCedula    = document.getElementById("cedula");
  const inputNombres   = document.getElementById("nombres");
  const inputApellidos = document.getElementById("apellidos");
  const selectCargo    = document.getElementById("cargo");
  const inputCedulaOriginal = document.getElementById("cedulaOriginal");

  const errorCedula    = document.getElementById("errorCedula");
  const errorNombres   = document.getElementById("errorNombres");
  const errorApellidos = document.getElementById("errorApellidos");
  const errorCargo     = document.getElementById("errorCargo");

  const tituloFormulario = document.getElementById("tituloFormulario");
  const btnGuardar     = document.getElementById("btnGuardar");
  const textoBtnGuardar = btnGuardar.querySelector(".boton__texto");
  const btnCancelar    = document.getElementById("btnCancelar");

  const inputBuscar    = document.getElementById("buscar");
  const btnBuscar      = document.getElementById("btnBuscar");
  const btnLimpiarBusqueda = document.getElementById("btnLimpiarBusqueda");

  const cuerpoTabla    = document.getElementById("cuerpoTabla");
  const sinResultados  = document.getElementById("sinResultados");
  const cajaMensaje    = document.getElementById("mensaje");

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

  // ---------- 3. SEGURIDAD: ESCAPAR TEXTO ANTES DE MOSTRARLO ----------
  // Convierte caracteres como < > & " en su versión segura (entidades HTML),
  // para que un nombre como "<b>Hola</b>" se vea como texto y no se ejecute
  // como HTML. Esto previene ataques XSS al usar innerHTML.
  function escaparHTML(texto) {
    const contenedorTemporal = document.createElement("div");
    contenedorTemporal.textContent = texto;
    return contenedorTemporal.innerHTML;
  }

  // ---------- 4. FUNCIONES DE ALMACENAMIENTO (localStorage) ----------
  // Usamos try/catch porque localStorage puede fallar (navegación privada,
  // almacenamiento lleno, permisos del navegador, etc.)

  function cargarEmpleados() {
    try {
      const datosGuardados = localStorage.getItem(LLAVE_ALMACENAMIENTO);
      empleados = datosGuardados ? JSON.parse(datosGuardados) : [];
    } catch (error) {
      console.error("No se pudieron cargar los empleados guardados:", error);
      empleados = [];
      mostrarMensaje("No se pudo leer la información guardada en este navegador.", "error");
    }
  }

  function guardarEmpleados() {
    try {
      localStorage.setItem(LLAVE_ALMACENAMIENTO, JSON.stringify(empleados));
      return true;
    } catch (error) {
      console.error("No se pudieron guardar los empleados:", error);
      mostrarMensaje("No se pudo guardar el cambio en este navegador.", "error");
      return false;
    }
  }

  // ---------- 5. VALIDACIONES (según la especificación RF-12 a RF-16) ----------

  function validarCedula(valor, cedulaQueEstamosEditando) {
    if (!valor.trim()) {
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
    if (!valor.trim()) {
      return "Los nombres son obligatorios.";
    }
    if (valor.length > 60) {
      return "Los nombres no pueden superar 60 caracteres.";
    }
    return "";
  }

  function validarApellidos(valor) {
    if (!valor.trim()) {
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

  function mostrarErrorCampo(inputElemento, spanError, mensaje) {
    spanError.textContent = mensaje;
    // Quitamos la clase "invalido" y la volvemos a poner en el mismo ciclo
    // para que la animación de sacudida (definida en el CSS) se repita
    // cada vez que el usuario vuelve a fallar la validación.
    inputElemento.classList.remove("invalido");
    if (mensaje) {
      // Forzamos un "reflow" leyendo una propiedad, truco simple para
      // poder reiniciar una animación CSS que ya se había reproducido.
      void inputElemento.offsetWidth;
      inputElemento.classList.add("invalido");
    }
  }

  function validarFormularioCompleto() {
    const cedulaOriginal = inputCedulaOriginal.value;

    const msjCedula    = validarCedula(inputCedula.value.trim(), cedulaOriginal);
    const msjNombres   = validarNombres(inputNombres.value.trim());
    const msjApellidos = validarApellidos(inputApellidos.value.trim());
    const msjCargo     = validarCargo(selectCargo.value);

    mostrarErrorCampo(inputCedula, errorCedula, msjCedula);
    mostrarErrorCampo(inputNombres, errorNombres, msjNombres);
    mostrarErrorCampo(inputApellidos, errorApellidos, msjApellidos);
    mostrarErrorCampo(selectCargo, errorCargo, msjCargo);

    return !msjCedula && !msjNombres && !msjApellidos && !msjCargo;
  }

  // ---------- 6. MENSAJES GENERALES (arriba de la página) ----------

  let temporizadorMensaje = null;

  function mostrarMensaje(texto, tipo) {
    cajaMensaje.textContent = texto;
    cajaMensaje.className = "mensaje mensaje--" + tipo; // "exito" o "error"

    // Si había un mensaje anterior por desaparecer, cancelamos ese aviso
    // para que no se cierre antes de tiempo el mensaje nuevo.
    if (temporizadorMensaje) {
      clearTimeout(temporizadorMensaje);
    }
    temporizadorMensaje = setTimeout(function () {
      cajaMensaje.className = "mensaje mensaje--oculto";
    }, 3000);
  }

  // ---------- 7.  REGISTRAR EMPLEADO / ACTUALIZAR EMPLEADO ----------

  formEmpleado.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (!validarFormularioCompleto()) {
      mostrarMensaje("Revisa los campos marcados en rojo.", "error");
      return;
    }

    // Feedback visual de "procesando" : mostramos
    // un pequeño spinner en el botón antes de confirmar el guardado. Como
    // el guardado es instantáneo, usamos un retraso corto solo para que
    // la persona perciba que la acción sí se está ejecutando.
    btnGuardar.classList.add("boton--cargando");
    btnGuardar.disabled = true;

    setTimeout(function () {
      guardarFormulario();
      btnGuardar.classList.remove("boton--cargando");
      btnGuardar.disabled = false;
    }, 280);
  });

  function guardarFormulario() {
    const cedulaOriginal = inputCedulaOriginal.value;

    const empleadoNuevo = {
      cedula: inputCedula.value.trim(),
      nombres: inputNombres.value.trim(),
      apellidos: inputApellidos.value.trim(),
      cargo: selectCargo.value,
    };

    let cedulaParaResaltar = empleadoNuevo.cedula;

    if (cedulaOriginal) {
      // --- MODO ACTUALIZAR ---
      const indice = empleados.findIndex(function (emp) {
        return emp.cedula === cedulaOriginal;
      });
      if (indice !== -1) {
        empleados[indice] = empleadoNuevo;
        if (guardarEmpleados()) {
          mostrarMensaje("Empleado actualizado correctamente.", "exito");
        }
      }
    } else {
      // --- MODO REGISTRAR  ---
      empleados.push(empleadoNuevo);
      if (guardarEmpleados()) {
        mostrarMensaje("Empleado registrado correctamente.", "exito");
      }
    }

    salirModoEdicion();
    renderizarTabla(null, cedulaParaResaltar);
  }

  function salirModoEdicion() {
    formEmpleado.reset();
    inputCedulaOriginal.value = "";
    inputCedula.disabled = false;
    tituloFormulario.textContent = "RF-12 · Registrar empleado";
    textoBtnGuardar.textContent = "Registrar empleado";
    btnCancelar.classList.add("oculto");
    limpiarErrores();
  }

  function limpiarErrores() {
    [errorCedula, errorNombres, errorApellidos, errorCargo].forEach(function (span) {
      span.textContent = "";
    });
    [inputCedula, inputNombres, inputApellidos, selectCargo].forEach(function (campo) {
      campo.classList.remove("invalido");
    });
  }

  btnCancelar.addEventListener("click", salirModoEdicion);

  // ---------- 8. CARGAR UN EMPLEADO EN EL FORMULARIO PARA EDITAR ----------

  function editarEmpleado(cedula) {
    const empleado = empleados.find(function (emp) {
      return emp.cedula === cedula;
    });
    if (!empleado) return;

    inputCedula.value = empleado.cedula;
    inputNombres.value = empleado.nombres;
    inputApellidos.value = empleado.apellidos;
    selectCargo.value = empleado.cargo;

    inputCedulaOriginal.value = empleado.cedula;
    inputCedula.disabled = true;

    tituloFormulario.textContent = "RF-14 · Actualizar empleado";
    textoBtnGuardar.textContent = "Guardar cambios";
    btnCancelar.classList.remove("oculto");
    limpiarErrores();

    formEmpleado.scrollIntoView({ behavior: "smooth" });
  }

  // ---------- 9.ELIMINAR EMPLEADO ----------

  function eliminarEmpleado(cedula) {
    const empleado = empleados.find(function (emp) {
      return emp.cedula === cedula;
    });
    if (!empleado) return;

    const confirmado = confirm(
      "¿Eliminar a " + empleado.nombres + " " + empleado.apellidos + "? Esta acción no se puede deshacer."
    );
    if (!confirmado) return;

    empleados = empleados.filter(function (emp) {
      return emp.cedula !== cedula;
    });

    if (guardarEmpleados()) {
      mostrarMensaje("Empleado eliminado.", "exito");
    }

    if (inputCedulaOriginal.value === cedula) {
      salirModoEdicion();
    }

    renderizarTabla();
  }

  // ---------- 10. CONSULTAR / BUSCAR EMPLEADO ----------

  btnBuscar.addEventListener("click", function () {
    const texto = inputBuscar.value.trim().toLowerCase();

    if (!texto) {
      renderizarTabla();
      return;
    }

    const resultados = empleados.filter(function (emp) {
      const nombreCompleto = (emp.nombres + " " + emp.apellidos).toLowerCase();
      return emp.cedula.includes(texto) || nombreCompleto.includes(texto);
    });

    renderizarTabla(resultados);

    if (resultados.length === 0) {
      mostrarMensaje("No se encontró ningún empleado con ese criterio.", "error");
    }
  });

  inputBuscar.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      btnBuscar.click();
    }
  });

  btnLimpiarBusqueda.addEventListener("click", function () {
    inputBuscar.value = "";
    renderizarTabla();
  });

  // ---------- 11. DIBUJAR LA TABLA EN PANTALLA ----------
  // "listaAMostrar": qué empleados pintar (si no se manda, se pintan todos).
  // "cedulaParaResaltar": si se manda, esa fila se resalta con una animación
  // (feedback visual de que "esto fue lo que acabas de guardar").

  function renderizarTabla(listaAMostrar, cedulaParaResaltar) {
    const lista = listaAMostrar || empleados;

    cuerpoTabla.innerHTML = "";

    if (lista.length === 0) {
      sinResultados.classList.remove("oculto");
      return;
    }
    sinResultados.classList.add("oculto");

    lista.forEach(function (emp) {
      const fila = document.createElement("tr");

      // Escapamos cada dato antes de insertarlo en el HTML (seguridad XSS).
      // Además agregamos data-etiqueta a cada celda: el CSS lo usa para
      // convertir la tabla en tarjetas apiladas en pantallas pequeñas.
      fila.innerHTML =
        "<td data-etiqueta='Cédula'>" + escaparHTML(emp.cedula) + "</td>" +
        "<td data-etiqueta='Nombres'>" + escaparHTML(emp.nombres) + "</td>" +
        "<td data-etiqueta='Apellidos'>" + escaparHTML(emp.apellidos) + "</td>" +
        "<td data-etiqueta='Cargo'>" + escaparHTML(emp.cargo) + "</td>" +
        "<td data-etiqueta='Acciones'>" +
          "<div class='acciones-fila'>" +
            "<button type='button' class='boton boton--secundario' data-accion='editar' data-cedula='" + escaparHTML(emp.cedula) + "'>Editar</button>" +
            "<button type='button' class='boton boton--peligro' data-accion='eliminar' data-cedula='" + escaparHTML(emp.cedula) + "'>Eliminar</button>" +
          "</div>" +
        "</td>";

      if (cedulaParaResaltar && emp.cedula === cedulaParaResaltar) {
        fila.classList.add("fila-resaltada");
      }

      cuerpoTabla.appendChild(fila);
    });
  }

  // Delegación de eventos: un solo listener en la tabla en vez de uno
  // por cada botón de cada fila.
  cuerpoTabla.addEventListener("click", function (evento) {
    const boton = evento.target.closest("button");
    if (!boton) return;

    const cedula = boton.dataset.cedula;
    const accion = boton.dataset.accion;

    if (accion === "editar") {
      editarEmpleado(cedula);
    } else if (accion === "eliminar") {
      eliminarEmpleado(cedula);
    }
  });

  // ---------- 12. VALIDACIÓN "EN VIVO" MIENTRAS EL USUARIO ESCRIBE ----------

  inputCedula.addEventListener("input", function () {
    inputCedula.value = inputCedula.value.replace(/\D/g, "");
  });

  // ---------- 13. INICIO: cuando la página carga, mostramos los datos guardados ----------

  cargarEmpleados();
  renderizarTabla();

})(); // <- Fin del módulo (IIFE): nada de esto queda expuesto en "window"
