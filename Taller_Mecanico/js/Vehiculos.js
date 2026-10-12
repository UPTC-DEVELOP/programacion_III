document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 0. CONFIGURACIÓN DE BASES DE DATOS
    // ==========================================
    // Definimos cómo se llamará nuestra tabla en el navegador
    
    const DB_VEHICULOS = "lja_vehiculos_db";
    // Usamos EXACTAMENTE el mismo nombre que usó tu compañero para leer sus datos
    const DB_CLIENTES = "lja_clientes_db"; 

    // Instanciamos el modal de Bootstrap en JS para poder abrirlo/cerrarlo por código
    const modalVehiculoBS = new bootstrap.Modal(document.getElementById('modalVehiculo'));
    const formVehiculo = document.getElementById("form-vehiculo");

    // ==========================================
    // 1. SOLUCIÓN A LA VULNERABILIDAD (XSS)
    // ==========================================
    // ¿Por qué hacemos esto? Si un usuario malintencionado escribe "<script>alert('hack')</script>" 
    // en un campo, el navegador lo ejecutará al dibujarlo en la tabla. 
    // Esta función cambia los "<" y ">" por texto inofensivo ("&lt;" y "&gt;") para neutralizar el código.
    function escapeHTML(str) {
        if (!str) return "";
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    // ==========================================
    // 2. LECTURA Y ESCRITURA EN LOCALSTORAGE
    // ==========================================
    function obtenerVehiculos() {
        const data = localStorage.getItem(DB_VEHICULOS);
        return data ? JSON.parse(data) : [];
    }

    function guardarVehiculos(vehiculos) {
        localStorage.setItem(DB_VEHICULOS, JSON.stringify(vehiculos));
    }

    // ==========================================
    // 3. INTEGRACIÓN CON EL CRUD DE CLIENTES
  // ==========================================
      // Esta función lee los clientes creados por tu compañero y los pone como opciones en nuestro <select>
    function cargarClientesEnSelect() {
        const clientes = JSON.parse(localStorage.getItem(DB_CLIENTES)) || [];
        const selectClientes = document.getElementById("vehiculo-cliente");
        
        // Limpiamos el select dejando solo la  opción por defecto
        selectClientes.innerHTML = '<option value="" disabled selected>Seleccione un cliente...</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement("option");
            option.value = cliente.id; // Guardaremos el ID del cliente como llave foránea
            // Usamos escapeHTML para mostrar el nombre de forma segura
            option.textContent = `${escapeHTML(cliente.nombres)} ${escapeHTML(cliente.apellidos)} - C.C: ${escapeHTML(cliente.cedula)}`;
            selectClientes.appendChild(option);
        });
    }

    // Función de ayuda para la tabla: busca el nombre del dueño basado en el ID guardado
    function obtenerNombreCliente(clienteId) {
        const clientes = JSON.parse(localStorage.getItem(DB_CLIENTES)) || [];
        const cliente = clientes.find(c => String(c.id) === String(clienteId));
        return cliente ? `${escapeHTML(cliente.nombres)} ${escapeHTML(cliente.apellidos)}` : "<span class='text-danger'>Desconocido</span>";
    }

    // ==========================================
    // 4. LEER (READ): RENDERIZAR LA TABLA
    // ==========================================
    function renderizarVehiculos(filtro = "") {
        const vehiculos = obtenerVehiculos();
        const textoBusqueda = filtro.toLowerCase().trim();
        const listaVehiculos = document.getElementById("lista-vehiculos");
        const emptyState = document.getElementById("empty-state-vehiculos");
        const tablaContainer = document.getElementById("tabla-vehiculos-container");
        
        listaVehiculos.innerHTML = ""; // Limpiamos la tabla antes de dibujar

        // Filtrar si el usuario escribió en el buscador
        const vehiculosFiltrados = vehiculos.filter(v => {
            return String(v.placa).toLowerCase().includes(textoBusqueda) || 
                   String(v.marca).toLowerCase().includes(textoBusqueda);
        });

        // Mostrar u ocultar mensaje de "No hay datos"
        if (vehiculosFiltrados.length === 0) {
            tablaContainer.classList.add("d-none");
            emptyState.classList.remove("d-none");
            return;
        }

        tablaContainer.classList.remove("d-none");
        emptyState.classList.add("d-none");

        // Dibujar cada fila aplicando SIEMPRE escapeHTML a las variables
        vehiculosFiltrados.forEach(v => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                  <span class="badge bg-light text-primary border font-monospace px-2 py-1">${escapeHTML(v.placa)}</span>
                </td>
                <td class="fw-medium">${escapeHTML(v.marca)} ${escapeHTML(v.modelo)}</td>
                <td class="text-muted">${escapeHTML(v.anio)}</td>
                <td class="text-muted">${obtenerNombreCliente(v.clienteId)}</td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-light border btn-editar" data-id="${v.id}">Editar</button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${v.id}">Borrar</button>
                </td>
            `;
            listaVehiculos.appendChild(tr);
        });
    }

    // ==========================================
    // 5. CREAR / ACTUALIZAR (CREATE & UPDATE)
    // ==========================================
    formVehiculo.addEventListener("submit", (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // Obtenemos los valores de los inputs
        const placa = document.getElementById("vehiculo-placa").value.trim().toUpperCase();
        const anio = document.getElementById("vehiculo-anio").value.trim();
        const marca = document.getElementById("vehiculo-marca").value.trim();
        const modelo = document.getElementById("vehiculo-modelo").value.trim();
        const clienteId = document.getElementById("vehiculo-cliente").value;
        const idActual = document.getElementById("vehiculo-id").value; // ID oculto

        let vehiculos = obtenerVehiculos();

        if (idActual) {
            // SI HAY UN ID: Estamos en modo EDICIÓN (Update)
            const index = vehiculos.findIndex(v => String(v.id) === String(idActual));
            if (index !== -1) {
                // Actualizamos el objeto existente
                vehiculos[index] = { ...vehiculos[index], placa, anio, marca, modelo, clienteId };
            }
        } else {
            // SI NO HAY ID: Estamos en modo CREACIÓN (Create)
            // Validación extra: Evitar placas repetidas
            if (vehiculos.some(v => v.placa === placa)) {
                alert("Esta placa ya existe.");
                return;
            }
            // Creamos un nuevo vehículo y le damos un ID único con Date.now()
            vehiculos.push({ id: Date.now(), placa, anio, marca, modelo, clienteId });
        }

        // Guardamos, cerramos el modal y repintamos la tabla
        guardarVehiculos(vehiculos);
        modalVehiculoBS.hide(); 
        renderizarVehiculos(document.getElementById("input-busqueda-vehiculos").value);
    });

    // ==========================================
    // 6. EVENTOS DE TABLA Y BUSCADOR (DELEGATION)
    // ==========================================
    // Al usar event delegation, escuchamos clics en toda la tabla y verificamos qué botón se tocó
    document.getElementById("lista-vehiculos").addEventListener("click", (e) => {
        const btn = e.target;
        const id = btn.getAttribute("data-id");

        // Acción: EDITAR
        if (btn.classList.contains("btn-editar")) {
            const vehiculo = obtenerVehiculos().find(v => String(v.id) === String(id));
            if (vehiculo) {
                // Llenamos el formulario con los datos guardados
                document.getElementById("vehiculo-id").value = vehiculo.id;
                document.getElementById("vehiculo-placa").value = vehiculo.placa;
                document.getElementById("vehiculo-anio").value = vehiculo.anio;
                document.getElementById("vehiculo-marca").value = vehiculo.marca;
                document.getElementById("vehiculo-modelo").value = vehiculo.modelo;
                
                // Actualizamos los clientes por si acaso y seleccionamos el dueño
                cargarClientesEnSelect();
                document.getElementById("vehiculo-cliente").value = vehiculo.clienteId;

                document.getElementById("modalVehiculoLabel").textContent = "Editar Vehículo";
                modalVehiculoBS.show(); // Abrimos el modal
            }
        }

        // Acción: ELIMINAR (Delete)
        if (btn.classList.contains("btn-eliminar")) {
            if (confirm("¿Seguro que deseas eliminar este vehículo?")) {
                // Filtramos el arreglo dejando por fuera el ID que queremos borrar
                const nuevosVehiculos = obtenerVehiculos().filter(v => String(v.id) !== String(id));
                guardarVehiculos(nuevosVehiculos);
                renderizarVehiculos(document.getElementById("input-busqueda-vehiculos").value);
            }
        }
    });

    // Acción: BUSCADOR EN TIEMPO REAL
    document.getElementById("input-busqueda-vehiculos").addEventListener("input", (e) => {
        renderizarVehiculos(e.target.value);
    });

    // ==========================================
    // 7. ARRANQUE INICIAL
    // ==========================================
    document.getElementById("btn-nuevo-vehiculo").addEventListener("click", () => {
        formVehiculo.reset(); // Limpia campos
        document.getElementById("vehiculo-id").value = ""; // Borra el ID oculto para modo Creación
        document.getElementById("modalVehiculoLabel").textContent = "Registrar Vehículo";
        cargarClientesEnSelect(); // Refresca lista de clientes
    });

    // Al cargar la página, pintamos la tabla
    renderizarVehiculos();
});