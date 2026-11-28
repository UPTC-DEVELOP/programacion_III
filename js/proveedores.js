/* CRUD DE PROVEEDORES */

document.addEventListener("DOMContentLoaded", () => {

    let proveedores = [];
    async function cargar() {
        try {
            proveedores = await catalogoApi("proveedores");
            inputBusqueda.dispatchEvent(new Event("input"));
        } catch (e) { mostrarToast(e.message, true); }
    }

    // 2. REFERENCIAS AL DOM

    const cuerpoTabla = document.getElementById("cuerpoTabla");
    const contadorRegistros = document.getElementById("contadorRegistros");
    const inputBusqueda = document.getElementById("inputBusqueda");

    const modalProveedor = document.getElementById("modalProveedor");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalSubtitulo = document.getElementById("modalSubtitulo");
    const formProveedor = document.getElementById("formProveedor");

    const inputCodigo = document.getElementById("codigo");
    const inputRazonSocial = document.getElementById("razonSocial");
    const inputNit = document.getElementById("nit");
    const inputDireccion = document.getElementById("direccion");
    const inputTelefono = document.getElementById("telefono");
    const inputCorreo = document.getElementById("correo");

    const modalConfirmacion = document.getElementById("modalConfirmacion");
    const textoConfirmacion = document.getElementById("textoConfirmacion");
    const toast = document.getElementById("toast");
    const toastMensaje = document.getElementById("toastMensaje");

    let codigoEditando = null; // null = creando, string = editando
    let codigoAEliminar = null;

    // 3. RENDERIZAR TABLA

    function renderizarTabla(lista = proveedores) {
        cuerpoTabla.innerHTML = "";

        if (lista.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="8" class="sin-resultados">
                        No se encontraron proveedores con ese criterio.
                    </td>
                </tr>`;
            contadorRegistros.textContent = `0 de ${proveedores.length} registros`;
            return;
        }

        lista.forEach((prov) => {
            const fila = document.createElement("tr");
            const claseBadge = prov.estado === "Activo" ? "badge-activo" : "badge-inactivo";

            fila.innerHTML = `
                <td><span class="badge-estado ${claseBadge}">${prov.estado}</span></td>
                <td>
                    <div class="acciones-celda">
                        <button class="btn-accion btn-editar" data-codigo="${prov.codigo}">Editar</button>
                        <button class="btn-accion btn-eliminar" data-codigo="${prov.codigo}">
                            ${prov.estado === "Activo" ? "Inactivar" : "Activar"}
                        </button>
                    </div>
                </td>
            `;
            for (const campo of ["correo","telefono","direccion","nit","razonSocial","codigo"]) {
                const celda = fila.insertCell(0);
                celda.textContent = prov[campo];
            }
            cuerpoTabla.appendChild(fila);
        });

        contadorRegistros.textContent = `${lista.length} de ${proveedores.length} registros`;

        document.querySelectorAll(".btn-editar").forEach((btn) => {
            btn.addEventListener("click", () => abrirModalEdicion(btn.dataset.codigo));
        });

        document.querySelectorAll(".btn-eliminar").forEach((btn) => {
            btn.addEventListener("click", () => abrirConfirmacion(btn.dataset.codigo));
        });
    }

    // 4. ABRIR MODAL PARA CREAR

    function abrirModalCrear() {
        codigoEditando = null;
        formProveedor.reset();
        modalTitulo.textContent = "NUEVO PROVEEDOR";
        modalSubtitulo.textContent = "Registra los datos del nuevo proveedor";
        inputCodigo.disabled = false;

        limpiarErrores();
        modalProveedor.classList.add("activo");
    }

    // 5. ABRIR MODAL PARA EDITAR

    function abrirModalEdicion(codigo) {
        const prov = proveedores.find((p) => p.codigo === codigo);
        if (!prov) return;

        codigoEditando = codigo;
        modalTitulo.textContent = "EDITAR PROVEEDOR";
        modalSubtitulo.textContent = "Modifica los datos del proveedor";

        inputCodigo.value = prov.codigo;
        inputCodigo.disabled = true;
        inputRazonSocial.value = prov.razonSocial;
        inputNit.value = prov.nit;
        inputDireccion.value = prov.direccion;
        inputTelefono.value = prov.telefono;
        inputCorreo.value = prov.correo;

        limpiarErrores();
        modalProveedor.classList.add("activo");
    }

    // 6. CERRAR MODAL

    function cerrarModal() {
        modalProveedor.classList.remove("activo");
        formProveedor.reset();
        limpiarErrores();
        codigoEditando = null;
    }

    // 7. VALIDACIONES

    const regexCodigo = /^[A-Za-z0-9]{3,10}$/;
    const regexNit = /^[0-9]{5,12}(-[0-9])?$/;
    const regexRazonSocial = /^.{3,100}$/;
    const regexDireccion = /^.{5,100}$/;
    const regexTelefono = /^[0-9]{7,10}$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function mostrarError(idError) {
        document.getElementById(idError).classList.add("visible");
    }

    function ocultarError(idError) {
        document.getElementById(idError).classList.remove("visible");
    }

    function limpiarErrores() {
        document.querySelectorAll(".campo-error").forEach((e) => e.classList.remove("visible"));
        document.querySelectorAll(".campo-grupo input").forEach((e) => {
            e.classList.remove("valido", "invalido");
        });
    }

    function validarFormulario() {
        let valido = true;
        limpiarErrores();

        // Código
        const codigo = inputCodigo.value.trim();
        if (!regexCodigo.test(codigo)) {
            mostrarError("errorCodigo");
            inputCodigo.classList.add("invalido");
            valido = false;
        } else if (!codigoEditando && proveedores.some((p) => p.codigo === codigo)) {
            document.getElementById("errorCodigo").textContent = "Este código ya está registrado";
            mostrarError("errorCodigo");
            inputCodigo.classList.add("invalido");
            valido = false;
        } else {
            inputCodigo.classList.add("valido");
        }

        // Razón social
        const razonSocial = inputRazonSocial.value.trim();
        if (!regexRazonSocial.test(razonSocial)) {
            mostrarError("errorRazonSocial");
            inputRazonSocial.classList.add("invalido");
            valido = false;
        } else {
            inputRazonSocial.classList.add("valido");
        }

        // NIT
        const nit = inputNit.value.trim();
        if (!regexNit.test(nit)) {
            mostrarError("errorNit");
            inputNit.classList.add("invalido");
            valido = false;
        } else if (!codigoEditando && proveedores.some((p) => p.nit === nit)) {
            document.getElementById("errorNit").textContent = "Este NIT ya está registrado";
            mostrarError("errorNit");
            inputNit.classList.add("invalido");
            valido = false;
        } else {
            inputNit.classList.add("valido");
        }

        // Dirección
        const direccion = inputDireccion.value.trim();
        if (!regexDireccion.test(direccion)) {
            mostrarError("errorDireccion");
            inputDireccion.classList.add("invalido");
            valido = false;
        } else {
            inputDireccion.classList.add("valido");
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

        // Correo
        const correo = inputCorreo.value.trim();
        if (!regexCorreo.test(correo)) {
            mostrarError("errorCorreo");
            inputCorreo.classList.add("invalido");
            valido = false;
        } else if (!codigoEditando && proveedores.some((p) => p.correo === correo)) {
            document.getElementById("errorCorreo").textContent = "Este correo ya está registrado";
            mostrarError("errorCorreo");
            inputCorreo.classList.add("invalido");
            valido = false;
        } else {
            inputCorreo.classList.add("valido");
        }

        return valido;
    }

    // 8. VALIDACIÓN EN TIEMPO REAL

    inputCodigo.addEventListener("input", function () {
        if (this.value === "") {
            this.classList.remove("valido", "invalido");
            ocultarError("errorCodigo");
        } else if (regexCodigo.test(this.value)) {
            this.classList.remove("invalido");
            this.classList.add("valido");
            ocultarError("errorCodigo");
        } else {
            this.classList.remove("valido");
            this.classList.add("invalido");
        }
    });

    inputNit.addEventListener("input", function () {
        if (this.value === "") {
            this.classList.remove("valido", "invalido");
            ocultarError("errorNit");
        } else if (regexNit.test(this.value)) {
            this.classList.remove("invalido");
            this.classList.add("valido");
            ocultarError("errorNit");
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

    formProveedor.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!validarFormulario()) return;

        const codigo = inputCodigo.value.trim();
        const razonSocial = inputRazonSocial.value.trim();
        const nit = inputNit.value.trim();
        const direccion = inputDireccion.value.trim();
        const telefono = inputTelefono.value.trim();
        const correo = inputCorreo.value.trim();

        const actual = proveedores.find(p => p.codigo === codigoEditando);
        const boton = document.getElementById("btnGuardar");
        boton.disabled = true;
        try {
            await catalogoApi(actual ? "proveedores/" + actual.id : "proveedores", actual ? "PUT" : "POST",
                { codigo, razonSocial, nit, direccion, telefono, correo });
            cerrarModal();
            mostrarToast("Proveedor guardado");
            await cargar();
        } catch (e) { mostrarToast(e.message, true); }
        finally { boton.disabled = false; }
    });

    // 10. CONFIRMACIÓN DE ACTIVAR / INACTIVAR

    function abrirConfirmacion(codigo) {
        const prov = proveedores.find((p) => p.codigo === codigo);
        if (!prov) return;

        codigoAEliminar = codigo;
        const accion = prov.estado === "Activo" ? "inactivar" : "activar";

        textoConfirmacion.textContent = `¿Deseas ${accion} al proveedor ${prov.razonSocial}?`;
        modalConfirmacion.classList.add("activo");
    }

    function cerrarConfirmacion() {
        modalConfirmacion.classList.remove("activo");
        codigoAEliminar = null;
    }

    document.getElementById("btnConfirmarEliminar").addEventListener("click", async () => {
        const prov = proveedores.find(p => p.codigo === codigoAEliminar);
        if (!prov) return;
        const boton = document.getElementById("btnConfirmarEliminar");
        boton.disabled = true;
        try {
            await catalogoApi("proveedores/" + prov.id + "/estado", "PUT",
                { estado: prov.estado === "Activo" ? "Inactivo" : "Activo" });
            cerrarConfirmacion();
            await cargar();
        } catch (e) { mostrarToast(e.message, true); }
        finally { boton.disabled = false; }
    });

    // 11. BÚSQUEDA EN TIEMPO REAL

    inputBusqueda.addEventListener("input", function () {
        const termino = this.value.toLowerCase().trim();
        const filtrados = proveedores.filter((p) => {
            return (
                p.codigo.toLowerCase().includes(termino) ||
                p.razonSocial.toLowerCase().includes(termino) ||
                p.nit.toLowerCase().includes(termino)
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

    document.getElementById("btnNuevoProveedor").addEventListener("click", abrirModalCrear);
    document.getElementById("btnCancelar").addEventListener("click", cerrarModal);
    document.getElementById("btnCancelarConfirmacion").addEventListener("click", cerrarConfirmacion);

    // Cerrar modal al hacer clic fuera del contenido
    modalProveedor.addEventListener("click", (e) => {
        if (e.target === modalProveedor) cerrarModal();
    });

    modalConfirmacion.addEventListener("click", (e) => {
        if (e.target === modalConfirmacion) cerrarConfirmacion();
    });

    // 14. INICIALIZACIÓN

    cargar();
});
