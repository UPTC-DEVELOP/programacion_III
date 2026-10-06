// datos similados
const clientes = [{
        id: 1,
        nombre: "Carlos Pérez"
    },
    {
        id: 2,
        nombre: "Laura Gómez"
    },
    {
        id: 3,
        nombre: "Andrés Martínez"
    }
];

const vehiculos = [{
        placa: "ABC123",
        marca: "Chevrolet",
        modelo: "Spark",
        idCliente: 1
    },
    {
        placa: "DEF456",
        marca: "Renault",
        modelo: "Logan",
        idCliente: 1
    },
    {
        placa: "XYZ789",
        marca: "Mazda",
        modelo: "Mazda 3",
        idCliente: 2
    },
    {
        placa: "JKL321",
        marca: "Toyota",
        modelo: "Corolla",
        idCliente: 3
    }
];

const empleados = [{
        id: 1,
        nombre: "Miguel Torres",
        disponible: true
    },
    {
        id: 2,
        nombre: "Juan Rodríguez",
        disponible: false
    },
    {
        id: 3,
        nombre: "Daniel López",
        disponible: true
    }
];

const clienteSelect = document.getElementById("cliente");
const placaSelect = document.getElementById("placa");
const empleadoSelect = document.getElementById("empleado");


// cargar clientes 

function cargarClientes() {

    clientes.forEach((cliente) => {

        const option = document.createElement("option");

        option.value = cliente.id;
        option.textContent = cliente.nombre;

        clienteSelect.appendChild(option);
    });
}

function cargarVehiculos(idCliente) {

    placaSelect.innerHTML =
        '<option value="">Seleccione un vehículo</option>';

    const vehiculosCliente = vehiculos.filter(
        (vehiculo) => vehiculo.idCliente === idCliente
    );

    vehiculosCliente.forEach((vehiculo) => {

        const option = document.createElement("option");

        option.value = vehiculo.placa;

        option.textContent =
            `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}`;

        placaSelect.appendChild(option);
    });
}

function cargarEmpleadosDisponibles() {

    const empleadosDisponibles = empleados.filter(
        (empleado) => empleado.disponible
    );

    empleadosDisponibles.forEach((empleado) => {

        const option = document.createElement("option");

        option.value = empleado.id;
        option.textContent = empleado.nombre;

        empleadoSelect.appendChild(option);
    });
}

clienteSelect.addEventListener("change", () => {

    const idCliente = Number(clienteSelect.value);

    cargarVehiculos(idCliente);
});

cargarClientes();
cargarEmpleadosDisponibles();

// REGISTRO DE SERVICIOS

const serviceForm = document.getElementById("serviceForm");
const descripcionInput = document.getElementById("descripcionServicio");
const fechaInput = document.getElementById("fechaServicio");
const horaInput = document.getElementById("horaServicio");
const formMessage = document.getElementById("formMessage");

// Arreglo donde se almacenarán los servicios
const servicios = [];

// Contador para generar identificadores únicos
let siguienteId = 1;

// REGISTRAR SERVICIO

serviceForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const idCliente = Number(clienteSelect.value);
    const placa = placaSelect.value;
    const idEmpleado = Number(empleadoSelect.value);
    const descripcionServicio = descripcionInput.value.trim();
    const fechaServicio = fechaInput.value;
    const horaServicio = horaInput.value;


    // VALIDACIONES


    if (!idCliente ||
        !placa ||
        !idEmpleado ||
        !descripcionServicio ||
        !fechaServicio ||
        !horaServicio
    ) {

        mostrarMensaje(
            "Por favor completa todos los campos.",
            "error"
        );

        return;
    }


    // Verificar que el cliente exista

    const clienteExiste = clientes.some(
        (cliente) => cliente.id === idCliente
    );

    if (!clienteExiste) {

        mostrarMensaje(
            "El cliente seleccionado no existe.",
            "error"
        );

        return;
    }


    // Verificar que el vehículo exista
    // y pertenezca al cliente

    const vehiculoValido = vehiculos.some(
        (vehiculo) =>
        vehiculo.placa === placa &&
        vehiculo.idCliente === idCliente
    );

    if (!vehiculoValido) {

        mostrarMensaje(
            "El vehículo no pertenece al cliente seleccionado.",
            "error"
        );

        return;
    }


    // Verificar que el empleado exista
    // y esté disponible

    const empleadoValido = empleados.some(
        (empleado) =>
        empleado.id === idEmpleado &&
        empleado.disponible
    );

    if (!empleadoValido) {

        mostrarMensaje(
            "Debe seleccionar un empleado disponible.",
            "error"
        );

        return;
    }


    // CREAR SERVICIO

    const nuevoServicio = {

        idServicio: siguienteId,
        idCliente: idCliente,
        placa: placa,
        descripcionServicio: descripcionServicio,
        idEmpleado: idEmpleado,
        fechaServicio: fechaServicio,
        horaServicio: horaServicio

    };


    // Guardar servicio

    servicios.push(nuevoServicio);

    // Preparar ID para el siguiente servicio

    siguienteId++;

    // Actualizar tabla

    mostrarServicios();

    console.log("Servicios registrados:", servicios);


    mostrarMensaje(
        "Servicio registrado correctamente.",
        "exito"
    );


    // Limpiar formulario

    serviceForm.reset();

    placaSelect.innerHTML =
        '<option value="">Seleccione un vehículo</option>';
});

// MOSTRAR MENSAJES

function mostrarMensaje(mensaje, tipo) {

    formMessage.textContent = mensaje;

    if (tipo === "exito") {
        formMessage.style.color = "#16a34a";
    } else {
        formMessage.style.color = "#dc2626";
    }
}

// MOSTRAR SERVICIOS

const servicesTableBody =
    document.getElementById("servicesTableBody");


function mostrarServicios() {

    // Limpiar tabla antes de volver a mostrar los datos
    servicesTableBody.innerHTML = "";


    // Mostrar mensaje si no existen servicios
    if (servicios.length === 0) {

        servicesTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">
                    No hay servicios registrados.
                </td>
            </tr>
        `;

        return;
    }


    servicios.forEach((servicio) => {

        // Buscar información del cliente
        const cliente = clientes.find(
            (cliente) =>
            cliente.id === servicio.idCliente
        );


        // Buscar información del empleado
        const empleado = empleados.find(
            (empleado) =>
            empleado.id === servicio.idEmpleado
        );


        // Crear fila
        const fila = document.createElement("tr");


        fila.innerHTML = `
            <td>${servicio.idServicio}</td>

            <td>
                ${cliente ? cliente.nombre : "No encontrado"}
            </td>

            <td>
                ${servicio.placa}
            </td>

            <td>
                ${servicio.descripcionServicio}
            </td>

            <td>
                ${empleado ? empleado.nombre : "No encontrado"}
            </td>

            <td>
                ${servicio.fechaServicio}
            </td>

            <td>
                ${servicio.horaServicio}
            </td>

            <td>
                <div class="table-actions">

                    <button
                        class="btn-edit"
                        data-id="${servicio.idServicio}"
                    >
                        Editar
                    </button>

                    <button
                        class="btn-delete"
                        data-id="${servicio.idServicio}"
                    >
                        Eliminar
                    </button>

                </div>
            </td>
        `;


        servicesTableBody.appendChild(fila);
    });
}


// Mostrar estado inicial de la tabla
mostrarServicios();