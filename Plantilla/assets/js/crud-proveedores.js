document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("formProveedor");
    const tabla = document.getElementById("tablaProveedores");

    let proveedores =
        JSON.parse(localStorage.getItem("olimac_proveedores")) || [];

    mostrarProveedores();

    formulario.addEventListener("submit", function (evento) {

        evento.preventDefault();

        const id = document.getElementById("proveedorId").value;
        const nit = document.getElementById("nitProveedor").value;
        const nombre = document.getElementById("nombreProveedor").value;
        const telefono = document.getElementById("telefonoProveedor").value;
        const correo = document.getElementById("correoProveedor").value;
        const direccion = document.getElementById("direccionProveedor").value;

        const proveedor = {
            id: id || Date.now(),
            nit: nit,
            nombre: nombre,
            telefono: telefono,
            correo: correo,
            direccion: direccion
        };

        if (id) {

            proveedores = proveedores.map(function (p) {
                return p.id == id ? proveedor : p;
            });

        } else {

            proveedores.push(proveedor);

        }

        localStorage.setItem("olimac_proveedores",JSON.stringify(proveedores));
        formulario.reset();
        document.getElementById("proveedorId").value = "";

        mostrarProveedores();
    });


    function mostrarProveedores() {

        tabla.innerHTML = "";

        proveedores.forEach(function (proveedor) {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${proveedor.nit}</td>
                <td>${proveedor.nombre}</td>
                <td>${proveedor.telefono}</td>
                <td>${proveedor.correo}</td>
                <td>${proveedor.direccion}</td>

                <td>

                    <button onclick="editarProveedor(${proveedor.id})">
                        Editar
                    </button>

                    <button onclick="eliminarProveedor(${proveedor.id})">
                        Eliminar
                    </button>

                </td>
            `;

            tabla.appendChild(fila);
        });
    }


    window.editarProveedor = function (id) {

        const proveedor = proveedores.find(function (p) {
            return p.id == id;
        });

        if (!proveedor) {
            return;
        }

        document.getElementById("proveedorId").value = proveedor.id;
        document.getElementById("nitProveedor").value = proveedor.nit;
        document.getElementById("nombreProveedor").value = proveedor.nombre;
        document.getElementById("telefonoProveedor").value = proveedor.telefono;
        document.getElementById("correoProveedor").value = proveedor.correo;
        document.getElementById("direccionProveedor").value = proveedor.direccion;

        document.getElementById("btnGuardarProveedor").textContent ="Actualizar Proveedor";
    };


    window.eliminarProveedor = function (id) {

        const confirmar = confirm(
            "¿Está seguro de eliminar este proveedor?"
        );

        if (!confirmar) {
            return;
        }

        proveedores = proveedores.filter(function (p) {
            return p.id != id;
        });

        localStorage.setItem(
            "olimac_proveedores",
            JSON.stringify(proveedores)
        );

        mostrarProveedores();
    };

});