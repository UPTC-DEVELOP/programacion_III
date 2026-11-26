
document.addEventListener("DOMContentLoaded", () => {

    // CONFIGURACIÓN

    const API_URL = "./panther/rest/empleados";
    const TOKEN_KEY = "servicesMechanic.pantherToken";

    let empleados = [];

    // ELEMENTOS DEL DOM

    const seccionEmpleados = document.getElementById("empleados");
    const btnRegistrar = document.getElementById("btn-registrar-empleado");
    const btnCerrar = document.getElementById("cerrar-modal-empleado");
    const btnCancelar = document.getElementById("btn-cancelar-empleado");

    const modal = document.getElementById("modal-empleado");
    const formulario = document.getElementById("formulario-empleado");

    const buscar = document.getElementById("buscar-empleado");
    const tabla = document.getElementById("tabla-empleados-body");
    const cantidad = document.getElementById("cantidad-empleados");

    const tituloModal = document.getElementById("titulo-modal-empleado");

    const idEmpleado = document.getElementById("empleado-id");
    const cedula = document.getElementById("empleado-cedula");
    const nombres = document.getElementById("empleado-nombres");
    const apellidos = document.getElementById("empleado-apellidos");
    const telefono = document.getElementById("empleado-telefono");
    const cargo = document.getElementById("empleado-cargo");

    if (
        !seccionEmpleados ||
        !formulario ||
        !tabla ||
        !modal ||
        !tituloModal ||
        !idEmpleado ||
        !cedula ||
        !nombres ||
        !apellidos ||
        !telefono ||
        !cargo
    ) {
        console.error("Faltan elementos del módulo de empleados.");
        return;
    }

    // AUTENTICACIÓN

    function obtenerToken() {
        return sessionStorage.getItem(TOKEN_KEY);
    }

    // CONEXIÓN CON LA API REST DE PANTHER

    async function solicitarAPI(url, opciones = {}) {

        const token = obtenerToken();

        if (!token) {
            throw new Error(
                "No hay una sesión activa. Inicia sesión nuevamente."
            );
        }

        const respuesta = await fetch(url, {
            ...opciones,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": token,
                ...opciones.headers
            }
        });

        let resultado;

        try {
            resultado = await respuesta.json();
        } catch (error) {
            throw new Error(
                "Panther no devolvió una respuesta JSON válida. HTTP " + respuesta.status
            );
        }

        console.log("Estado HTTP:", respuesta.status);
        console.log("Estado Panther:", resultado.state);

        const estadosValidos = [
            "OK",
            "CREATE",
            "UPDATE",
            "DELETE"
        ];

        if (
            !respuesta.ok ||
            !estadosValidos.includes(resultado.state)
        ) {

            const mensaje =
                (resultado.data && resultado.data.message) ||
                resultado.data ||
                resultado.message ||
                "No fue posible completar la operación.";

            throw new Error(
                typeof mensaje === "string"
                    ? mensaje
                    : "Error en la solicitud al servidor."
            );
        }

        return resultado;
    }

    // READ - CONSULTAR EMPLEADOS

    async function cargarEmpleados(texto = "") {

        try {

            const url = texto
                ? API_URL + "?q=" + encodeURIComponent(texto)
                : API_URL;

            const resultado = await solicitarAPI(url, {
                method: "GET"
            });

            if (
                !resultado.data ||
                !Array.isArray(resultado.data.empleados)
            ) {
                throw new Error(
                    "La respuesta no contiene una lista válida de empleados."
                );
            }

            empleados = resultado.data.empleados;

            mostrarEmpleados();

        } catch (error) {

            console.error(
                "Error al consultar empleados:",
                error.message
            );

        }
    }

    // MOSTRAR EMPLEADOS EN LA TABLA

    function mostrarEmpleados() {

        tabla.innerHTML = "";

        empleados.forEach((empleado) => {

            const fila = document.createElement("tr");

            const campos = [
                empleado.idEmpleado,
                empleado.cedula,
                empleado.nombres,
                empleado.apellidos,
                empleado.telefono,
                empleado.cargo
            ];

            campos.forEach((valor) => {

                const celda = document.createElement("td");

                celda.textContent =
                    valor !== null && valor !== undefined
                        ? valor
                        : "";

                fila.appendChild(celda);

            });

            const celdaAcciones = document.createElement("td");
            const contenedor = document.createElement("div");

            contenedor.className = "acciones-empleado";

            const botonEditar = document.createElement("button");

            botonEditar.type = "button";
            botonEditar.className = "btn-editar-empleado";
            botonEditar.dataset.id = empleado.idEmpleado;
            botonEditar.textContent = "Editar";

            const botonEliminar = document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.className = "btn-eliminar-empleado";
            botonEliminar.dataset.id = empleado.idEmpleado;
            botonEliminar.textContent = "Eliminar";

            contenedor.appendChild(botonEditar);
            contenedor.appendChild(botonEliminar);

            celdaAcciones.appendChild(contenedor);
            fila.appendChild(celdaAcciones);

            tabla.appendChild(fila);

        });

        if (cantidad) {

            cantidad.textContent =
                empleados.length + " " +
                (empleados.length === 1 ? "empleado" : "empleados");

        }
    }

    // ABRIR MODAL DE REGISTRO

    function abrirModalRegistrar() {

        formulario.reset();

        idEmpleado.value = "";

        tituloModal.textContent = "Registrar empleado";

        modal.hidden = false;
        modal.style.display = "flex";

        cedula.focus();
    }

    // ABRIR MODAL DE EDICIÓN

    function abrirModalEditar(id) {

        const empleado = empleados.find(
            (item) => String(item.idEmpleado) === String(id)
        );

        if (!empleado) {
            return;
        }

        idEmpleado.value = empleado.idEmpleado;
        cedula.value = empleado.cedula;
        nombres.value = empleado.nombres;
        apellidos.value = empleado.apellidos;
        telefono.value = empleado.telefono;
        cargo.value = empleado.cargo;

        tituloModal.textContent = "Editar empleado";

        modal.hidden = false;
        modal.style.display = "flex";

        cedula.focus();
    }

    // CERRAR MODAL

    function cerrarModal() {

        modal.hidden = true;
        modal.style.display = "";

        formulario.reset();

        idEmpleado.value = "";
    }

    // CREATE Y UPDATE - REGISTRAR Y ACTUALIZAR

    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        const datos = {
            cedula: cedula.value.trim(),
            nombres: nombres.value.trim(),
            apellidos: apellidos.value.trim(),
            telefono: telefono.value.trim(),
            cargo: cargo.value.trim()
        };

        if (
            !datos.cedula ||
            !datos.nombres ||
            !datos.apellidos ||
            !datos.telefono ||
            !datos.cargo
        ) {
            alert("Completa todos los campos.");
            return;
        }

        const editando = Boolean(idEmpleado.value);

        const url = editando
            ? API_URL + "/" + encodeURIComponent(idEmpleado.value)
            : API_URL;

        const metodo = editando ? "PUT" : "POST";

        try {

            await solicitarAPI(url, {
                method: metodo,
                body: JSON.stringify(datos)
            });

            alert(
                editando
                    ? "Empleado actualizado correctamente."
                    : "Empleado registrado correctamente."
            );

            cerrarModal();

            await cargarEmpleados(
                buscar ? buscar.value.trim() : ""
            );

        } catch (error) {

            console.error(
                "Error al guardar empleado:",
                error.message
            );

            alert(error.message);

        }
    });

    // DELETE - ELIMINAR EMPLEADO

    async function eliminarEmpleado(id) {

        const confirmar = confirm(
            "¿Estás seguro de eliminar al empleado " + id + "?"
        );

        if (!confirmar) {
            return;
        }

        try {

            await solicitarAPI(
                API_URL + "/" + encodeURIComponent(id),
                {
                    method: "DELETE",
                    body: JSON.stringify({
                        confirmacion: true
                    })
                }
            );

            alert("Empleado eliminado correctamente.");

            await cargarEmpleados(
                buscar ? buscar.value.trim() : ""
            );

        } catch (error) {

            console.error(
                "Error al eliminar empleado:",
                error.message
            );

            alert(error.message);

        }
    }

    // EVENTOS DE LA TABLA

    tabla.addEventListener("click", async (evento) => {

        const botonEditar =
            evento.target.closest(".btn-editar-empleado");

        const botonEliminar =
            evento.target.closest(".btn-eliminar-empleado");

        if (botonEditar) {

            abrirModalEditar(botonEditar.dataset.id);

            return;
        }

        if (botonEliminar) {

            await eliminarEmpleado(botonEliminar.dataset.id);

        }
    });

    // BUSCAR EMPLEADOS

    if (buscar) {

        buscar.addEventListener("input", () => {

            cargarEmpleados(buscar.value.trim());

        });
    }

    // EVENTOS DE LOS BOTONES

    if (btnRegistrar) {

        btnRegistrar.addEventListener(
            "click",
            abrirModalRegistrar
        );

    }

    if (btnCerrar) {

        btnCerrar.addEventListener(
            "click",
            cerrarModal
        );

    }

    if (btnCancelar) {

        btnCancelar.addEventListener(
            "click",
            cerrarModal
        );

    }

    modal.addEventListener("click", (evento) => {

        if (evento.target === modal) {

            cerrarModal();

        }
    });

    // CARGAR EMPLEADOS AL INGRESAR AL MÓDULO

    const enlaceEmpleados = document.querySelector(
        '.menu-sistema a[href="#empleados"]'
    );

    if (enlaceEmpleados) {

        enlaceEmpleados.addEventListener("click", () => {

            if (obtenerToken()) {

                cargarEmpleados(
                    buscar ? buscar.value.trim() : ""
                );

            }
        });
    }

    // CARGA INICIAL

    if (obtenerToken()) {

        cargarEmpleados();

    }

});
