document.addEventListener("DOMContentLoaded", () => {
    const formularioLogin = document.getElementById("loginForm");

    if (formularioLogin) {
        inicializarLogin(formularioLogin);
        inicializarMostrarPassword();
        return;
    }

    const sistema = document.getElementById("dashboard");
    if (!sistema || !protegerSistema()) return;

    inicializarNavegacionSistema();
    inicializarCRUDClientes();
    inicializarCRUDVehiculos();
    inicializarCerrarSesion();
    mostrarNombreUsuario();
});


/* =========================================================
   INICIO DE SESIÓN DE DEMOSTRACIÓN.
========================================================= */

function inicializarLogin(formulario) {
    const campoUsuario = document.getElementById("username");
    const campoPassword = document.getElementById("password");
    const recordarUsuario = document.getElementById("recordarUsuario");
    const mensajeLogin = document.getElementById("mensajeLogin");
    const usuarioGuardado = localStorage.getItem("usuarioRecordadoServiAuto");

    if (usuarioGuardado && campoUsuario && recordarUsuario) {
        campoUsuario.value = usuarioGuardado;
        recordarUsuario.checked = true;
    }

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const username = campoUsuario.value.trim();
        const password = campoPassword.value;

        if (!username || !password) {
            mostrarMensajeLogin(mensajeLogin, "Debes ingresar usuario y contraseña.", "error");
            return;
        }

        // Credenciales de demostración; no usar esta validación en producción.
        if (username.toLowerCase() !== "admin" || password !== "1234") {
            mostrarMensajeLogin(mensajeLogin, "❌ Usuario o contraseña incorrectos.", "error");
            campoPassword.focus();
            return;
        }

        try {
            if (recordarUsuario?.checked) {
                localStorage.setItem("usuarioRecordadoServiAuto", username);
            } else {
                localStorage.removeItem("usuarioRecordadoServiAuto");
            }

            localStorage.setItem("sesionServiAuto", JSON.stringify({ username }));
        } catch (error) {
            console.error("No se pudo guardar la sesión:", error);
            mostrarMensajeLogin(mensajeLogin, "No se pudo iniciar la sesión en este navegador.", "error");
            return;
        }

        mostrarMensajeLogin(mensajeLogin, "✅ Inicio de sesión correcto. Abriendo el sistema...", "exito");
        window.setTimeout(() => {
            window.location.href = "sistema.html";
        }, 500);
    });
}


function mostrarMensajeLogin(elemento, texto, tipo) {
    if (!elemento) return;

    elemento.textContent = texto;
    elemento.className = `mensaje-login ${tipo}`;
}


function inicializarMostrarPassword() {
    const boton = document.getElementById("togglePassword");
    const password = document.getElementById("password");

    if (!boton || !password) return;

    boton.textContent = "👁️";
    boton.addEventListener("click", () => {
        const mostrar = password.type === "password";
        password.type = mostrar ? "text" : "password";
        boton.textContent = mostrar ? "🙈" : "👁️";
        boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
        boton.setAttribute("aria-pressed", String(mostrar));
    });
}


/* =========================================================
   SESIÓN Y USUARIO
========================================================= */

function leerSesion() {
    const datos = localStorage.getItem("sesionServiAuto");
    if (!datos) return null;

    try {
        const sesion = JSON.parse(datos);
        return sesion && typeof sesion.username === "string" ? sesion : null;
    } catch (error) {
        console.error("La sesión guardada no tiene un formato válido:", error);
        localStorage.removeItem("sesionServiAuto");
        return null;
    }
}


function protegerSistema() {
    let sesion;

    try {
        sesion = leerSesion();
    } catch (error) {
        console.error("No se pudo leer la sesión:", error);
        window.location.replace("Login.html");
        return false;
    }

    if (!sesion) {
        window.location.replace("Login.html");
        return false;
    }

    return true;
}


function mostrarNombreUsuario() {
    const sesion = leerSesion();
    const nombre = document.getElementById("nombreUsuario");

    if (sesion && nombre) {
        nombre.textContent = sesion.username;
    }
}


function inicializarCerrarSesion() {
    const enlace = document.getElementById("cerrar-sesion");
    if (!enlace) return;

    enlace.addEventListener("click", (evento) => {
        evento.preventDefault();

        if (!window.confirm("¿Deseas cerrar sesión?")) return;

        try {
            localStorage.removeItem("sesionServiAuto");
        } catch (error) {
            console.error("No se pudo cerrar la sesión:", error);
            mostrarEstado("⚠️ No se pudo cerrar la sesión. Inténtalo de nuevo.");
            return;
        }

        window.location.href = "Login.html";
    });
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function inicializarNavegacionSistema() {
    const secciones = ["dashboard", "clientes", "vehiculo"];
    const enlaces = [...document.querySelectorAll(".menu-sistema a")];
    const titulo = document.querySelector(".topbar-sistema h1");
    const subtitulo = document.querySelector(".subtitulo-sistema");
    const titulos = {
        dashboard: ["Inicio", "Panel principal"],
        clientes: ["Clientes", "Registro y consulta de clientes"],
        vehiculo: ["Vehículos", "Registro y consulta de vehículos"]
    };

    function navegarA(id) {
        secciones.forEach((seccionId) => {
            document.getElementById(seccionId).hidden = seccionId !== id;
        });

        enlaces.forEach((enlace) => {
            const activo = enlace.hash === `#${id}`;
            enlace.classList.toggle("activo", activo);
            if (activo) enlace.setAttribute("aria-current", "page");
            else enlace.removeAttribute("aria-current");
        });

        titulo.textContent = titulos[id][0];
        subtitulo.textContent = titulos[id][1];
    }

    document.querySelectorAll(".menu-sistema a, [data-ir-a]").forEach((control) => {
        control.addEventListener("click", (evento) => {
            const id = control.dataset.irA || control.hash.slice(1);
            if (!titulos[id]) return;
            evento.preventDefault();
            navegarA(id);
        });
    });
}


function mostrarEstado(texto) {
    const estado = document.getElementById("estado-sistema");
    if (!estado) return;

    estado.textContent = texto;
    window.setTimeout(() => {
        estado.textContent = "";
    }, 4000);
}


/* =========================================================
   ALMACENAMIENTO Y VALIDACIÓN
========================================================= */

function leerRegistros(clave, entidad) {
    const datos = localStorage.getItem(clave);
    if (!datos) return [];

    try {
        const registros = JSON.parse(datos);
        if (!Array.isArray(registros)) {
            throw new TypeError(`Los datos de ${entidad} deben ser una lista.`);
        }
        return registros;
    } catch (error) {
        console.error(`No se pudieron cargar los ${entidad}:`, error);
        mostrarEstado(`⚠️ No se pudieron cargar los ${entidad}. Revisa los datos guardados.`);
        return [];
    }
}


function guardarRegistros(clave, registros, entidad) {
    try {
        localStorage.setItem(clave, JSON.stringify(registros));
        return true;
    } catch (error) {
        console.error(`No se pudieron guardar los ${entidad}:`, error);
        mostrarEstado(`❌ No se pudieron guardar los ${entidad}. Revisa el espacio disponible.`);
        return false;
    }
}


function conectarValidacion(formulario, campos, validar) {
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        let primerInvalido = null;

        campos.forEach((campo) => {
            const error = document.getElementById(`error-${campo.id}`);
            const contenedor = campo.closest(".campo-formulario");
            const textoError = validar(campo);

            contenedor.classList.toggle("invalido", Boolean(textoError));
            error.textContent = textoError || "";

            if (textoError && !primerInvalido) primerInvalido = campo;
        });

        if (primerInvalido) {
            primerInvalido.focus();
            mostrarEstado("⚠️ Revisa los campos marcados antes de guardar.");
            return;
        }

        formulario.dispatchEvent(new CustomEvent("formulario-valido"));
    });

    campos.forEach((campo) => {
        const limpiarError = () => {
            campo.closest(".campo-formulario").classList.remove("invalido");
            document.getElementById(`error-${campo.id}`).textContent = "";
        };

        campo.addEventListener("input", limpiarError);
        campo.addEventListener("change", limpiarError);
    });
}


/* =========================================================
   CRUD DE CLIENTES
========================================================= */

function inicializarCRUDClientes() {
    let clientes = leerRegistros("clientesServiAuto", "clientes");
    const modal = document.getElementById("modal-cliente");
    const formulario = document.getElementById("formulario-cliente");
    const idsCampos = [
        "nombres-cliente",
        "apellidos-cliente",
        "tipo-identificacion-cliente",
        "numero-identificacion-cliente",
        "telefono-cliente",
        "direccion-cliente"
    ];
    const campos = idsCampos.map((id) => document.getElementById(id));
    const tabla = document.getElementById("lista-clientes");
    const buscador = document.getElementById("buscar-cliente");
    const idActual = document.getElementById("id-cliente");
    let modoEdicion = false;

    function mostrarClientes(filtro = "") {
        const consulta = filtro.toLowerCase().trim();
        const resultados = clientes.filter((cliente) =>
            [
                cliente.nombres,
                cliente.apellidos,
                cliente.tipoIdentificacion,
                cliente.numeroIdentificacion,
                cliente.telefono
            ].some((dato) => String(dato || "").toLowerCase().includes(consulta))
        );

        tabla.replaceChildren();

        if (!resultados.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 8;
            celda.textContent = clientes.length
                ? "🔎 No se encontraron clientes."
                : "👥 Todavía no hay clientes registrados.";
        }

        resultados.forEach((cliente) => {
            const fila = tabla.insertRow();
            [
                cliente.id,
                cliente.nombres,
                cliente.apellidos,
                cliente.tipoIdentificacion,
                cliente.numeroIdentificacion,
                cliente.telefono,
                cliente.direccion
            ].forEach((dato) => {
                fila.insertCell().textContent = dato || "";
            });

            const acciones = fila.insertCell();
            acciones.append(
                crearAccion("✏️", "Editar cliente", "editar-cliente", cliente.id),
                crearAccion("🗑️", "Eliminar cliente", "eliminar-cliente", cliente.id),
                crearAccion("📋", "Ver vehículos del cliente", "ver-vehiculos-cliente", cliente.id)
            );
        });

        document.getElementById("cantidad-clientes").textContent =
            `${resultados.length} ${resultados.length === 1 ? "cliente" : "clientes"}`;
        document.getElementById("total-clientes").textContent = clientes.length;
    }

    function abrirCliente(cliente = null) {
        formulario.reset();
        modoEdicion = Boolean(cliente);
        idActual.value = cliente?.id || generarId(clientes);
        document.getElementById("titulo-modal-cliente").textContent =
            cliente ? "Editar cliente" : "Registrar cliente";
        document.getElementById("descripcion-modal-cliente").textContent =
            cliente ? "Modifica la información del cliente." : "Ingresa la información del nuevo cliente.";
        document.getElementById("guardar-cliente").textContent =
            cliente ? "💾 Guardar cambios" : "💾 Guardar cliente";

        if (cliente) {
            campos.forEach((campo) => {
                campo.value = cliente[campo.dataset.prop] || "";
            });
        }

        modal.showModal();
        campos[0].focus();
    }

    conectarValidacion(formulario, campos, (campo) => {
        const valor = campo.value.trim();

        if (!valor) return "Este campo es obligatorio.";
        if (campo.id === "numero-identificacion-cliente" && valor.length > 20) {
            return "Admite máximo 20 caracteres.";
        }
        if (campo.id === "telefono-cliente" && !/^\d{7,10}$/.test(valor)) {
            return "Ingresa un teléfono de 7 a 10 dígitos.";
        }
        if (["nombres-cliente", "apellidos-cliente"].includes(campo.id) && valor.length > 40) {
            return "Admite máximo 40 caracteres.";
        }
        if (campo.id === "direccion-cliente" && valor.length > 80) {
            return "Admite máximo 80 caracteres.";
        }

        if (campo.id === "numero-identificacion-cliente") {
            const tipo = document.getElementById("tipo-identificacion-cliente").value;
            const duplicado = clientes.some((cliente) =>
                cliente.id !== idActual.value &&
                cliente.tipoIdentificacion === tipo &&
                String(cliente.numeroIdentificacion).toLowerCase() === valor.toLowerCase()
            );

            if (duplicado) return "Ese tipo y número de identificación ya están registrados.";
        }

        return "";
    });

    formulario.addEventListener("formulario-valido", () => {
        const registro = Object.fromEntries(campos.map((campo) => [
            campo.dataset.prop,
            campo.value.trim()
        ]));
        const posicion = clientes.findIndex((cliente) => cliente.id === idActual.value);
        const nuevosClientes = [...clientes];

        if (modoEdicion && posicion !== -1) {
            nuevosClientes[posicion] = { ...nuevosClientes[posicion], ...registro };
        } else {
            nuevosClientes.push({ id: idActual.value, ...registro });
        }

        if (!guardarRegistros("clientesServiAuto", nuevosClientes, "clientes")) return;

        clientes = nuevosClientes;
        modal.close();
        mostrarClientes(buscador.value);
        window.dispatchEvent(new Event("serviauto:clientes-actualizados"));
        mostrarEstado(modoEdicion ? "✅ Cliente actualizado correctamente." : "✅ Cliente registrado correctamente.");
    });

    document.querySelector(".btn-nuevo-cliente").addEventListener("click", () => abrirCliente());
    document.querySelectorAll(".cerrar-modal-cliente, .btn-cancelar-cliente").forEach((boton) => {
        boton.addEventListener("click", () => modal.close());
    });
    buscador.addEventListener("input", () => mostrarClientes(buscador.value));

    tabla.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const cliente = clientes.find((item) => item.id === boton.dataset.id);
        if (!cliente) {
            mostrarEstado("⚠️ No se encontró el cliente seleccionado.");
            return;
        }

        if (boton.dataset.accion === "editar-cliente") {
            abrirCliente(cliente);
            return;
        }

        if (boton.dataset.accion === "ver-vehiculos-cliente") {
            window.dispatchEvent(new CustomEvent("serviauto:ver-vehiculos", {
                detail: { propietarioId: cliente.id }
            }));
            return;
        }

        if (boton.dataset.accion === "eliminar-cliente" &&
            window.confirm(`¿Eliminar al cliente ${cliente.nombres} ${cliente.apellidos}? Esta acción no se puede deshacer.`)) {
            const nuevosClientes = clientes.filter((item) => item.id !== cliente.id);
            if (!guardarRegistros("clientesServiAuto", nuevosClientes, "clientes")) return;

            clientes = nuevosClientes;
            mostrarClientes(buscador.value);
            window.dispatchEvent(new Event("serviauto:clientes-actualizados"));
            mostrarEstado("🗑️ Cliente eliminado correctamente.");
        }
    });

    mostrarClientes();
}


/* =========================================================
   CRUD DE VEHÍCULOS
========================================================= */

function inicializarCRUDVehiculos() {
    let vehiculos = leerRegistros("vehiculosServiAuto", "vehículos");
    const modal = document.getElementById("modal-vehiculo");
    const formulario = document.getElementById("formulario-vehiculo");
    const idsCampos = [
        "vehiculo-placa",
        "vehiculo-modelo",
        "vehiculo-color",
        "vehiculo-propietario",
        "vehiculo-fecha-ingreso",
        "vehiculo-hora-ingreso"
    ];
    const campos = idsCampos.map((id) => document.getElementById(id));
    const tabla = document.getElementById("tabla-vehiculos-body");
    const buscador = document.getElementById("buscar-vehiculo");
    const idActual = document.getElementById("vehiculo-id");
    const propietario = document.getElementById("vehiculo-propietario");
    let clientes = leerRegistros("clientesServiAuto", "clientes");

    function mostrarVehiculos(filtro = "", propietarioId = null) {
        const consulta = filtro.toLowerCase().trim();
        const resultados = vehiculos.filter((vehiculo) => {
            if (propietarioId && String(vehiculo.propietarioId) !== String(propietarioId)) {
                return false;
            }

            const dueno = clientes.find((cliente) => cliente.id === String(vehiculo.propietarioId));
            const nombreDueno = dueno ? `${dueno.nombres} ${dueno.apellidos}` : "";
            return [
                vehiculo.placa,
                vehiculo.modelo,
                vehiculo.color,
                nombreDueno,
                vehiculo.fechaIngreso,
                vehiculo.horaIngreso
            ].some((dato) => String(dato || "").toLowerCase().includes(consulta));
        });

        tabla.replaceChildren();

        if (!resultados.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 8;
            celda.textContent = vehiculos.length
                ? "🔎 No se encontraron vehículos."
                : "🚗 Todavía no hay vehículos registrados.";
        }

        resultados.forEach((vehiculo) => {
            const fila = tabla.insertRow();
            const dueno = clientes.find((cliente) => cliente.id === String(vehiculo.propietarioId));
            const nombreDueno = dueno
                ? `${dueno.nombres} ${dueno.apellidos}`
                : "Cliente no disponible";

            [
                vehiculo.id,
                vehiculo.placa,
                vehiculo.modelo,
                vehiculo.color,
                nombreDueno,
                vehiculo.fechaIngreso,
                vehiculo.horaIngreso
            ].forEach((dato) => {
                fila.insertCell().textContent = dato || "";
            });

            const acciones = fila.insertCell();
            acciones.append(
                crearAccion("✏️", "Editar vehículo", "editar-vehiculo", vehiculo.id),
                crearAccion("🗑️", "Eliminar vehículo", "eliminar-vehiculo", vehiculo.id)
            );
        });

        document.getElementById("cantidad-vehiculos").textContent =
            `${resultados.length} ${resultados.length === 1 ? "vehículo" : "vehículos"}`;
        document.getElementById("total-vehiculos").textContent = vehiculos.length;
    }

    function abrirVehiculo(vehiculo = null) {
        clientes = leerRegistros("clientesServiAuto", "clientes");
        if (clientes.length === 0) {
            mostrarEstado("⚠️ Registra primero un cliente para asociar el vehículo.");
            return;
        }

        formulario.reset();
        idActual.value = vehiculo?.id || "";
        propietario.replaceChildren(new Option("Seleccionar propietario", ""));
        clientes.forEach((cliente) => {
            const etiqueta = `${cliente.nombres} ${cliente.apellidos} (${cliente.tipoIdentificacion}: ${cliente.numeroIdentificacion})`;
            propietario.add(new Option(etiqueta, cliente.id));
        });

        document.getElementById("titulo-modal-vehiculo").textContent =
            vehiculo ? "Editar vehículo" : "Registrar vehículo";

        if (vehiculo) {
            campos.forEach((campo) => {
                campo.value = vehiculo[campo.dataset.prop] || "";
            });
        }

        modal.showModal();
        campos[0].focus();
    }

    conectarValidacion(formulario, campos, (campo) => {
        const valor = campo.value.trim();
        if (!valor) return "Este campo es obligatorio.";

        if (campo.id === "vehiculo-placa") {
            if (!/^[A-Za-z0-9-]{5,10}$/.test(valor)) {
                return "La placa debe tener entre 5 y 10 letras, números o guiones.";
            }
            if (vehiculos.some((item) =>
                item.placa.toLowerCase() === valor.toLowerCase() && item.id !== idActual.value
            )) {
                return "La placa ya está registrada.";
            }
        }

        if (campo.id === "vehiculo-propietario" &&
            !clientes.some((cliente) => cliente.id === valor)) {
            return "Selecciona un propietario registrado.";
        }

        return "";
    });

    formulario.addEventListener("formulario-valido", () => {
        const registro = Object.fromEntries(campos.map((campo) => [
            campo.dataset.prop,
            campo.value.trim()
        ]));
        registro.placa = registro.placa.toUpperCase();

        const posicion = vehiculos.findIndex((vehiculo) => vehiculo.id === idActual.value);
        const nuevosVehiculos = [...vehiculos];

        if (idActual.value && posicion !== -1) {
            nuevosVehiculos[posicion] = { ...nuevosVehiculos[posicion], ...registro };
        } else {
            nuevosVehiculos.push({ id: generarId(vehiculos), ...registro });
        }

        if (!guardarRegistros("vehiculosServiAuto", nuevosVehiculos, "vehículos")) return;

        vehiculos = nuevosVehiculos;
        modal.close();
        mostrarVehiculos(buscador.value);
        mostrarEstado(idActual.value ? "✅ Vehículo actualizado correctamente." : "✅ Vehículo registrado correctamente.");
    });

    document.getElementById("btn-registrar-vehiculo").addEventListener("click", () => abrirVehiculo());
    document.getElementById("cerrar-modal-vehiculo").addEventListener("click", () => modal.close());
    document.getElementById("btn-cancelar-vehiculo").addEventListener("click", () => modal.close());
    buscador.addEventListener("input", () => mostrarVehiculos(buscador.value));

    tabla.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const vehiculo = vehiculos.find((item) => item.id === boton.dataset.id);
        if (!vehiculo) {
            mostrarEstado("⚠️ No se encontró el vehículo seleccionado.");
            return;
        }

        if (boton.dataset.accion === "editar-vehiculo") {
            abrirVehiculo(vehiculo);
            return;
        }

        if (boton.dataset.accion === "eliminar-vehiculo" &&
            window.confirm(`¿Eliminar el vehículo ${vehiculo.placa}? Esta acción no se puede deshacer.`)) {
            const nuevosVehiculos = vehiculos.filter((item) => item.id !== vehiculo.id);
            if (!guardarRegistros("vehiculosServiAuto", nuevosVehiculos, "vehículos")) return;

            vehiculos = nuevosVehiculos;
            mostrarVehiculos(buscador.value);
            mostrarEstado("🗑️ Vehículo eliminado correctamente.");
        }
    });

    window.addEventListener("serviauto:clientes-actualizados", () => {
        clientes = leerRegistros("clientesServiAuto", "clientes");
        mostrarVehiculos(buscador.value);
    });

    window.addEventListener("serviauto:ver-vehiculos", (evento) => {
        buscador.value = "";
        document.querySelector('.menu-sistema a[href="#vehiculo"]').click();
        mostrarVehiculos("", evento.detail.propietarioId);
    });

    mostrarVehiculos();
}


function generarId(registros) {
    const mayor = registros.reduce((maximo, registro) => {
        const numero = Number.parseInt(registro.id, 10);
        return Number.isFinite(numero) ? Math.max(maximo, numero) : maximo;
    }, 0);

    return String(mayor + 1).padStart(3, "0");
}


function crearAccion(icono, etiqueta, accion, id) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.dataset.accion = accion;
    boton.dataset.id = id;
    boton.textContent = icono;
    boton.title = etiqueta;
    boton.setAttribute("aria-label", etiqueta);
    return boton;
}
