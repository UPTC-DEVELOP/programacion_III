document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("formEmpleado");
    const tabla = document.getElementById("tablaEmpleados");

    let empleados =
        JSON.parse(localStorage.getItem("olimac_empleados")) || [];

    mostrarEmpleados();

    formulario.addEventListener("submit", function (evento) {evento.preventDefault();

        const id = document.getElementById("empleadoId").value;
        const cedula = document.getElementById("cedulaEmpleado").value;
        const nombre = document.getElementById("nombreEmpleado").value;
        const telefono = document.getElementById("telefonoEmpleado").value;
        const correo = document.getElementById("correoEmpleado").value;
        const cargo = document.getElementById("cargoEmpleado").value;
        const salario = document.getElementById("salarioEmpleado").value;

        const empleado = {
            id: id || Date.now(),
            cedula: cedula,
            nombre: nombre,
            telefono: telefono,
            correo: correo,
            cargo: cargo,
            salario: salario
        };

        if (id) {

            empleados = empleados.map(function (e) {
                return e.id == id ? empleado : e;
            });

        } else {

            empleados.push(empleado);

        }

        localStorage.setItem("olimac_empleados", JSON.stringify(empleados));
        formulario.reset();
        document.getElementById("empleadoId").value = "";
        document.getElementById("btnGuardarEmpleado").textContent = "Registrar Empleado";

        mostrarEmpleados();
    });


    function mostrarEmpleados() {

        tabla.innerHTML = "";

        empleados.forEach(function (empleado) {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${empleado.cedula}</td>
                <td>${empleado.nombre}</td>
                <td>${empleado.telefono}</td>
                <td>${empleado.correo}</td>
                <td>${empleado.cargo}</td>
                <td>$${empleado.salario}</td>

                <td>

                    <button onclick="editarEmpleado(${empleado.id})">
                        Editar
                    </button>

                    <button onclick="eliminarEmpleado(${empleado.id})">
                        Eliminar
                    </button>

                </td>
            `;

            tabla.appendChild(fila);
        });
    }


    window.editarEmpleado = function (id) {

        const empleado = empleados.find(function (e) {
            return e.id == id;
        });

        if (!empleado) {
            return;
        }

        document.getElementById("empleadoId").value = empleado.id;
        document.getElementById("cedulaEmpleado").value = empleado.cedula;
        document.getElementById("nombreEmpleado").value = empleado.nombre;
        document.getElementById("telefonoEmpleado").value = empleado.telefono;
        document.getElementById("correoEmpleado").value = empleado.correo;
        document.getElementById("cargoEmpleado").value = empleado.cargo;
        document.getElementById("salarioEmpleado").value = empleado.salario;

        document.getElementById("btnGuardarEmpleado").textContent ="Actualizar Empleado";
    };


    window.eliminarEmpleado = function (id) {
        const confirmar = confirm("¿Está seguro de eliminar este empleado?");

        if (!confirmar) {
            return;
        }

        empleados = empleados.filter(function (e) {
            return e.id != id;
        });

        localStorage.setItem("olimac_empleados", JSON.stringify(empleados));

        mostrarEmpleados();
    };

});