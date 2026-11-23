(() => {
  "use strict";

  const CLIENTS_ENDPOINT = "panther/rest/clients";
  const PANTHER_TOKEN_KEY = "servicesMechanic.pantherToken";

  document.addEventListener("DOMContentLoaded", () => {
    const clientes = datosTaller.clientes;
    const enlaceClientes = document.querySelector(
      '.menu-sistema a[href="#clientes"]'
    );
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    const btnNuevoCliente = document.querySelector(".btn-nuevo-cliente");
    const modalCliente = document.getElementById("modal-cliente");
    const btnCerrarCliente = document.querySelector(".cerrar-modal-cliente");
    const btnCancelarCliente = document.querySelector(".btn-cancelar-cliente");
    const formularioCliente = document.getElementById("formulario-cliente");
    const tablaClientes = document.getElementById("lista-clientes");
    const cantidadClientes = document.getElementById("cantidad-clientes");
    const buscarCliente = document.getElementById("buscar-cliente");
    const modalEliminarCliente = document.getElementById(
      "modal-eliminar-cliente"
    );
    const cancelarEliminarCliente = document.getElementById(
      "cancelar-eliminar-cliente"
    );
    const confirmarEliminarCliente = document.getElementById(
      "confirmar-eliminar-cliente"
    );
    const eliminarIdCliente = document.getElementById("eliminar-id-cliente");
    const eliminarCedulaCliente = document.getElementById(
      "eliminar-cedula-cliente"
    );
    const eliminarNombreCliente = document.getElementById(
      "eliminar-nombre-cliente"
    );
    const idCliente = document.getElementById("id-cliente");
    const cedulaCliente = document.getElementById("cedula-cliente");
    const nombresCliente = document.getElementById("nombres-cliente");
    const apellidosCliente = document.getElementById("apellidos-cliente");
    const telefonoCliente = document.getElementById("telefono-cliente");
    const direccionCliente = document.getElementById("direccion-cliente");
    const tituloModalCliente = document.getElementById("titulo-modal-cliente");
    const descripcionModalCliente = document.getElementById(
      "descripcion-modal-cliente"
    );
    const guardarCliente = document.getElementById("guardar-cliente");

    if (
      !enlaceClientes ||
      !btnNuevoCliente ||
      !modalCliente ||
      !btnCerrarCliente ||
      !btnCancelarCliente ||
      !formularioCliente ||
      !tablaClientes ||
      !cantidadClientes ||
      !buscarCliente ||
      !modalEliminarCliente ||
      !cancelarEliminarCliente ||
      !confirmarEliminarCliente ||
      !eliminarIdCliente ||
      !eliminarCedulaCliente ||
      !eliminarNombreCliente ||
      !idCliente ||
      !cedulaCliente ||
      !nombresCliente ||
      !apellidosCliente ||
      !telefonoCliente ||
      !direccionCliente ||
      !tituloModalCliente ||
      !descripcionModalCliente ||
      !guardarCliente
    ) {
      return;
    }

    let clientesVisibles = [];
    let modoEdicionCliente = false;
    let idClienteEliminar = null;
    let temporizadorBusqueda = null;
    let controladorConsulta = null;

    class ErrorPanther extends Error {
      constructor(mensaje, status = 0) {
        super(mensaje);
        this.name = "ErrorPanther";
        this.status = status;
      }
    }

    function obtenerToken() {
      let token = "";

      try {
        token = sessionStorage.getItem(PANTHER_TOKEN_KEY) || "";
      } catch (error) {
        throw new ErrorPanther(
          "El navegador no permitió consultar la sesión de Panther."
        );
      }

      token = token.trim();

      if (!token) {
        throw new ErrorPanther(
          "La sesión no está autenticada. Inicia sesión nuevamente."
        );
      }

      return token;
    }

    function mensajeRespuesta(contenido, mensajeAlternativo) {
      if (contenido && typeof contenido.data === "string") {
        return contenido.data;
      }

      if (
        contenido &&
        contenido.data &&
        typeof contenido.data.message === "string"
      ) {
        return contenido.data.message;
      }

      return mensajeAlternativo;
    }

    async function solicitarPanther(ruta, opciones = {}) {
      const token = obtenerToken();
      const headers = {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
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

        throw new ErrorPanther("No fue posible conectar con Panther.");
      }

      let contenido;

      try {
        contenido = await respuesta.json();
      } catch (error) {
        throw new ErrorPanther(
          "Panther devolvió una respuesta que no es JSON válido.",
          respuesta.status
        );
      }

      const codigoPanther = Number(contenido && contenido.code);

      if (!respuesta.ok || codigoPanther !== respuesta.status) {
        throw new ErrorPanther(
          mensajeRespuesta(
            contenido,
            `Panther rechazó la solicitud con HTTP ${respuesta.status}.`
          ),
          respuesta.status
        );
      }

      return contenido;
    }

    function normalizarCliente(cliente) {
      const id = cliente && cliente.idCliente;
      const campos = ["cedula", "nombres", "apellidos", "telefono", "direccion"];

      if (
        typeof id !== "string" ||
        !/^(?!0000)\d{4}$/.test(id) ||
        campos.some((campo) => typeof cliente[campo] !== "string")
      ) {
        throw new ErrorPanther(
          "Panther devolvió un cliente con un formato no válido."
        );
      }

      return {
        id,
        idCliente: id,
        cedula: cliente.cedula,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        telefono: cliente.telefono,
        direccion: cliente.direccion
      };
    }

    function sincronizarClientes(lista) {
      clientes.splice(0, clientes.length, ...lista);
    }

    function incorporarResultados(lista) {
      lista.forEach((cliente) => {
        const indice = clientes.findIndex((item) => item.id === cliente.id);

        if (indice === -1) {
          clientes.push(cliente);
        } else {
          clientes[indice] = cliente;
        }
      });
    }

    function mostrarMensajeTabla(mensaje) {
      tablaClientes.innerHTML = "";
      clientesVisibles = [];

      const fila = document.createElement("tr");
      const celda = document.createElement("td");
      celda.colSpan = 7;
      celda.textContent = mensaje;
      fila.appendChild(celda);
      tablaClientes.appendChild(fila);
      cantidadClientes.textContent = "0 clientes";
    }

    function mostrarClientes(lista, mensajeVacio) {
      tablaClientes.innerHTML = "";
      clientesVisibles = lista;

      if (lista.length === 0) {
        mostrarMensajeTabla(mensajeVacio || "No se encontraron clientes.");
        return;
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

    function clientePorId(id) {
      return (
        clientesVisibles.find((cliente) => cliente.id === id) ||
        clientes.find((cliente) => cliente.id === id)
      );
    }

    function mostrarError(error, mostrarEnTabla = false) {
      if (error && error.name === "AbortError") {
        return;
      }

      const mensaje =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al comunicarse con Panther.";

      if (mostrarEnTabla) {
        mostrarMensajeTabla(mensaje);
      }

      alert(mensaje);
    }

    async function consultarClientes(criterio = "") {
      if (controladorConsulta) {
        controladorConsulta.abort();
      }

      const controladorActual = new AbortController();
      controladorConsulta = controladorActual;
      mostrarMensajeTabla("Consultando clientes...");

      try {
        const parametro = criterio ? `?q=${encodeURIComponent(criterio)}` : "";
        const respuesta = await solicitarPanther(
          `${CLIENTS_ENDPOINT}${parametro}`,
          { method: "GET", signal: controladorActual.signal }
        );

        if (
          respuesta.state !== "OK" ||
          Number(respuesta.code) !== 200 ||
          !respuesta.data ||
          !Array.isArray(respuesta.data.clientes)
        ) {
          throw new ErrorPanther(
            "Panther devolvió una consulta de clientes incompleta."
          );
        }

        const lista = respuesta.data.clientes.map(normalizarCliente);

        if (criterio === "") {
          sincronizarClientes(lista);
        } else {
          incorporarResultados(lista);
        }

        mostrarClientes(lista, respuesta.data.message);
      } finally {
        if (controladorConsulta === controladorActual) {
          controladorConsulta = null;
        }
      }
    }

    async function cargarClientes(criterio = "") {
      try {
        await consultarClientes(criterio);
      } catch (error) {
        mostrarError(error, error && error.name !== "AbortError");
      }
    }

    function abrirModalEditar(id) {
      const cliente = clientePorId(id);

      if (!cliente) {
        alert("El cliente seleccionado ya no está disponible.");
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

    function cerrarModalCliente() {
      formularioCliente.reset();
      modalCliente.hidden = true;
      modoEdicionCliente = false;
    }

    function datosFormularioCliente() {
      return {
        cedula: cedulaCliente.value.trim(),
        nombres: nombresCliente.value.trim(),
        apellidos: apellidosCliente.value.trim(),
        telefono: telefonoCliente.value.trim(),
        direccion: direccionCliente.value.trim()
      };
    }

    enlaceClientes.addEventListener("click", () => {
      cargarClientes(buscarCliente.value.trim());
    });

    buscarCliente.addEventListener("input", () => {
      window.clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = window.setTimeout(() => {
        cargarClientes(buscarCliente.value.trim());
      }, 300);
    });

    btnNuevoCliente.addEventListener("click", () => {
      formularioCliente.reset();
      modoEdicionCliente = false;
      idCliente.value = "Automático";
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

      if (!botonEliminar) {
        return;
      }

      const cliente = clientePorId(botonEliminar.dataset.id);

      if (!cliente) {
        alert("El cliente seleccionado ya no está disponible.");
        return;
      }

      idClienteEliminar = cliente.id;
      eliminarIdCliente.textContent = cliente.id;
      eliminarCedulaCliente.textContent = cliente.cedula;
      eliminarNombreCliente.textContent =
        `${cliente.nombres} ${cliente.apellidos}`;
      modalEliminarCliente.hidden = false;
    });

    cancelarEliminarCliente.addEventListener("click", () => {
      modalEliminarCliente.hidden = true;
      idClienteEliminar = null;
    });

    confirmarEliminarCliente.addEventListener("click", async () => {
      if (!idClienteEliminar) {
        modalEliminarCliente.hidden = true;
        return;
      }

      const id = idClienteEliminar;
      confirmarEliminarCliente.disabled = true;
      confirmarEliminarCliente.textContent = "Verificando...";

      try {
        const respuesta = await solicitarPanther(
          `${CLIENTS_ENDPOINT}/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
            body: JSON.stringify({ confirmacion: true })
          }
        );

        alert(
          mensajeRespuesta(
            respuesta,
            "Panther procesó la solicitud de eliminación."
          )
        );
        await cargarClientes(buscarCliente.value.trim());
      } catch (error) {
        mostrarError(error);
      } finally {
        confirmarEliminarCliente.disabled = false;
        confirmarEliminarCliente.textContent = "Sí, eliminar";
        modalEliminarCliente.hidden = true;
        idClienteEliminar = null;
      }
    });

    formularioCliente.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const esEdicion = modoEdicionCliente;
      const id = idCliente.value;
      const payload = datosFormularioCliente();
      guardarCliente.disabled = true;
      guardarCliente.textContent = esEdicion
        ? "Actualizando..."
        : "Guardando...";

      let mensajeExito = "";

      try {
        const respuesta = await solicitarPanther(
          esEdicion
            ? `${CLIENTS_ENDPOINT}/${encodeURIComponent(id)}`
            : CLIENTS_ENDPOINT,
          {
            method: esEdicion ? "PUT" : "POST",
            body: JSON.stringify(payload)
          }
        );

        const respuestaValida = esEdicion
          ? respuesta.state === "OK" && Number(respuesta.code) === 200
          : respuesta.state === "CREATE" && Number(respuesta.code) === 201;

        if (
          !respuestaValida ||
          !respuesta.data ||
          typeof respuesta.data.idCliente !== "string"
        ) {
          throw new ErrorPanther(
            "Panther devolvió una respuesta incompleta al guardar el cliente."
          );
        }

        mensajeExito = mensajeRespuesta(
          respuesta,
          esEdicion
            ? "Cliente actualizado exitosamente."
            : "Cliente registrado exitosamente."
        );
      } catch (error) {
        mostrarError(error);
        return;
      } finally {
        guardarCliente.disabled = false;
        guardarCliente.textContent = esEdicion
          ? "Actualizar cliente"
          : "Guardar cliente";
      }

      cerrarModalCliente();
      buscarCliente.value = "";
      alert(mensajeExito);
      await cargarClientes();
    });

    btnCerrarCliente.addEventListener("click", cerrarModalCliente);
    btnCancelarCliente.addEventListener("click", cerrarModalCliente);

    if (btnCerrarSesion) {
      btnCerrarSesion.addEventListener("click", () => {
        if (controladorConsulta) {
          controladorConsulta.abort();
          controladorConsulta = null;
        }

        window.clearTimeout(temporizadorBusqueda);
        sincronizarClientes([]);
        clientesVisibles = [];
        buscarCliente.value = "";
        mostrarMensajeTabla("Consulta los clientes después de iniciar sesión.");
      });
    }

    mostrarMensajeTabla("Selecciona Clientes para consultar los registros.");
  });
})();
