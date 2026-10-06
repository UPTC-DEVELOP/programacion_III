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