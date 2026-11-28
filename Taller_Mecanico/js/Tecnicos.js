document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost/programacion%203/Taller_Mecanico/panther/backend_panther/panther/rest/";
    const API_TOKEN_KEY = "pantherApiToken";

    const tablaContainer = document.getElementById("tabla-container");
    const listaTecnicos = document.getElementById("lista-tecnicos");
    const emptyState = document.getElementById("empty-state");
    const catalogosMessage = document.getElementById("catalogos-message");
    const inputBusqueda = document.getElementById("input-busqueda");
    const modal = document.getElementById("modal-tecnico");
    const form = document.getElementById("form-tecnico");
    const btnAbrirModal = document.getElementById("btn-abrir-modal");
    const btnCerrarModal = document.getElementById("btn-cerrar-modal");
    const btnCancelar = document.getElementById("btn-cancelar");
    const modalTitulo = document.getElementById("modal-titulo");
    const btnGuardar = document.getElementById("btn-guardar");

    const inputId = document.getElementById("tecnico-id");
    const inputCedula = document.getElementById("tecnico-cedula");
    const inputNombres = document.getElementById("tecnico-nombres");
    const inputApellidos = document.getElementById("tecnico-apellidos");
    const inputTelefono = document.getElementById("tecnico-telefono");
    const inputCargo = document.getElementById("tecnico-cargo");
    const inputEspecialidad = document.getElementById("tecnico-especialidad");
    const inputFechaIngreso = document.getElementById("tecnico-fecha-ingreso");
    const inputEstado = document.getElementById("tecnico-estado");

    let tecnicos = [];

    async function solicitarApi(recurso, opciones = {}) {
        const token = sessionStorage.getItem(API_TOKEN_KEY);
        if (!token) {
            throw new Error("No hay sesión iniciada. Inicia sesión para administrar técnicos.");
        }

        const headers = Object.assign({}, opciones.headers || {}, { Authorization: token });
        if (opciones.body) {
            headers["Content-Type"] = "application/json";
        }

        const respuesta = await fetch(API_BASE_URL + recurso, Object.assign({}, opciones, { headers }));
        const texto = await respuesta.text();
        let resultado = {};

        if (texto) {
            try {
                resultado = JSON.parse(texto);
            } catch (error) {
                throw new Error(`La API respondió con un formato inesperado (HTTP ${respuesta.status}).`);
            }
        }

        if (!respuesta.ok) {
            const mensaje = resultado.data || resultado.message || `Error HTTP ${respuesta.status}`;
            throw new Error(String(mensaje));
        }

        return resultado;
    }

    function cargarOpciones(select, filas, idCampo, primeraOpcion) {
        select.innerHTML = "";
        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = primeraOpcion;
        select.appendChild(opcionInicial);

        filas.forEach(fila => {
            const opcion = document.createElement("option");
            opcion.value = fila[idCampo];
            opcion.textContent = fila.nombre;
            select.appendChild(opcion);
        });
    }

    async function cargarCatalogos() {
        const respuestas = await Promise.all([
            solicitarApi("cargos/"),
            solicitarApi("especialidades/")
        ]);
        const cargos = respuestas[0].data;
        const especialidades = respuestas[1].data;

        if (!Array.isArray(cargos) || !Array.isArray(especialidades)) {
            throw new Error("La API devolvió catálogos con formato inválido.");
        }

        cargarOpciones(inputCargo, cargos, "id_cargo", "Selecciona un cargo");
        cargarOpciones(inputEspecialidad, especialidades, "id_especialidad", "Sin especialidad");

        if (cargos.length === 0) {
            catalogosMessage.textContent = "Agrega al menos un cargo antes de registrar técnicos.";
            catalogosMessage.classList.remove("d-none");
        } else {
            catalogosMessage.classList.add("d-none");
        }
    }

    async function cargarTecnicos() {
        const respuesta = await solicitarApi("tecnicos/");
        if (!Array.isArray(respuesta.data)) {
            throw new Error("La API devolvió la lista de técnicos con formato inválido.");
        }

        tecnicos = respuesta.data;
        renderizarTecnicos(inputBusqueda.value);
    }

    function crearCelda(valor) {
        const celda = document.createElement("td");
        celda.textContent = valor == null ? "" : String(valor);
        return celda;
    }

    function renderizarTecnicos(filtro = "") {
        const consulta = filtro.toLowerCase().trim();
        const resultados = tecnicos.filter(tecnico => [
            tecnico.cedula,
            tecnico.nombres,
            tecnico.apellidos,
            tecnico.telefono,
            tecnico.cargo,
            tecnico.especialidad,
            tecnico.fecha_ingreso,
            tecnico.estado
        ].some(valor => String(valor || "").toLowerCase().includes(consulta)));

        listaTecnicos.innerHTML = "";
        if (resultados.length === 0) {
            tablaContainer.classList.add("d-none");
            emptyState.classList.remove("d-none");
            emptyState.textContent = consulta
                ? "No se encontraron técnicos con esa búsqueda."
                : "Aún no hay técnicos registrados. Haz clic en “+ Nuevo técnico” para agregar uno.";
            return;
        }

        emptyState.classList.add("d-none");
        tablaContainer.classList.remove("d-none");

        resultados.forEach(tecnico => {
            const fila = document.createElement("tr");
            fila.appendChild(crearCelda(tecnico.cedula));
            fila.appendChild(crearCelda(`${tecnico.nombres} ${tecnico.apellidos}`.trim()));
            fila.appendChild(crearCelda(tecnico.telefono));
            fila.appendChild(crearCelda(tecnico.cargo));
            fila.appendChild(crearCelda(tecnico.especialidad || "—"));
            fila.appendChild(crearCelda(tecnico.fecha_ingreso));
            fila.appendChild(crearCelda(tecnico.estado));

            const acciones = document.createElement("td");
            acciones.className = "acciones";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn-editar";
            botonEditar.dataset.accion = "editar";
            botonEditar.dataset.id = tecnico.id_tecnico;
            botonEditar.textContent = "Editar";

            const botonEstado = document.createElement("button");
            botonEstado.type = "button";
            botonEstado.className = tecnico.estado === "Activo" ? "btn-eliminar" : "btn-editar";
            botonEstado.dataset.accion = "estado";
            botonEstado.dataset.id = tecnico.id_tecnico;
            botonEstado.textContent = tecnico.estado === "Activo" ? "Desactivar" : "Activar";

            acciones.appendChild(botonEditar);
            acciones.appendChild(botonEstado);
            fila.appendChild(acciones);
            listaTecnicos.appendChild(fila);
        });
    }

    function abrirModal() {
        modal.classList.remove("d-none");
        inputCedula.focus();
    }

    function cerrarModal() {
        modal.classList.add("d-none");
        form.reset();
        inputId.value = "";
        inputEstado.value = "Activo";
        modalTitulo.textContent = "Registrar técnico";
        btnGuardar.textContent = "Registrar técnico";
    }

    function datosDelTecnico(tecnico, estado = tecnico.estado) {
        return {
            cedula: tecnico.cedula,
            nombres: tecnico.nombres,
            apellidos: tecnico.apellidos,
            telefono: tecnico.telefono || null,
            id_cargo: Number(tecnico.id_cargo),
            id_especialidad: tecnico.id_especialidad ? Number(tecnico.id_especialidad) : null,
            fecha_ingreso: tecnico.fecha_ingreso,
            estado: estado
        };
    }

    btnAbrirModal.addEventListener("click", () => {
        form.reset();
        inputId.value = "";
        inputEstado.value = "Activo";
        modalTitulo.textContent = "Registrar técnico";
        btnGuardar.textContent = "Registrar técnico";
        abrirModal();
    });

    btnCerrarModal.addEventListener("click", cerrarModal);
    btnCancelar.addEventListener("click", cerrarModal);
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            cerrarModal();
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity()) {
            return;
        }

        const tecnico = {
            cedula: inputCedula.value.trim(),
            nombres: inputNombres.value.trim(),
            apellidos: inputApellidos.value.trim(),
            telefono: inputTelefono.value.trim() || null,
            id_cargo: Number(inputCargo.value),
            id_especialidad: inputEspecialidad.value ? Number(inputEspecialidad.value) : null,
            fecha_ingreso: inputFechaIngreso.value,
            estado: inputEstado.value
        };
        const editando = Boolean(inputId.value);
        btnGuardar.disabled = true;

        try {
            const recurso = editando
                ? `tecnicos/${encodeURIComponent(inputId.value)}`
                : "tecnicos/";
            await solicitarApi(recurso, {
                method: editando ? "PUT" : "POST",
                body: JSON.stringify(tecnico)
            });

            cerrarModal();
            await cargarTecnicos();
            alert(editando ? "Técnico actualizado correctamente." : "Técnico registrado correctamente.");
        } catch (error) {
            alert(`No se pudo guardar el técnico: ${error.message}`);
        } finally {
            btnGuardar.disabled = false;
        }
    });

    listaTecnicos.addEventListener("click", async event => {
        const boton = event.target.closest("button");
        if (!boton) {
            return;
        }

        const tecnico = tecnicos.find(item => String(item.id_tecnico) === boton.dataset.id);
        if (!tecnico) {
            alert("No se encontró el técnico seleccionado.");
            return;
        }

        if (boton.dataset.accion === "editar") {
            inputId.value = tecnico.id_tecnico;
            inputCedula.value = tecnico.cedula;
            inputNombres.value = tecnico.nombres;
            inputApellidos.value = tecnico.apellidos;
            inputTelefono.value = tecnico.telefono || "";
            inputCargo.value = String(tecnico.id_cargo);
            inputEspecialidad.value = tecnico.id_especialidad ? String(tecnico.id_especialidad) : "";
            inputFechaIngreso.value = tecnico.fecha_ingreso;
            inputEstado.value = tecnico.estado;
            modalTitulo.textContent = "Editar técnico";
            btnGuardar.textContent = "Guardar cambios";
            abrirModal();
            return;
        }

        const nuevoEstado = tecnico.estado === "Activo" ? "Inactivo" : "Activo";
        if (!confirm(`¿Deseas cambiar el estado de ${tecnico.nombres} ${tecnico.apellidos} a ${nuevoEstado}?`)) {
            return;
        }

        try {
            await solicitarApi(`tecnicos/${encodeURIComponent(tecnico.id_tecnico)}`, {
                method: "PUT",
                body: JSON.stringify(datosDelTecnico(tecnico, nuevoEstado))
            });
            await cargarTecnicos();
        } catch (error) {
            alert(`No se pudo cambiar el estado del técnico: ${error.message}`);
        }
    });

    inputBusqueda.addEventListener("input", () => renderizarTecnicos(inputBusqueda.value));
    document.getElementById("btn-buscar").addEventListener("click", () => {
        renderizarTecnicos(inputBusqueda.value);
    });

    Promise.all([cargarCatalogos(), cargarTecnicos()])
        .catch(error => {
            tablaContainer.classList.add("d-none");
            emptyState.classList.remove("d-none");
            emptyState.textContent = `No se pudieron cargar los datos: ${error.message}`;
        });
});
