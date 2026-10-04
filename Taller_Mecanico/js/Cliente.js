document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "lja_clientes_db";

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


   
    function guardarClientes(clientes) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(clientes)
        );
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


    btnCerrarModal.addEventListener(
        "click",
        cerrarModal
    );


    btnCancelar.addEventListener(
        "click",
        cerrarModal
    );


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


// Validar campos vacíos
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


// Validar cédula
const soloNumeros = /^[0-9]+$/;

if (!soloNumeros.test(cedula)) {

    alert(
        "La cédula solo debe contener números."
    );

    return;
}


if (
    cedula.length < 5 ||
    cedula.length > 12
) {

    alert(
        "La cédula debe tener entre 5 y 12 dígitos."
    );

    return;
}


// Validar nombres
const soloLetras =
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;


if (!soloLetras.test(nombres)) {

    alert(
        "Los nombres solo deben contener letras y espacios."
    );

    return;
}


if (
    nombres.length < 2 ||
    nombres.length > 50
) {

    alert(
        "Los nombres deben tener entre 2 y 50 caracteres."
    );

    return;
}


// Validar apellidos
if (!soloLetras.test(apellidos)) {

    alert(
        "Los apellidos solo deben contener letras y espacios."
    );

    return;
}


if (
    apellidos.length < 2 ||
    apellidos.length > 50
) {

    alert(
        "Los apellidos deben tener entre 2 y 50 caracteres."
    );

    return;
}


// Validar teléfono
if (!soloNumeros.test(telefono)) {

    alert(
        "El teléfono solo debe contener números."
    );

    return;
}


if (
    telefono.length < 7 ||
    telefono.length > 15
) {

    alert(
        "El teléfono debe tener entre 7 y 15 dígitos."
    );

    return;
}


// Validar dirección
if (
    direccion.length < 5 ||
    direccion.length > 100
) {

    alert(
        "La dirección debe tener entre 5 y 100 caracteres."
    );

    return;
}


const clientes =
    obtenerClientes();


// Validar cédula duplicada
const cedulaDuplicada =
    clientes.some(cliente => {

        return (
            String(cliente.cedula) === String(cedula) &&
            String(cliente.id) !== String(inputId.value)
        );

    });


if (cedulaDuplicada) {

    alert(
        "Ya existe un cliente registrado con esta cédula."
    );

    return;
}

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


    listaClientes.addEventListener(
        "click",
        function(event) {

            const boton =
                event.target;

            if (
                boton.classList.contains(
                    "btn-editar"
                )
            ) {

                const id =
                    boton.dataset.id;

                editarCliente(id);

            }

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

    inputBusqueda.addEventListener(
        "input",
        function() {

            renderizarClientes(
                this.value
            );

        }
    );

    renderizarClientes();

});