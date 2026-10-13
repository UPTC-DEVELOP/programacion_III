document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "lja_vehiculos_db"; // Clave única para vehículos

    const tablaContainer = document.getElementById("tabla-container");
    const listaVehiculos = document.getElementById("lista-vehiculos");
    const emptyState = document.getElementById("empty-state");

    const inputBusqueda = document.getElementById("input-busqueda");

    // Modal
    const modalVehiculo = document.getElementById("modal-vehiculo");
    const formVehiculo = document.getElementById("form-vehiculo");

    const btnAbrirModal = document.getElementById("btn-abrir-modal");
    const btnCerrarModal = document.getElementById("btn-cerrar-modal");
    const btnCancelar = document.getElementById("btn-cancelar");

    const modalTitulo = document.getElementById("modal-titulo");
    const btnGuardar = document.getElementById("btn-guardar");

    // Campos
    const inputId = document.getElementById("vehiculo-id");
    const inputPlaca = document.getElementById("vehiculo-placa");
    const inputMarca = document.getElementById("vehiculo-marca");
    const inputModelo = document.getElementById("vehiculo-modelo");
    const inputAnio = document.getElementById("vehiculo-anio");
    const selectPropietario = document.getElementById("vehiculo-propietario");

    // Simulador rápido de clientes para el select (En un proyecto real, se leerían del STORAGE_KEY de clientes)
    const clientesRegistrados = [
        "SAK DESIGNS", 
        "Carlos Mendoza", 
        "Sergio Camacho"
    ];

    // ==========================================
    // FUNCIONES DE ALMACENAMIENTO (LocalStorage)
    // ==========================================
    function obtenerVehiculos() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error("Error al obtener los vehículos:", error);
            return [];
        }
    }

    function guardarVehiculos(vehiculos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vehiculos));
    }

    // ==========================================
    // FUNCIONES DEL MODAL
    // ==========================================
    function cargarClientesEnSelect() {
        // Limpiamos primero por si acaso, dejando solo la opción por defecto
        selectPropietario.innerHTML = '<option value="">Seleccione un cliente registrado...</option>';
        clientesRegistrados.forEach(nombre => {
            const option = document.createElement("option");
            option.value = nombre;
            option.textContent = nombre;
            selectPropietario.appendChild(option);
        });
    }

    function abrirModal() {
        modalVehiculo.classList.remove("d-none");
        cargarClientesEnSelect();
    }

    function cerrarModal() {
        modalVehiculo.classList.add("d-none");
        formVehiculo.reset();
        inputId.value = "";
        modalTitulo.textContent = "Registrar nuevo vehículo";
        btnGuardar.textContent = "Registrar vehículo";
    }

    // Eventos del Modal
    btnAbrirModal.addEventListener("click", () => {
        formVehiculo.reset();
        inputId.value = "";
        modalTitulo.textContent = "Registrar nuevo vehículo";
        btnGuardar.textContent = "Registrar vehículo";
        abrirModal();
    });

    btnCerrarModal.addEventListener("click", cerrarModal);
    btnCancelar.addEventListener("click", cerrarModal);

    // ==========================================
    // RENDERIZAR TABLA Y BÚSQUEDA
    // ==========================================
    function renderizarVehiculos(filtro = "") {
        const vehiculos = obtenerVehiculos();
        const textoBusqueda = filtro.toLowerCase().trim();

        // Limpiar tabla
        listaVehiculos.innerHTML = "";

        // Filtrar
        const vehiculosFiltrados = vehiculos.filter(vehiculo => {
            const placa = String(vehiculo.placa || "").toLowerCase();
            const marca = String(vehiculo.marca || "").toLowerCase();
            const propietario = String(vehiculo.propietario || "").toLowerCase();
            
            return (
                placa.includes(textoBusqueda) ||
                marca.includes(textoBusqueda) ||
                propietario.includes(textoBusqueda)
            );
        });

        if (vehiculosFiltrados.length === 0) {
            tablaContainer.classList.add("d-none");
            emptyState.classList.remove("d-none");

            if (vehiculos.length > 0 && textoBusqueda !== "") {
                emptyState.innerHTML = `
                    <p>No se encontraron vehículos.</p>
                    <p>Intenta realizar otra búsqueda.</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <p>Aún no hay vehículos registrados.</p>
                    <p>Haz clic en <strong>+ Nuevo vehículo</strong></p>
                `;
            }
            return;
        }

        // Mostrar tabla
        tablaContainer.classList.remove("d-none");
        emptyState.classList.add("d-none");

        // Crear filas
        vehiculosFiltrados.forEach(vehiculo => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${vehiculo.placa || ""}</strong></td>
                <td>${vehiculo.marca || ""}</td>
                <td>${vehiculo.modelo || ""}</td>
                <td>${vehiculo.anio || ""}</td>
                <td>${vehiculo.propietario || ""}</td>
                <td class="acciones">
                    <button type="button" class="btn-editar btn btn-sm btn-outline-light me-2" data-id="${vehiculo.id}">Editar</button>
                    <button type="button" class="btn-eliminar btn btn-sm btn-outline-danger" data-id="${vehiculo.id}">Eliminar</button>
                </td>
            `;
            listaVehiculos.appendChild(tr);
        });
    }

    // ==========================================
    // GUARDAR (CREAR / EDITAR)
    // ==========================================
    formVehiculo.addEventListener("submit", function(event) {
        event.preventDefault();

        const placa = inputPlaca.value.trim().toUpperCase();
        const marca = inputMarca.value.trim();
        const modelo = inputModelo.value.trim();
        const anio = inputAnio.value.trim();
        const propietario = selectPropietario.value;

        // Validaciones básicas
        if (!placa || !marca || !modelo || !anio || !propietario) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const vehiculos = obtenerVehiculos();

        // Validar Placa Duplicada (Si es nuevo o si cambió la placa en edición)
        const placaDuplicada = vehiculos.some(v => String(v.placa) === String(placa) && String(v.id) !== String(inputId.value));
        if (placaDuplicada) {
            alert("Ya existe un vehículo registrado con esta placa.");
            return;
        }

        if (inputId.value) {
            // EDITAR
            const indice = vehiculos.findIndex(v => String(v.id) === String(inputId.value));
            if (indice !== -1) {
                vehiculos[indice].placa = placa;
                vehiculos[indice].marca = marca;
                vehiculos[indice].modelo = modelo;
                vehiculos[indice].anio = anio;
                vehiculos[indice].propietario = propietario;

                guardarVehiculos(vehiculos);
                cerrarModal();
                renderizarVehiculos(inputBusqueda.value);
                alert("Vehículo actualizado correctamente.");
            }
            return;
        }

        // CREAR NUEVO
        const nuevoVehiculo = {
            id: Date.now(),
            placa: placa,
            marca: marca,
            modelo: modelo,
            anio: anio,
            propietario: propietario,
            fechaRegistro: new Date().toISOString()
        };

        vehiculos.push(nuevoVehiculo);
        guardarVehiculos(vehiculos);
        cerrarModal();
        renderizarVehiculos(inputBusqueda.value);
        alert("Vehículo registrado correctamente.");
    });

    // ==========================================
    // DELEGACIÓN DE EVENTOS (EDITAR / ELIMINAR)
    // ==========================================
    // Se usa este método para detectar clics en botones que se crearon dinámicamente
    listaVehiculos.addEventListener("click", function(event) {
        const boton = event.target;
        if (boton.classList.contains("btn-editar")) {
            const id = boton.dataset.id;
            editarVehiculo(id);
        }
        if (boton.classList.contains("btn-eliminar")) {
            const id = boton.dataset.id;
            eliminarVehiculo(id);
        }
    });

    function editarVehiculo(id) {
        const vehiculos = obtenerVehiculos();
        const vehiculo = vehiculos.find(v => String(v.id) === String(id));

        if (!vehiculo) {
            alert("No se encontró el vehículo.");
            return;
        }

        inputId.value = vehiculo.id;
        inputPlaca.value = vehiculo.placa || "";
        inputMarca.value = vehiculo.marca || "";
        inputModelo.value = vehiculo.modelo || "";
        inputAnio.value = vehiculo.anio || "";
        
        cargarClientesEnSelect(); // Asegura que las opciones estén cargadas antes de seleccionar
        selectPropietario.value = vehiculo.propietario || "";

        modalTitulo.textContent = "Editar vehículo";
        btnGuardar.textContent = "Guardar cambios";
        abrirModal();
    }

    function eliminarVehiculo(id) {
        const vehiculos = obtenerVehiculos();
        const vehiculo = vehiculos.find(v => String(v.id) === String(id));

        if (!vehiculo) return;

        const confirmar = confirm(`¿Deseas eliminar el vehículo con placa ${vehiculo.placa}?`);
        if (!confirmar) return;

        const nuevosVehiculos = vehiculos.filter(v => String(v.id) !== String(id));
        guardarVehiculos(nuevosVehiculos);
        renderizarVehiculos(inputBusqueda.value);
    }

    // Búsqueda en tiempo real
    inputBusqueda.addEventListener("input", function() {
        renderizarVehiculos(this.value);
    });

    // Cargar la tabla al iniciar la página
    renderizarVehiculos();

});