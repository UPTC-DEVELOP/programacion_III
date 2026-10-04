document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("formVehiculo");
    const tabla = document.getElementById("tablaVehiculos");
    const selectCliente = document.getElementById("clienteVehiculo");

    let vehiculos = JSON.parse(localStorage.getItem("olimac_vehiculos")) || [];

    cargarClientes();

    function cargarClientes() {
        const clientes = JSON.parse(localStorage.getItem("olimac_clientes")) || [];
        selectCliente.innerHTML = `<option value="">Seleccione un cliente</option>`;

        clientes.forEach(function (cliente) {
            const opcion = document.createElement("option");

            opcion.value = cliente.nombre;
            opcion.textContent = `${cliente.nombre} - ${cliente.cedula}`;

            selectCliente.appendChild(opcion);
        });
    }
    mostrarVehiculos();

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const id = document.getElementById("vehiculoId").value;
        const placa = document.getElementById("placaVehiculo").value;
        const marca = document.getElementById("marcaVehiculo").value;
        const modelo = document.getElementById("modeloVehiculo").value;
        const color = document.getElementById("colorVehiculo").value;
        const tipo = document.getElementById("tipoVehiculo").value;
        const cliente = document.getElementById("clienteVehiculo").value;

        const vehiculo = {id: id || Date.now(),
            placa: placa,
            marca: marca,
            modelo: modelo,
            color: color,
            tipo: tipo,
            cliente: cliente
        };

        if (id) {
            vehiculos = vehiculos.map(function (v) {
                return v.id == id ? vehiculo : v;
            });
        } else {
            vehiculos.push(vehiculo);
        }

        localStorage.setItem("olimac_vehiculos", JSON.stringify(vehiculos));

        formulario.reset();
        document.getElementById("vehiculoId").value = "";

        mostrarVehiculos();
    });


    function mostrarVehiculos() {

        tabla.innerHTML = "";

        vehiculos.forEach(function (vehiculo) {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${vehiculo.placa}</td>
                <td>${vehiculo.marca}</td>
                <td>${vehiculo.modelo}</td>
                <td>${vehiculo.color}</td>
                <td>${vehiculo.tipo}</td>
                <td>${vehiculo.cliente}</td>
                <td>
                    <button onclick="editarVehiculo(${vehiculo.id})">
                        Editar
                    </button>

                    <button onclick="eliminarVehiculo(${vehiculo.id})">
                        Eliminar
                    </button>
                </td>
            `;

            tabla.appendChild(fila);
        });
    }


    window.editarVehiculo = function (id) {

        const vehiculo = vehiculos.find(function (v) {
            return v.id == id;
        });

        if (!vehiculo) {
            return;
        }

        document.getElementById("vehiculoId").value = vehiculo.id;
        document.getElementById("placaVehiculo").value = vehiculo.placa;
        document.getElementById("marcaVehiculo").value = vehiculo.marca;
        document.getElementById("modeloVehiculo").value = vehiculo.modelo;
        document.getElementById("colorVehiculo").value = vehiculo.color;
        document.getElementById("tipoVehiculo").value = vehiculo.tipo;
        document.getElementById("clienteVehiculo").value = vehiculo.cliente;

        document.getElementById("btnGuardarVehiculo").textContent =
            "Actualizar Vehículo";
    };


    window.eliminarVehiculo = function (id) {

        const confirmar = confirm(
            "¿Está seguro de eliminar este vehículo?"
        );

        if (!confirmar) {
            return;
        }

        vehiculos = vehiculos.filter(function (v) {
            return v.id != id;
        });

        localStorage.setItem(
            "olimac_vehiculos",
            JSON.stringify(vehiculos)
        );

        mostrarVehiculos();
    };

});