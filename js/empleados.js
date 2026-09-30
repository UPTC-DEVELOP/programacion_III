/* CRUD DE EMPLEADOS */

document.addEventListener("DOMContentLoaded", () => {

    //  1. DATOS INICIALES (simulación frontend)
 
    let empleados = [
        { cedula: "80123456", nombre: "Mateo", apellido: "Mora", rol: "Mecánico", telefono: "3011112233", correo: "mateo@taller.co", estado: "Activo" },
        { cedula: "52987654", nombre: "Diana", apellido: "Suarez", rol: "Jefe de taller", telefono: "3022223344", correo: "diana@taller.co", estado: "Activo" },
        { cedula: "1020304050", nombre: "Juan Pablo", apellido: "Cárdenas", rol: "Recepción", telefono: "3033334455", correo: "juan@taller.co", estado: "Inactivo" }
    ];

    // 2. REFERENCIAS AL DOM

    const cuerpoTabla = document.getElementById("cuerpoTabla");
    const contadorRegistros = document.getElementById("contadorRegistros");
    const inputBusqueda = document.getElementById("inputBusqueda");

    const modalEmpleado = document.getElementById("modalEmpleado");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalSubtitulo = document.getElementById("modalSubtitulo");
    const formEmpleado = document.getElementById("formEmpleado");

    const inputCedula = document.getElementById("cedula");
    const inputNombre = document.getElementById("nombre");
    const inputApellido = document.getElementById("apellido");
    const inputTelefono = document.getElementById("telefono");
    const inputCorreo = document.getElementById("correo");
    const inputRol = document.getElementById("rol");

    const modalConfirmacion = document.getElementById("modalConfirmacion");
    const textoConfirmacion = document.getElementById("textoConfirmacion");
    const toast = document.getElementById("toast");
    const toastMensaje = document.getElementById("toastMensaje");

    let cedulaEditando = null; // null = creando, string = editando
    let cedulaAEliminar = null;

    // 3. RENDERIZAR TABLA

    function renderizarTabla(lista = empleados) {
        cuerpoTabla.innerHTML = "";

        if (lista.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="7" class="sin-resultados">
                        No se encontraron empleados con ese criterio.
                    </td>
                </tr>`;
            contadorRegistros.textContent = `0 de ${empleados.length} registros`;
            return;
        }

        lista.forEach((emp) => {
            const fila = document.createElement("tr");
            const claseBadge = emp.estado === "Activo" ? "badge-activo" : "badge-inactivo";

            fila.innerHTML = `
                <td>${emp.cedula}</td>
                <td>${emp.nombre} ${emp.apellido}</td>
                <td>${emp.rol}</td>
                <td>${emp.telefono}</td>
                <td>${emp.correo || "—"}</td>
                <td><span class="badge-estado ${claseBadge}">${emp.estado}</span></td>
                <td>
                    <div class="acciones-celda">
                        <button class="btn-accion btn-editar" data-cedula="${emp.cedula}">Editar</button>
                        <button class="btn-accion btn-eliminar" data-cedula="${emp.cedula}">
                            ${emp.estado === "Activo" ? "Inactivar" : "Activar"}
                        </button>
                    </div>
                </td>
            `;
            cuerpoTabla.appendChild(fila);
        });

        contadorRegistros.textContent = `${lista.length} de ${empleados.length} registros`;

        // Asignar eventos a los botones generados dinámicamente
        document.querySelectorAll(".btn-editar").forEach((btn) => {
            btn.addEventListener("click", () => abrirModalEdicion(btn.dataset.cedula));
        });

        document.querySelectorAll(".btn-eliminar").forEach((btn) => {
            btn.addEventListener("click", () => abrirConfirmacion(btn.dataset.cedula));
        });
    }

    // 4. ABRIR MODAL PARA CREAR

    function abrirModalCrear() {
        cedulaEditando = null;
        formEmpleado.reset();
        modalTitulo.textContent = "NUEVO EMPLEADO";
        modalSubtitulo.textContent = "Registra los datos del nuevo empleado";
        inputCedula.disabled = false;

        limpiarErrores();
        modalEmpleado.classList.add("activo");
    }

    // 5. ABRIR MODAL PARA EDITAR

    function abrirModalEdicion(cedula) {
        const emp = empleados.find((e) => e.cedula === cedula);
        if (!emp) return;

        cedulaEditando = cedula;
        modalTitulo.textContent = "EDITAR EMPLEADO";
        modalSubtitulo.textContent = "Modifica los datos del empleado";

        inputCedula.value = emp.cedula;
        inputCedula.disabled = true;
        inputNombre.value = emp.nombre;
        inputApellido.value = emp.apellido;
        inputTelefono.value = emp.telefono;
        inputCorreo.value = emp.correo || "";
        inputRol.value = emp.rol;

        limpiarErrores();
        modalEmpleado.classList.add("activo");
    }

    // 6. CERRAR MODAL

    function cerrarModal() {
        modalEmpleado.classList.remove("activo");
        formEmpleado.reset();
        limpiarErrores();
        cedulaEditando = null;
    }

    // 7. VALIDACIONES (según DAD)

    const regexCedula = /^[0-9]{7,10}$/;
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/;
    const regexTelefono = /^3[0-9]{9}$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function mostrarError(idError) {
        document.getElementById(idError).classList.add("visible");
    }

    function ocultarError(idError) {
        document.getElementById(idError).classList.remove("visible");
    }

    function limpiarErrores() {
        document.querySelectorAll(".campo-error").forEach((e) => e.classList.remove("visible"));
        document.querySelectorAll(".campo-grupo input, .campo-grupo select").forEach((e) => {
            e.classList.remove("valido", "invalido");
        });
    }

    function validarFormulario() {
        let valido = true;
        limpiarErrores();

        // Cédula
        const cedula = inputCedula.value.trim();
        if (!regexCedula.test(cedula)) {
            mostrarError("errorCedula");
            inputCedula.classList.add("invalido");
            valido = false;
        } else if (!cedulaEditando && empleados.some((e) => e.cedula === cedula)) {
            document.getElementById("errorCedula").textContent = "Esta cédula ya está registrada";
            mostrarError("errorCedula");
            inputCedula.classList.add("invalido");
            valido = false;
        } else {
            inputCedula.classList.add("valido");
        }

        // Nombre
        const nombre = inputNombre.value.trim();
        if (!regexNombre.test(nombre)) {
            mostrarError("errorNombre");
            inputNombre.classList.add("invalido");
            valido = false;
        } else {
            inputNombre.classList.add("valido");
        }

        // Apellido
        const apellido = inputApellido.value.trim();
        if (!regexNombre.test(apellido)) {
            mostrarError("errorApellido");
            inputApellido.classList.add("invalido");
            valido = false;
        } else {
            inputApellido.classList.add("valido");
        }

        // Teléfono
        const telefono = inputTelefono.value.trim();
        if (!regexTelefono.test(telefono)) {
            mostrarError("errorTelefono");
            inputTelefono.classList.add("invalido");
            valido = false;
        } else {
            inputTelefono.classList.add("valido");
        }

        // Correo (opcional pero si se ingresa debe ser válido)
        const correo = inputCorreo.value.trim();
        if (correo !== "" && !regexCorreo.test(correo)) {
            mostrarError("errorCorreo");
            inputCorreo.classList.add("invalido");
            valido = false;
        } else if (correo !== "" && empleados.some((e) => e.correo === correo && e.cedula !== cedulaEditando)) {
            document.getElementById("errorCorreo").textContent = "Este correo ya está registrado";
            mostrarError("errorCorreo");
            inputCorreo.classList.add("invalido");
            valido = false;
        } else if (correo !== "") {
            inputCorreo.classList.add("valido");
        }

        // Rol
        const rol = inputRol.value;
        if (rol === "") {
            mostrarError("errorRol");
            inputRol.classList.add("invalido");
            valido = false;
        } else {
            inputRol.classList.add("valido");
        }

        return valido;
    }

    // 8. VALIDACIÓN EN TIEMPO REAL

    inputCedula.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "");
        if (this.value === "") {
            this.classList.remove("valido", "invalido");
            ocultarError("errorCedula");
        } else if (regexCedula.test(this.value)) {
            this.classList.remove("invalido");
            this.classList.add("valido");
            ocultarError("errorCedula");
        } else {
            this.classList.remove("valido");
            this.classList.add("invalido");
        }
    });

    inputTelefono.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "");
        if (this.value === "") {
            this.classList.remove("valido", "invalido");
            ocultarError("errorTelefono");
        } else if (regexTelefono.test(this.value)) {
            this.classList.remove("invalido");
            this.classList.add("valido");
            ocultarError("errorTelefono");
        } else {
            this.classList.remove("valido");
            this.classList.add("invalido");
        }
    });

    inputNombre.addEventListener("input", function () {
        if (this.value === "") {
            this.classList.remove("valido", "invalido");
        } else if (regexNombre.test(this.value)) {
            this.classList.remove("invalido");
            this.classList.add("valido");
            ocultarError("errorNombre");
        } else {
            this.classList.remove("valido");
            this.classList.add("invalido");
        }
    });

    inputApellido.addEventListener("input", function () {
        if (this.value === "") {
            this.classList.remove("valido", "invalido");
        } else if (regexNombre.test(this.value)) {
            this.classList.remove("invalido");
            this.classList.add("valido");
            ocultarError("errorApellido");
        } else {
            this.classList.remove("valido");
            this.classList.add("invalido");
        }
    });

    inputCorreo.addEventListener("input", function () {
        if (this.value === "") {
            this.classList.remove("valido", "invalido");
            ocultarError("errorCorreo");
        } else if (regexCorreo.test(this.value)) {
            this.classList.remove("invalido");
            this.classList.add("valido");
            ocultarError("errorCorreo");
        } else {
            this.classList.remove("valido");
            this.classList.add("invalido");
        }
    });

    // 9. ENVÍO DEL FORMULARIO (Crear / Actualizar)

    formEmpleado.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!validarFormulario()) return;

        const cedula = inputCedula.value.trim();
        const nombre = inputNombre.value.trim();
        const apellido = inputApellido.value.trim();
        const telefono = inputTelefono.value.trim();
        const correo = inputCorreo.value.trim();
        const rol = inputRol.value;

        if (cedulaEditando) {
            // ACTUALIZAR
            const index = empleados.findIndex((e) => e.cedula === cedulaEditando);
            if (index !== -1) {
                empleados[index] = {
                    ...empleados[index],
                    nombre,
                    apellido,
                    telefono,
                    correo,
                    rol
                };
            }
            mostrarToast("Empleado actualizado correctamente", false);
        } else {
            // CREAR
            empleados.push({
                cedula,
                nombre,
                apellido,
                telefono,
                correo,
                rol,
                estado: "Activo"
            });
            mostrarToast("Empleado registrado correctamente", false);
        }

        cerrarModal();
        renderizarTabla();
    });

    // 10. CONFIRMACIÓN DE ELIMINACIÓN / INACTIVACIÓN
    
    function abrirConfirmacion(cedula) {
        const emp = empleados.find((e) => e.cedula === cedula);
        if (!emp) return;

        cedulaAEliminar = cedula;
        const accion = emp.estado === "Activo" ? "inactivar" : "activar";

        textoConfirmacion.innerHTML = `
            ¿Estás seguro que deseas <strong>${accion}</strong> al empleado
            <strong>${emp.nombre} ${emp.apellido}</strong>?
            Esta acción se puede revertir posteriormente.
        `;
        modalConfirmacion.classList.add("activo");
    }

    function cerrarConfirmacion() {
        modalConfirmacion.classList.remove("activo");
        cedulaAEliminar = null;
    }

    document.getElementById("btnConfirmarEliminar").addEventListener("click", () => {
        const emp = empleados.find((e) => e.cedula === cedulaAEliminar);
        if (emp) {
            emp.estado = emp.estado === "Activo" ? "Inactivo" : "Activo";
            mostrarToast(
                `Empleado ${emp.estado === "Activo" ? "activado" : "inactivado"} correctamente`,
                false
            );
        }
        cerrarConfirmacion();
        renderizarTabla();
    });

    // 11. BÚSQUEDA EN TIEMPO REAL

    inputBusqueda.addEventListener("input", function () {
        const termino = this.value.toLowerCase().trim();
        const filtrados = empleados.filter((e) => {
            return (
                e.cedula.includes(termino) ||
                e.nombre.toLowerCase().includes(termino) ||
                e.apellido.toLowerCase().includes(termino) ||
                e.rol.toLowerCase().includes(termino)
            );
        });
        renderizarTabla(filtrados);
    });

    // 12. TOAST DE NOTIFICACIÓN

    function mostrarToast(mensaje, esError = false) {
        toastMensaje.textContent = mensaje;
        toast.classList.toggle("error", esError);
        toast.classList.add("visible");

        setTimeout(() => {
            toast.classList.remove("visible");
        }, 3500);
    }

    // 13. EVENTOS DE BOTONES

    document.getElementById("btnNuevoEmpleado").addEventListener("click", abrirModalCrear);
    document.getElementById("btnCancelar").addEventListener("click", cerrarModal);
    document.getElementById("btnCancelarConfirmacion").addEventListener("click", cerrarConfirmacion);

    // Cerrar modal al hacer clic fuera del contenido
    modalEmpleado.addEventListener("click", (e) => {
        if (e.target === modalEmpleado) cerrarModal();
    });

    modalConfirmacion.addEventListener("click", (e) => {
        if (e.target === modalConfirmacion) cerrarConfirmacion();
    });

    // 14. INICIALIZACIÓN

    renderizarTabla();
});