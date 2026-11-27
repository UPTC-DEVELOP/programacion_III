/* CRUD DE EMPLEADOS */

document.addEventListener("DOMContentLoaded", () => {

    let empleados = [];
    let guardando = false;

    async function solicitar(ruta = "", metodo = "GET", datos) {
        if (!Sesion.activa()) {
            Sesion.exigir();
            throw new Error("Inicia sesión para gestionar empleados.");
        }
        const opciones = {
            method: metodo,
            headers: { Accept: "application/json", authorization: Sesion.token() },
            cache: "no-store"
        };
        if (datos) {
            opciones.headers["Content-Type"] = "application/json";
            opciones.body = JSON.stringify(datos);
        }
        const respuesta = await fetch(CONFIG.API_BASE + "empleados" + ruta, opciones);
        const json = await respuesta.json().catch(() => null);
        if (!respuesta.ok || json?.state !== "OK") {
            throw new Error(typeof json?.data === "string" ? json.data : "Panther no confirmó la operación. Revisa la conexión y la ruta empleados.");
        }
        return json.data;
    }

    async function cargar() {
        try {
            const lista = await solicitar();
            if (!Array.isArray(lista)) throw new Error("Panther devolvió una lista inválida.");
            empleados = lista;
            filtrar();
        } catch (error) {
            contadorRegistros.textContent = "No se pudo actualizar la lista. Recarga para volver a consultar.";
            mostrarToast(error.message, true);
        }
    }

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
    let cedulaCambioEstado = null;

    const dialogoClave = document.getElementById("dialogoClave");
    const formClave = document.getElementById("formClave");
    const nuevaClave = document.getElementById("nuevaClave");
    const guardarClave = document.getElementById("guardarClave");
    const cancelarClave = document.getElementById("cancelarClave");
    const errorNuevaClave = document.getElementById("errorNuevaClave");

    const verNuevaClave = document.getElementById("verNuevaClave");
    function mostrarNuevaClave(visible) {
        nuevaClave.type = visible ? "text" : "password";
        verNuevaClave.textContent = visible ? "Ocultar" : "Ver";
        verNuevaClave.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    }
    verNuevaClave.addEventListener("click", () => mostrarNuevaClave(nuevaClave.type === "password"));

    function abrirCambioClave(emp) {
        mostrarNuevaClave(false);
        formClave.reset();
        formClave.dataset.cedula = emp.cedula;
        document.getElementById("cuentaClave").textContent = emp.nombre + " " + emp.apellido + " · " + emp.usuario;
        errorNuevaClave.textContent = "";
        dialogoClave.showModal();
        nuevaClave.focus();
    }

    cancelarClave.addEventListener("click", () => dialogoClave.close());
    dialogoClave.addEventListener("cancel", evento => {
        if (guardarClave.disabled) evento.preventDefault();
    });
    dialogoClave.addEventListener("close", () => formClave.reset());
    formClave.addEventListener("submit", async evento => {
        evento.preventDefault();
        if (guardarClave.disabled) return;
        const clave = nuevaClave.value;
        if ([...clave].length < 6 || new TextEncoder().encode(clave).length > 72) {
            errorNuevaClave.textContent = "Usa al menos 6 caracteres y como máximo 72 bytes.";
            return;
        }
        guardarClave.disabled = cancelarClave.disabled = true;
        try {
            await solicitar("/" + encodeURIComponent(formClave.dataset.cedula) + "/clave", "PUT", { clave });
            dialogoClave.close();
            mostrarToast("Contraseña actualizada.");
        } catch (error) {
            errorNuevaClave.textContent = error.message;
        } finally {
            guardarClave.disabled = cancelarClave.disabled = false;
        }
    });

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

            for (const valor of [emp.cedula, emp.nombre + " " + emp.apellido, emp.rol, emp.telefono, emp.correo || "—"]) {
                fila.insertCell().textContent = valor;
            }
            const badge = document.createElement("span");
            badge.className = "badge-estado " + claseBadge;
            badge.textContent = emp.estado;
            fila.insertCell().appendChild(badge);
            const acciones = document.createElement("div");
            acciones.className = "acciones-celda";
            for (const [clase, texto] of [["btn-editar", "Editar"], ["btn-eliminar", emp.estado === "Activo" ? "Inactivar" : "Activar"]]) {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "btn-accion " + clase;
                boton.dataset.cedula = emp.cedula;
                boton.textContent = texto;
                acciones.appendChild(boton);
            }
            if (emp.usuario) {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "btn-accion btn-restablecer";
                boton.textContent = "Restablecer clave";
                boton.addEventListener("click", () => abrirCambioClave(emp));
                acciones.appendChild(boton);
            }
            fila.insertCell().appendChild(acciones);
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
        if (guardando) return;
        cedulaEditando = null;
        formEmpleado.reset();
        pedirCredenciales(true);
        modalTitulo.textContent = "NUEVO EMPLEADO";
        modalSubtitulo.textContent = "Registra los datos del nuevo empleado";
        inputCedula.disabled = false;

        limpiarErrores();
        modalEmpleado.classList.add("activo");
    }

    // 5. ABRIR MODAL PARA EDITAR

    function abrirModalEdicion(cedula) {
        const emp = empleados.find((e) => e.cedula === cedula);
        if (guardando || !emp) return;

        cedulaEditando = cedula;
        pedirCredenciales(!emp.usuario);
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

    const credenciales = document.getElementById("credencialesEmpleado");
    const verClave = document.getElementById("verClaveEmpleado");
    const campoClave = document.getElementById("claveEmpleado");

    function mostrarClave(visible) {
        campoClave.type = visible ? "text" : "password";
        verClave.textContent = visible ? "Ocultar" : "Ver";
        verClave.setAttribute(
            "aria-label",
            visible ? "Ocultar contraseña" : "Mostrar contraseña"
        );
    }

    function pedirCredenciales(pedir) {
        mostrarClave(false);
        credenciales.hidden = !pedir;
        credenciales.disabled = !pedir;
    }

    verClave.addEventListener("click", () => {
        mostrarClave(campoClave.type === "password");
    });

    async function guardarCambio(boton, ruta, metodo, datos, cerrar, mensaje) {
        if (guardando) return;
        guardando = true;
        boton.disabled = true;
        try {
            await solicitar(ruta, metodo, datos);
            cerrar();
            mostrarToast(mensaje);
            await cargar();
        } catch (error) {
            mostrarToast(error.message, true);
        } finally {
            boton.disabled = false;
            guardando = false;
        }
    }

    formEmpleado.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (guardando || !validarFormulario()) return;
        const datos = {
            cedula: inputCedula.value.trim(), nombre: inputNombre.value.trim(),
            apellido: inputApellido.value.trim(), telefono: inputTelefono.value.trim(),
            correo: inputCorreo.value.trim(), rol: inputRol.value
        };
        if (!credenciales.disabled) {
            if (!formEmpleado.reportValidity()) return;
            datos.usuario = document.getElementById("usuarioEmpleado").value.trim();
            datos.clave = document.getElementById("claveEmpleado").value;
        }
        guardarCambio(document.getElementById("btnGuardar"), cedulaEditando ? "/" + cedulaEditando : "",
            cedulaEditando ? "PUT" : "POST", datos, cerrarModal,
            cedulaEditando ? "Empleado actualizado correctamente" : "Empleado registrado correctamente");
    });

    const confirmar = document.getElementById("btnConfirmarEstado");
    let estadoDestino;
    function abrirConfirmacion(cedula) {
        const emp = empleados.find((e) => e.cedula === cedula);
        if (guardando || !emp) return;
        cedulaCambioEstado = cedula;
        estadoDestino = emp.estado === "Activo" ? "Inactivo" : "Activo";
        const accion = estadoDestino === "Inactivo" ? "Inactivar" : "Activar";
        confirmar.textContent = accion;
        textoConfirmacion.textContent = "¿Quieres " + accion.toLowerCase() + " a " + emp.nombre + " " + emp.apellido + "?";
        modalConfirmacion.classList.add("activo");
    }

    function cerrarConfirmacion() {
        modalConfirmacion.classList.remove("activo");
        cedulaCambioEstado = null;
    }

    confirmar.addEventListener("click", () => {
        if (!cedulaCambioEstado) return;
        guardarCambio(confirmar, "/" + cedulaCambioEstado + "/estado", "PUT", { estado: estadoDestino },
            cerrarConfirmacion, estadoDestino === "Inactivo" ? "Empleado inactivado" : "Empleado activado");
    });

    // 11. BÚSQUEDA EN TIEMPO REAL

    function filtrar() {
        const termino = inputBusqueda.value.toLowerCase().trim();
        const filtrados = empleados.filter((e) => {
            return (
                e.cedula.includes(termino) ||
                e.nombre.toLowerCase().includes(termino) ||
                e.apellido.toLowerCase().includes(termino) ||
                e.rol.toLowerCase().includes(termino)
            );
        });
        renderizarTabla(filtrados);
    }
    inputBusqueda.addEventListener("input", filtrar);

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
    document.getElementById("btnCancelar").addEventListener("click", () => { if (!guardando) cerrarModal(); });
    document.getElementById("btnCancelarConfirmacion").addEventListener("click", () => { if (!guardando) cerrarConfirmacion(); });

    // Cerrar modal al hacer clic fuera del contenido
    modalEmpleado.addEventListener("click", (e) => {
        if (!guardando && e.target === modalEmpleado) cerrarModal();
    });

    modalConfirmacion.addEventListener("click", (e) => {
        if (!guardando && e.target === modalConfirmacion) cerrarConfirmacion();
    });

    // 14. INICIALIZACIÓN

    cargar();
});