(() => {
  "use strict";

  const REPUESTOS_ENDPOINT = "panther/rest/spareparts";
  const PANTHER_TOKEN_KEY = "servicesMechanic.pantherToken";
  const MAXIMO_MENSAJE = 100;

  document.addEventListener("DOMContentLoaded", () => {
    const enlaceRepuestos = document.querySelector(
      '.menu-sistema a[href="#repuestos"]'
    );
    const enlacesMenu = document.querySelectorAll(".menu-sistema a");
    const seccionRepuestos = document.getElementById("repuestos");
    const tituloTopbar = document.querySelector(".topbar-sistema h2");
    const subtituloTopbar = document.querySelector(".topbar-sistema p");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    const btnNuevo = document.getElementById("btn-nuevo-repuesto");
    const buscar = document.getElementById("buscar-repuesto");
    const cantidad = document.getElementById("cantidad-repuestos");
    const mensaje = document.getElementById("mensaje-repuestos");
    const tabla = document.getElementById("lista-repuestos");
    const modalFormulario = document.getElementById("modal-repuesto");
    const formulario = document.getElementById("formulario-repuesto");
    const cerrarFormulario = document.getElementById("cerrar-modal-repuesto");
    const cancelarFormulario = document.getElementById(
      "cancelar-formulario-repuesto"
    );
    const guardar = document.getElementById("guardar-repuesto");
    const tituloModal = document.getElementById("titulo-modal-repuesto");
    const descripcionModal = document.getElementById(
      "descripcion-modal-repuesto"
    );
    const idRepuesto = document.getElementById("id-repuesto");
    const referencia = document.getElementById("referencia-repuesto");
    const descripcion = document.getElementById("descripcion-repuesto");
    const marca = document.getElementById("marca-repuesto");
    const precio = document.getElementById("precio-repuesto");
    const modalEliminar = document.getElementById("modal-eliminar-repuesto");
    const cancelarEliminar = document.getElementById(
      "cancelar-eliminar-repuesto"
    );
    const confirmarEliminar = document.getElementById(
      "confirmar-eliminar-repuesto"
    );
    const eliminarId = document.getElementById("eliminar-id-repuesto");
    const eliminarReferencia = document.getElementById(
      "eliminar-referencia-repuesto"
    );
    const eliminarDescripcion = document.getElementById(
      "eliminar-descripcion-repuesto"
    );
    const eliminarMarca = document.getElementById("eliminar-marca-repuesto");
    const eliminarPrecio = document.getElementById("eliminar-precio-repuesto");

    if (
      !enlaceRepuestos ||
      !seccionRepuestos ||
      !btnNuevo ||
      !buscar ||
      !cantidad ||
      !mensaje ||
      !tabla ||
      !modalFormulario ||
      !formulario ||
      !cerrarFormulario ||
      !cancelarFormulario ||
      !guardar ||
      !tituloModal ||
      !descripcionModal ||
      !idRepuesto ||
      !referencia ||
      !descripcion ||
      !marca ||
      !precio ||
      !modalEliminar ||
      !cancelarEliminar ||
      !confirmarEliminar ||
      !eliminarId ||
      !eliminarReferencia ||
      !eliminarDescripcion ||
      !eliminarMarca ||
      !eliminarPrecio
    ) {
      return;
    }

    let repuestosVisibles = [];
    let modoEdicion = false;
    let idPendienteEliminar = null;
    let temporizadorBusqueda = null;
    let controladorConsulta = null;

    class ErrorRepuestos extends Error {
      constructor(texto, status = 0, contenido = null) {
        super(texto);
        this.name = "ErrorRepuestos";
        this.status = status;
        this.contenido = contenido;
      }
    }

    function textoMensaje(valor, alternativo) {
      const texto = typeof valor === "string" ? valor.trim() : "";
      const base = texto || alternativo;
      return String(base).slice(0, MAXIMO_MENSAJE);
    }

    function mensajeRespuesta(contenido, alternativo) {
      if (contenido && typeof contenido.data === "string") {
        return textoMensaje(contenido.data, alternativo);
      }

      if (contenido && contenido.data) {
        if (typeof contenido.data.mensaje === "string") {
          return textoMensaje(contenido.data.mensaje, alternativo);
        }

        if (typeof contenido.data.message === "string") {
          return textoMensaje(contenido.data.message, alternativo);
        }
      }

      return textoMensaje("", alternativo);
    }

    function mostrarMensaje(texto, tipo = "") {
      mensaje.textContent = textoMensaje(texto, "Operación procesada.");
      mensaje.className = `mensaje-repuestos${tipo ? ` ${tipo}` : ""}`;
      mensaje.hidden = false;
    }

    function obtenerToken() {
      let token = "";

      try {
        token = sessionStorage.getItem(PANTHER_TOKEN_KEY) || "";
      } catch (error) {
        throw new ErrorRepuestos("No fue posible consultar la sesión de Panther.");
      }

      token = token.trim();

      if (!token) {
        throw new ErrorRepuestos("La sesión no está autenticada. Inicia sesión nuevamente.");
      }

      return token;
    }

    async function solicitarPanther(ruta, opciones = {}) {
      const token = obtenerToken();
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      };

      if (opciones.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      let respuesta;

      try {
        respuesta = await fetch(ruta, {
          ...opciones,
          cache: "no-store",
          headers: {
            ...headers,
            ...(opciones.headers || {})
          }
        });
      } catch (error) {
        if (error && error.name === "AbortError") {
          throw error;
        }

        throw new ErrorRepuestos("No fue posible conectar con Panther.");
      }

      let contenido;

      try {
        contenido = await respuesta.json();
      } catch (error) {
        throw new ErrorRepuestos(
          "Panther devolvió una respuesta que no es JSON válido.",
          respuesta.status
        );
      }

      const codigoPanther = Number(contenido && contenido.code);

      if (!respuesta.ok || codigoPanther !== respuesta.status) {
        throw new ErrorRepuestos(
          mensajeRespuesta(contenido, `Panther rechazó la solicitud HTTP ${respuesta.status}.`),
          respuesta.status,
          contenido
        );
      }

      return contenido;
    }

    function normalizarRepuesto(repuesto) {
      const id = repuesto && repuesto.idRepuesto;
      const campos = ["referencia", "descripcion", "marca"];
      const valorPrecio = Number(repuesto && repuesto.precio);

      if (
        typeof id !== "string" ||
        !/^(?!0000)\d{4}$/.test(id) ||
        campos.some((campo) => typeof repuesto[campo] !== "string") ||
        !Number.isFinite(valorPrecio) ||
        valorPrecio <= 0
      ) {
        throw new ErrorRepuestos("Panther devolvió un repuesto con formato no válido.");
      }

      return {
        idRepuesto: id,
        referencia: repuesto.referencia,
        descripcion: repuesto.descripcion,
        marca: repuesto.marca,
        precio: valorPrecio.toFixed(2)
      };
    }

    function formatoPrecio(valor) {
      return Number(valor).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    function mostrarFilaInformativa(texto) {
      tabla.innerHTML = "";
      repuestosVisibles = [];

      const fila = document.createElement("tr");
      const celda = document.createElement("td");
      celda.colSpan = 6;
      celda.textContent = texto;
      fila.appendChild(celda);
      tabla.appendChild(fila);
      cantidad.textContent = "0 repuestos";
    }

    function mostrarRepuestos(lista, mensajeVacio) {
      tabla.innerHTML = "";
      repuestosVisibles = lista;

      if (lista.length === 0) {
        mostrarFilaInformativa(mensajeVacio || "No se encontraron repuestos.");
        return;
      }

      lista.forEach((repuesto) => {
        const fila = document.createElement("tr");
        const datos = [
          repuesto.idRepuesto,
          repuesto.referencia,
          repuesto.descripcion,
          repuesto.marca,
          formatoPrecio(repuesto.precio)
        ];

        datos.forEach((dato) => {
          const celda = document.createElement("td");
          celda.textContent = dato;
          fila.appendChild(celda);
        });

        const acciones = document.createElement("td");
        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "btn-editar-repuesto";
        editar.dataset.id = repuesto.idRepuesto;
        editar.textContent = "Editar";

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "btn-eliminar-repuesto";
        eliminar.dataset.id = repuesto.idRepuesto;
        eliminar.textContent = "Eliminar";

        acciones.appendChild(editar);
        acciones.appendChild(eliminar);
        fila.appendChild(acciones);
        tabla.appendChild(fila);
      });

      cantidad.textContent = `${lista.length} ${
        lista.length === 1 ? "repuesto" : "repuestos"
      }`;
    }

    function repuestoPorId(id) {
      return repuestosVisibles.find((repuesto) => repuesto.idRepuesto === id);
    }

    async function consultarRepuestos(criterio = "") {
      const criterioLimpio = criterio.trim();

      if (Array.from(criterioLimpio).length > 100) {
        throw new ErrorRepuestos("El criterio de búsqueda permite máximo 100 caracteres.");
      }

      if (controladorConsulta) {
        controladorConsulta.abort();
      }

      const controladorActual = new AbortController();
      controladorConsulta = controladorActual;
      mostrarFilaInformativa("Consultando repuestos...");

      try {
        const parametro = criterioLimpio
          ? `?q=${encodeURIComponent(criterioLimpio)}`
          : "";
        const respuesta = await solicitarPanther(
          `${REPUESTOS_ENDPOINT}${parametro}`,
          { method: "GET", signal: controladorActual.signal }
        );

        if (
          respuesta.state !== "OK" ||
          Number(respuesta.code) !== 200 ||
          !respuesta.data ||
          !Array.isArray(respuesta.data.repuestos)
        ) {
          throw new ErrorRepuestos("Panther devolvió una consulta de repuestos incompleta.");
        }

        const lista = respuesta.data.repuestos.map(normalizarRepuesto);
        mostrarRepuestos(lista, respuesta.data.mensaje);
      } finally {
        if (controladorConsulta === controladorActual) {
          controladorConsulta = null;
        }
      }
    }

    async function cargarRepuestos(criterio = "") {
      try {
        await consultarRepuestos(criterio);
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }

        const texto =
          error instanceof Error
            ? error.message
            : "No fue posible consultar los repuestos.";
        mostrarFilaInformativa(textoMensaje(texto, "No fue posible consultar."));
        mostrarMensaje(texto, "error");
      }
    }

    function cerrarModalFormulario() {
      formulario.reset();
      modalFormulario.hidden = true;
      modoEdicion = false;
    }

    function abrirRegistro() {
      formulario.reset();
      modoEdicion = false;
      idRepuesto.value = "Automático";
      tituloModal.textContent = "Registrar repuesto";
      descripcionModal.textContent = "Ingresa la información del nuevo repuesto.";
      guardar.textContent = "Guardar repuesto";
      modalFormulario.hidden = false;
      referencia.focus();
    }

    function abrirEdicion(id) {
      const repuesto = repuestoPorId(id);

      if (!repuesto) {
        mostrarMensaje("El repuesto seleccionado ya no está disponible.", "error");
        return;
      }

      modoEdicion = true;
      idRepuesto.value = repuesto.idRepuesto;
      referencia.value = repuesto.referencia;
      descripcion.value = repuesto.descripcion;
      marca.value = repuesto.marca;
      precio.value = repuesto.precio;
      tituloModal.textContent = "Editar repuesto";
      descripcionModal.textContent = "Modifica los datos sin cambiar el identificador.";
      guardar.textContent = "Actualizar repuesto";
      modalFormulario.hidden = false;
      referencia.focus();
    }

    function validarTexto(campo, nombre, maximo) {
      const valor = campo.value.trim();

      if (!valor) {
        throw new ErrorRepuestos(`${nombre} no puede estar vacío ni contener solo espacios.`);
      }

      if (Array.from(valor).length > maximo) {
        throw new ErrorRepuestos(`${nombre} permite máximo ${maximo} caracteres.`);
      }

      return valor;
    }

    function datosFormulario() {
      const precioTexto = precio.value.trim();

      if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(precioTexto)) {
        throw new ErrorRepuestos("Precio debe ser numérico y tener máximo dos decimales.");
      }

      const precioNumero = Number(precioTexto);

      if (!Number.isFinite(precioNumero) || precioNumero <= 0) {
        throw new ErrorRepuestos("Precio debe ser mayor que cero.");
      }

      return {
        referencia: validarTexto(referencia, "Referencia", 20),
        descripcion: validarTexto(descripcion, "Descripción", 100),
        marca: validarTexto(marca, "Marca", 40),
        precio: Number(precioNumero.toFixed(2))
      };
    }

    function abrirConfirmacion(id) {
      const repuesto = repuestoPorId(id);

      if (!repuesto) {
        mostrarMensaje("El repuesto seleccionado ya no está disponible.", "error");
        return;
      }

      idPendienteEliminar = repuesto.idRepuesto;
      eliminarId.textContent = repuesto.idRepuesto;
      eliminarReferencia.textContent = repuesto.referencia;
      eliminarDescripcion.textContent = repuesto.descripcion;
      eliminarMarca.textContent = repuesto.marca;
      eliminarPrecio.textContent = formatoPrecio(repuesto.precio);
      modalEliminar.hidden = false;
    }

    function datosEliminacion(contenido) {
      const datos = contenido && contenido.data;

      if (
        !datos ||
        typeof datos.idRepuesto !== "string" ||
        typeof datos.eliminado !== "boolean" ||
        typeof datos.mensaje !== "string"
      ) {
        return null;
      }

      return datos;
    }

    async function procesarEliminacion(confirmacion) {
      if (!idPendienteEliminar) {
        modalEliminar.hidden = true;
        return;
      }

      const id = idPendienteEliminar;
      cancelarEliminar.disabled = true;
      confirmarEliminar.disabled = true;

      try {
        const respuesta = await solicitarPanther(
          `${REPUESTOS_ENDPOINT}/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
            body: JSON.stringify({ confirmacion })
          }
        );
        const datos = datosEliminacion(respuesta);

        if (!datos || datos.idRepuesto !== id) {
          throw new ErrorRepuestos("Panther devolvió una respuesta de eliminación incompleta.");
        }

        mostrarMensaje(datos.mensaje, datos.eliminado ? "exito" : "");
        modalEliminar.hidden = true;
        idPendienteEliminar = null;

        if (datos.eliminado) {
          buscar.value = "";
          await cargarRepuestos();
        }
      } catch (error) {
        const datos = datosEliminacion(error && error.contenido);

        if (datos && datos.idRepuesto === id) {
          mostrarMensaje(datos.mensaje, "error");
          modalEliminar.hidden = true;
          idPendienteEliminar = null;
        } else {
          mostrarMensaje(
            error instanceof Error ? error.message : "No fue posible procesar la eliminación.",
            "error"
          );

          if (!confirmacion) {
            modalEliminar.hidden = true;
            idPendienteEliminar = null;
          }
        }
      } finally {
        cancelarEliminar.disabled = false;
        confirmarEliminar.disabled = false;
      }
    }

    function ocultarSeccionesDelSistema() {
      ["dashboard", "clientes", "vehiculos", "empleados", "repuestos"].forEach(
        (id) => {
          const seccion = document.getElementById(id);
          if (seccion) seccion.hidden = true;
        }
      );
      enlacesMenu.forEach((enlace) => enlace.classList.remove("activo"));
    }

    enlaceRepuestos.addEventListener("click", (evento) => {
      evento.preventDefault();
      ocultarSeccionesDelSistema();
      seccionRepuestos.hidden = false;
      enlaceRepuestos.classList.add("activo");
      if (tituloTopbar) tituloTopbar.textContent = "Repuestos";
      if (subtituloTopbar) subtituloTopbar.textContent = "Registro y consulta de repuestos";
      cargarRepuestos(buscar.value);
    });

    enlacesMenu.forEach((enlace) => {
      if (enlace === enlaceRepuestos) return;

      enlace.addEventListener("click", () => {
        seccionRepuestos.hidden = true;
        enlaceRepuestos.classList.remove("activo");
        cerrarModalFormulario();
        modalEliminar.hidden = true;
        idPendienteEliminar = null;
      });
    });

    buscar.addEventListener("input", () => {
      window.clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = window.setTimeout(() => {
        cargarRepuestos(buscar.value);
      }, 300);
    });

    btnNuevo.addEventListener("click", abrirRegistro);
    cerrarFormulario.addEventListener("click", cerrarModalFormulario);
    cancelarFormulario.addEventListener("click", cerrarModalFormulario);

    tabla.addEventListener("click", (evento) => {
      const editar = evento.target.closest(".btn-editar-repuesto");
      const eliminar = evento.target.closest(".btn-eliminar-repuesto");

      if (editar) {
        abrirEdicion(editar.dataset.id);
      } else if (eliminar) {
        abrirConfirmacion(eliminar.dataset.id);
      }
    });

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      let payload;

      try {
        payload = datosFormulario();
      } catch (error) {
        mostrarMensaje(error.message, "error");
        return;
      }

      const esEdicion = modoEdicion;
      const id = idRepuesto.value;
      guardar.disabled = true;
      guardar.textContent = esEdicion ? "Actualizando..." : "Guardando...";

      try {
        const respuesta = await solicitarPanther(
          esEdicion ? `${REPUESTOS_ENDPOINT}/${encodeURIComponent(id)}` : REPUESTOS_ENDPOINT,
          {
            method: esEdicion ? "PUT" : "POST",
            body: JSON.stringify(payload)
          }
        );
        const estadoValido = esEdicion
          ? respuesta.state === "OK" && Number(respuesta.code) === 200
          : respuesta.state === "CREATE" && Number(respuesta.code) === 201;

        if (
          !estadoValido ||
          !respuesta.data ||
          typeof respuesta.data.idRepuesto !== "string"
        ) {
          throw new ErrorRepuestos("Panther devolvió una respuesta incompleta al guardar.");
        }

        const texto = mensajeRespuesta(
          respuesta,
          esEdicion ? "Repuesto actualizado exitosamente." : "Repuesto registrado exitosamente."
        );
        cerrarModalFormulario();
        buscar.value = "";
        mostrarMensaje(texto, "exito");
        await cargarRepuestos();
      } catch (error) {
        mostrarMensaje(
          error instanceof Error ? error.message : "No fue posible guardar el repuesto.",
          "error"
        );
      } finally {
        guardar.disabled = false;
        guardar.textContent = esEdicion ? "Actualizar repuesto" : "Guardar repuesto";
      }
    });

    cancelarEliminar.addEventListener("click", () => procesarEliminacion(false));
    confirmarEliminar.addEventListener("click", () => procesarEliminacion(true));

    if (btnCerrarSesion) {
      btnCerrarSesion.addEventListener("click", () => {
        if (controladorConsulta) {
          controladorConsulta.abort();
          controladorConsulta = null;
        }

        window.clearTimeout(temporizadorBusqueda);
        repuestosVisibles = [];
        buscar.value = "";
        seccionRepuestos.hidden = true;
        cerrarModalFormulario();
        modalEliminar.hidden = true;
        idPendienteEliminar = null;
        mostrarFilaInformativa("Consulta los repuestos después de iniciar sesión.");
        mensaje.hidden = true;
      });
    }

    mostrarFilaInformativa("Selecciona Repuestos para consultar los registros.");
  });
})();
