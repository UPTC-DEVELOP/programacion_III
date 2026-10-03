document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "lja_clientes_db";


    // ==============================
    // ELEMENTOS DEL HTML
    // ==============================

    const tablaContainer = document.getElementById("tabla-container");
    const listaClientes = document.getElementById("lista-clientes");
    const emptyState = document.getElementById("empty-state");

    const inputBusqueda = document.getElementById("input-busqueda");

    // Modal
    const modalCliente = document.getElementById("modal-cliente");
    const formCliente = document.getElementById("form-cliente");

    const btnAbrirModal = document.getElementById("btn-abrir-modal");
    const btnCerrarModal = document.getElementById("btn-cerrar-modal");
    const btnCancelar = document.getElementById("btn-cancelar");

    const modalTitulo = document.getElementById("modal-titulo");
    const btnGuardar = document.getElementById("btn-guardar");

    // Campos
    const inputId = document.getElementById("cliente-id");
    const inputCedula = document.getElementById("cliente-cedula");
    const inputNombres = document.getElementById("cliente-nombres");
    const inputApellidos = document.getElementById("cliente-apellidos");
    const inputTelefono = document.getElementById("cliente-telefono");
    const inputDireccion = document.getElementById("cliente-direccion");


    // ==============================
    // OBTENER CLIENTES
    // ==============================

    function obtenerClientes() {

        const data = localStorage.getItem(STORAGE_KEY);

        if (!data) {
            return [];
        }

        try {
            return JSON.parse(data);
        } catch (error) {

            console.error(
                "Error al obtener los clientes:",
                error
            );

            return [];
        }
    }


    // ==============================
    // GUARDAR CLIENTES
    // ==============================

    function guardarClientes(clientes) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(clientes)
        );
    }


    // ==============================
    // ABRIR MODAL
    // ==============================

    function abrirModal() {

        modalCliente.classList.remove("d-none");

    }


    // ==============================
    // CERRAR MODAL
    // ==============================

    function cerrarModal() {

        modalCliente.classList.add("d-none");

        formCliente.reset();

        inputId.value = "";

        modalTitulo.textContent = "Registrar nuevo cliente";

        btnGuardar.textContent = "Registrar cliente";
    }


    // ==============================
    // NUEVO CLIENTE
    // ==============================

    btnAbrirModal.addEventListener(
        "click",
        () => {

            formCliente.reset();

            inputId.value = "";

            modalTitulo.textContent =
                "Registrar nuevo cliente";

            btnGuardar.textContent =
                "Registrar cliente";

            abrirModal();
        }
    );


    // ==============================
    // CERRAR MODAL
    // ==============================

    btnCerrarModal.addEventListener(
        "click",
        cerrarModal
    );


    btnCancelar.addEventListener(
        "click",
        cerrarModal
    );


    // ==============================
    // RENDERIZAR CLIENTES
    // ==============================

    function renderizarClientes(filtro = "") {

        const clientes = obtenerClientes();

        const textoBusqueda =
            filtro.toLowerCase().trim();


        // Limpiar tabla
        listaClientes.innerHTML = "";


        // Filtrar clientes
        const clientesFiltrados = clientes.filter(cliente => {

            const nombres =
                cliente.nombres || "";

            const apellidos =
                cliente.apellidos || "";

            const cedula =
                String(cliente.cedula || "");

            const telefono =
                String(cliente.telefono || "");


            const nombreCompleto =
                `${nombres} ${apellidos}`
                    .toLowerCase();


            return (
                nombreCompleto.includes(textoBusqueda) ||
                cedula.toLowerCase().includes(textoBusqueda) ||
                telefono.toLowerCase().includes(textoBusqueda)
            );

        });


        // No hay clientes
        if (clientesFiltrados.length === 0) {

            tablaContainer.classList.add("d-none");

            emptyState.classList.remove("d-none");

            if (clientes.length > 0 && textoBusqueda !== "") {

                emptyState.innerHTML = `
                    <p>No se encontraron clientes.</p>
                    <p>Intenta realizar otra búsqueda.</p>
                `;
            }

            return;
        }


        // Mostrar tabla
        tablaContainer.classList.remove("d-none");

        emptyState.classList.add("d-none");


        // Crear filas
        clientesFiltrados.forEach(cliente => {

            const tr = document.createElement("tr");


            // Fecha
            let fechaRegistro = "Sin fecha";

            if (cliente.fechaRegistro) {

                fechaRegistro =
                    new Date(cliente.fechaRegistro)
                        .toLocaleDateString("es-CO");
            }


            tr.innerHTML = `
                
                <td>
                    <strong>
                        ${cliente.nombres || ""} 
                        ${cliente.apellidos || ""}
                    </strong>
                </td>

                <td>
                    ${cliente.cedula || ""}
                </td>

                <td>
                    ${cliente.telefono || ""}
                </td>

                <td>
                    ${cliente.direccion || ""}
                </td>

                <td>
                    ${fechaRegistro}
                </td>

                <td class="acciones">

                    <button
                        type="button"
                        class="btn-editar"
                        data-id="${cliente.id}">
                        Editar
                    </button>

                    <button
                        type="button"
                        class="btn-eliminar"
                        data-id="${cliente.id}">
                        Eliminar
                    </button>

                </td>
            `;


            listaClientes.appendChild(tr);

        });

    }


    // ==============================
    // GUARDAR / EDITAR CLIENTE
    // ==============================

    formCliente.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const cedula =
                inputCedula.value.trim();

            const nombres =
                inputNombres.value.trim();

            const apellidos =
                inputApellidos.value.trim();

            const telefono =
                inputTelefono.value.trim();

            const direccion =
                inputDireccion.value.trim();


            // Validar campos
            if (
                !cedula ||
                !nombres ||
                !apellidos ||
                !telefono ||
                !direccion
            ) {

                alert(
                    "Por favor completa todos los campos."
                );

                return;
            }


            const clientes =
                obtenerClientes();


            // ==========================
            // EDITAR
            // ==========================

            if (inputId.value) {

                const indice =
                    clientes.findIndex(
                        cliente =>
                            String(cliente.id) ===
                            String(inputId.value)
                    );


                if (indice !== -1) {

                    clientes[indice].cedula =
                        cedula;

                    clientes[indice].nombres =
                        nombres;

                    clientes[indice].apellidos =
                        apellidos;

                    clientes[indice].telefono =
                        telefono;

                    clientes[indice].direccion =
                        direccion;


                    guardarClientes(clientes);

                    cerrarModal();

                    renderizarClientes(
                        inputBusqueda.value
                    );

                    alert(
                        "Cliente actualizado correctamente."
                    );
                }

                return;
            }


            // ==========================
            // REGISTRAR
            // ==========================

            const nuevoCliente = {

                id: Date.now(),

                cedula: cedula,

                nombres: nombres,

                apellidos: apellidos,

                telefono: telefono,

                direccion: direccion,

                fechaRegistro:
                    new Date().toISOString()
            };


            clientes.push(nuevoCliente);


            guardarClientes(clientes);


            cerrarModal();

            renderizarClientes(
                inputBusqueda.value
            );


            alert(
                "Cliente registrado correctamente."
            );

        }
    );


    // ==============================
    // BOTONES EDITAR / ELIMINAR
    // ==============================

    listaClientes.addEventListener(
        "click",
        function(event) {

            const boton =
                event.target;


            // ==========================
            // EDITAR
            // ==========================

            if (
                boton.classList.contains(
                    "btn-editar"
                )
            ) {

                const id =
                    boton.dataset.id;

                editarCliente(id);

            }


            // ==========================
            // ELIMINAR
            // ==========================

            if (
                boton.classList.contains(
                    "btn-eliminar"
                )
            ) {

                const id =
                    boton.dataset.id;

                eliminarCliente(id);

            }

        }
    );


    // ==============================
    // EDITAR CLIENTE
    // ==============================

    function editarCliente(id) {

        const clientes =
            obtenerClientes();


        const cliente =
            clientes.find(
                c =>
                    String(c.id) ===
                    String(id)
            );


        if (!cliente) {

            alert(
                "No se encontró el cliente."
            );

            return;
        }


        inputId.value =
            cliente.id;

        inputCedula.value =
            cliente.cedula || "";

        inputNombres.value =
            cliente.nombres || "";

        inputApellidos.value =
            cliente.apellidos || "";

        inputTelefono.value =
            cliente.telefono || "";

        inputDireccion.value =
            cliente.direccion || "";


        modalTitulo.textContent =
            "Editar cliente";

        btnGuardar.textContent =
            "Guardar cambios";


        abrirModal();

    }


    // ==============================
    // ELIMINAR CLIENTE
    // ==============================

    function eliminarCliente(id) {

        const clientes =
            obtenerClientes();


        const cliente =
            clientes.find(
                c =>
                    String(c.id) ===
                    String(id)
            );


        if (!cliente) {
            return;
        }


        const confirmar =
            confirm(
                `¿Deseas eliminar al cliente ${cliente.nombres} ${cliente.apellidos}?`
            );


        if (!confirmar) {
            return;
        }


        const nuevosClientes =
            clientes.filter(
                c =>
                    String(c.id) !==
                    String(id)
            );


        guardarClientes(
            nuevosClientes
        );


        renderizarClientes(
            inputBusqueda.value
        );

    }


    // ==============================
    // BUSCAR CLIENTES
    // ==============================

    inputBusqueda.addEventListener(
        "input",
        function() {

            renderizarClientes(
                this.value
            );

        }
    );


    // ==============================
    // CARGAR AL INICIAR
    // ==============================

    renderizarClientes();

});