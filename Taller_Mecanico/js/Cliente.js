document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost/programacion%203/Taller_Mecanico/panther/backend_panther/panther/rest/";
    const API_TOKEN_KEY = "pantherApiToken";

    const tablaContainer = document.getElementById("tabla-container");
    const listaClientes = document.getElementById("lista-clientes");
    const emptyState = document.getElementById("empty-state");
    const inputBusqueda = document.getElementById("input-busqueda");

    const modalCliente = document.getElementById("modal-cliente");
    const formCliente = document.getElementById("form-cliente");
    const btnAbrirModal = document.getElementById("btn-abrir-modal");
    const btnCerrarModal = document.getElementById("btn-cerrar-modal");
    const btnCancelar = document.getElementById("btn-cancelar");
    const modalTitulo = document.getElementById("modal-titulo");
    const btnGuardar = document.getElementById("btn-guardar");

    const inputId = document.getElementById("cliente-id");
    const inputCedula = document.getElementById("cliente-cedula");
    const inputNombres = document.getElementById("cliente-nombres");
    const inputApellidos = document.getElementById("cliente-apellidos");
    const inputTelefono = document.getElementById("cliente-telefono");
    const inputDireccion = document.getElementById("cliente-direccion");
    const inputTipoDocumento = document.getElementById("cliente-tipo-documento");
    const inputCorreo = document.getElementById("cliente-correo");

    let clientes = [];
    let tiposDocumento = [];

    async function solicitarApi(recurso, opciones = {}) {
        const token = sessionStorage.getItem(API_TOKEN_KEY);
        if (!token) {
            throw new Error("Falta el token de Panther en sessionStorage.");
        }

        const headers = Object.assign({}, opciones.headers || {});
        headers.Authorization = token;
        if (opciones.body) {
            headers["Content-Type"] = "application/json";
        }

        const respuesta = await fetch(API_BASE_URL + recurso, Object.assign({}, opciones, { headers }));
        const texto = await respuesta.text();
        let resultado = {};

        if (texto) {
            try {
                resultado = JSON.parse(texto);
            } catch (error) {
                throw new Error(`La API respondió con un formato inesperado (HTTP ${respuesta.status}).`);
            }
        }

        if (!respuesta.ok) {
            const mensaje = resultado.message || resultado.data || `Error HTTP ${respuesta.status}`;
            throw new Error(String(mensaje));
        }

        return resultado;
    }

    async function cargarTiposDocumento() {
        const respuesta = await solicitarApi("documenttypes/");
        if (!Array.isArray(respuesta.data)) {
            throw new Error("La respuesta de tipos de documento no contiene una lista.");
        }

        tiposDocumento = respuesta.data;
        inputTipoDocumento.innerHTML = '<option value="">Selecciona el tipo</option>';

        tiposDocumento.forEach(tipo => {
            const opcion = document.createElement("option");
            opcion.value = tipo.id;
            opcion.textContent = `${tipo.nombre_corto} - ${tipo.nombre_largo}`;
            inputTipoDocumento.appendChild(opcion);
        });
    }

    async function cargarClientes(filtro = inputBusqueda.value) {
        const respuesta = await solicitarApi("persons/");
        if (!Array.isArray(respuesta.data)) {
            throw new Error("La respuesta de personas no contiene una lista.");
        }

        clientes = respuesta.data;
        renderizarClientes(filtro);
    }

    function abrirModal() {
        modalCliente.classList.remove("d-none");
    }

    function cerrarModal() {
        modalCliente.classList.add("d-none");
        formCliente.reset();
        inputId.value = "";
        modalTitulo.textContent = "Registrar nuevo cliente";
        btnGuardar.textContent = "Registrar cliente";
    }

    function crearCelda(valor) {
        const celda = document.createElement("td");
        celda.textContent = valor == null ? "" : String(valor);
        return celda;
    }

    function renderizarClientes(filtro = "") {
        const textoBusqueda = filtro.toLowerCase().trim();
        const clientesFiltrados = clientes.filter(cliente => {
            const tipo = tiposDocumento.find(item => Number(item.id) === Number(cliente.document_type_id));
            const valores = [
                cliente.name,
                cliente.lastName,
                cliente.identitydocument,
                cliente.phone,
                cliente.email,
                cliente.address,
                tipo ? tipo.nombre_corto : ""
            ];

            return valores.some(valor => String(valor || "").toLowerCase().includes(textoBusqueda));
        });

        listaClientes.innerHTML = "";

        if (clientesFiltrados.length === 0) {
            tablaContainer.classList.add("d-none");
            emptyState.classList.remove("d-none");
            emptyState.innerHTML = textoBusqueda
                ? "<p>No se encontraron clientes.</p><p>Intenta realizar otra búsqueda.</p>"
                : "<p>Aún no hay clientes registrados.</p><p>Haz clic en <strong>+ Nuevo cliente</strong>.</p>";
            return;
        }

        tablaContainer.classList.remove("d-none");
        emptyState.classList.add("d-none");

        clientesFiltrados.forEach(cliente => {
            const fila = document.createElement("tr");
            const tipo = tiposDocumento.find(item => Number(item.id) === Number(cliente.document_type_id));
            const nombreCompleto = `${cliente.name || ""} ${cliente.lastName || ""}`.trim();

            fila.appendChild(crearCelda(nombreCompleto));
            fila.appendChild(crearCelda(tipo ? `${tipo.nombre_corto} - ${tipo.nombre_largo}` : ""));
            fila.appendChild(crearCelda(cliente.identitydocument));
            fila.appendChild(crearCelda(cliente.phone));
            fila.appendChild(crearCelda(cliente.email));
            fila.appendChild(crearCelda(cliente.address));

            const acciones = document.createElement("td");
            acciones.className = "acciones";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn-editar";
            botonEditar.dataset.id = cliente.id;
            botonEditar.textContent = "Editar";

            const botonDesactivar = document.createElement("button");
            botonDesactivar.type = "button";
            botonDesactivar.className = "btn-eliminar";
            botonDesactivar.dataset.id = cliente.id;
            botonDesactivar.textContent = "Desactivar";

            acciones.appendChild(botonEditar);
            acciones.appendChild(botonDesactivar);
            fila.appendChild(acciones);
            listaClientes.appendChild(fila);
        });
    }

    btnAbrirModal.addEventListener("click", () => {
        formCliente.reset();
        inputId.value = "";
        modalTitulo.textContent = "Registrar nuevo cliente";
        btnGuardar.textContent = "Registrar cliente";
        abrirModal();
    });

    btnCerrarModal.addEventListener("click", cerrarModal);
    btnCancelar.addEventListener("click", cerrarModal);

    formCliente.addEventListener("submit", async event => {
        event.preventDefault();

        const identitydocument = inputCedula.value.trim();
        const name = inputNombres.value.trim();
        const lastName = inputApellidos.value.trim();
        const phone = inputTelefono.value.trim();
        const address = inputDireccion.value.trim();
        const email = inputCorreo.value.trim();
        const documentTypeId = Number(inputTipoDocumento.value);

        if (!formCliente.reportValidity()) {
            return;
        }

        if (!Number.isInteger(documentTypeId) || documentTypeId <= 0) {
            alert("Selecciona un tipo de documento válido.");
            return;
        }

        if (identitydocument.length > 20 || name.length > 30 || lastName.length > 30 ||
            phone.length > 20 || address.length > 60) {
            alert("Uno o más campos superan el límite permitido por la base de datos.");
            return;
        }

        const duplicado = clientes.some(cliente =>
            String(cliente.identitydocument) === identitydocument &&
            String(cliente.id) !== String(inputId.value)
        );
        if (duplicado) {
            alert("Ya existe una persona con ese número de documento.");
            return;
        }

        const persona = {
            name: name,
            lastName: lastName,
            phone: phone,
            document_type_id: documentTypeId,
            identitydocument: identitydocument,
            email: email,
            address: address
        };

        const esEdicion = Boolean(inputId.value);
        btnGuardar.disabled = true;

        try {
            const recurso = esEdicion ? `persons/${encodeURIComponent(inputId.value)}` : "persons/";
            await solicitarApi(recurso, {
                method: esEdicion ? "PUT" : "POST",
                body: JSON.stringify(persona)
            });

            cerrarModal();
            await cargarClientes();
            alert(esEdicion ? "Cliente actualizado correctamente." : "Cliente registrado correctamente.");
        } catch (error) {
            alert(`No se pudo guardar el cliente: ${error.message}`);
        } finally {
            btnGuardar.disabled = false;
        }
    });

    listaClientes.addEventListener("click", async event => {
        const boton = event.target.closest("button");
        if (!boton) {
            return;
        }

        const cliente = clientes.find(item => String(item.id) === String(boton.dataset.id));
        if (!cliente) {
            alert("No se encontró el cliente seleccionado.");
            return;
        }

        if (boton.classList.contains("btn-editar")) {
            inputId.value = cliente.id;
            inputCedula.value = cliente.identitydocument || "";
            inputNombres.value = cliente.name || "";
            inputApellidos.value = cliente.lastName || "";
            inputTelefono.value = cliente.phone || "";
            inputDireccion.value = cliente.address || "";
            inputCorreo.value = cliente.email || "";
            inputTipoDocumento.value = String(cliente.document_type_id || "");
            modalTitulo.textContent = "Editar cliente";
            btnGuardar.textContent = "Guardar cambios";
            abrirModal();
            return;
        }

        if (boton.classList.contains("btn-eliminar")) {
            const confirmar = confirm(`¿Deseas desactivar a ${cliente.name} ${cliente.lastName}?`);
            if (!confirmar) {
                return;
            }

            try {
                await solicitarApi(`persons/${encodeURIComponent(cliente.id)}`, { method: "DELETE" });
                await cargarClientes();
            } catch (error) {
                alert(`No se pudo desactivar el cliente: ${error.message}`);
            }
        }
    });

    inputBusqueda.addEventListener("input", () => renderizarClientes(inputBusqueda.value));

    cargarTiposDocumento()
        .then(() => cargarClientes())
        .catch(error => {
            emptyState.classList.remove("d-none");
            emptyState.textContent = `No se pudieron cargar los datos: ${error.message}`;
            tablaContainer.classList.add("d-none");
        });
});
