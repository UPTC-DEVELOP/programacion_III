/* Controlador principal de autenticación y módulos del panel administrativo. */
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
    inicializarCRUDServicios();
    inicializarCRUDEmpleados();
    inicializarCRUDRepuestos();
    inicializarFacturacion();
    inicializarConfiguracion();
    inicializarCerrarSesion();
    mostrarNombreUsuario();
});

function protegerSistema() {
    const sesion = obtenerSesion();
    const token = obtenerTokenValido();

    if (!sesion || (sesion.proveedor !== "demo" && !token)) {
        limpiarSesion();
        window.location.href = "Login.html";
        return false;
    }

    return true;
}

function mostrarNombreUsuario() {
    const sesion = obtenerSesion();
    const elemento = document.getElementById("nombreUsuario");
    if (elemento && sesion?.username) {
        elemento.textContent = sesion.username;
    }
}

function inicializarCerrarSesion() {
    const boton = document.getElementById("cerrar-sesion");
    if (!boton) return;

    boton.addEventListener("click", () => {
        limpiarSesion();
        localStorage.removeItem("sesionServiAuto");
        localStorage.removeItem("pantherToken");
        localStorage.removeItem("pantherTokenWithHeader");
        localStorage.removeItem("clarisaToken");
        localStorage.removeItem("clarisaTokenWithHeader");
        localStorage.removeItem("tokenWithPrefix");
        window.location.href = "Login.html";
    });
}
function mostrarMensajeLogin(elemento, texto, tipo) {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.className = `mensaje-login ${tipo}`;
}

function inicializarMostrarPassword() {
    const boton = document.getElementById("togglePassword");
    const campoPassword = document.getElementById("password");

    if (!boton || !campoPassword) return;

    boton.addEventListener("click", () => {
        const mostrar = campoPassword.type === "password";
        campoPassword.type = mostrar ? "text" : "password";
        boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
        boton.setAttribute("aria-pressed", String(mostrar));
    });
}


/* =========================================================
   GESTIÓN DE SESIÓN Y AUTENTICACIÓN.
========================================================= */
const STORAGE_SESION = "sesionPantherActiva";
function guardarSesion(sesion) {
    sessionStorage.setItem(STORAGE_SESION, JSON.stringify(sesion));
}

function obtenerSesion() {
    try {
        const raw = sessionStorage.getItem(STORAGE_SESION);
        return raw ? JSON.parse(raw) : null;
    } catch {
        limpiarSesion();
        return null;
    }
}

function limpiarSesion() {
    sessionStorage.removeItem(STORAGE_SESION);
}

function obtenerTokenValido() {
    const sesion = obtenerSesion();
    if (!sesion?.token) return null;
    if (sesion.expiraEn && Date.now() >= Number(sesion.expiraEn)) {
        limpiarSesion();
        return null;
    }
    return sesion.token;
}

function inicializarLogin(formulario) {
    const campoUsuario = document.getElementById("username");
    const campoPassword = document.getElementById("password");
    const recordarUsuario = document.getElementById("recordarUsuario");
    const mensajeLogin = document.getElementById("mensajeLogin");
    const usuarioGuardado = localStorage.getItem("usuarioRecordadoServiAuto");
    const botonIngresar = formulario.querySelector('[type="submit"]');

    if (usuarioGuardado && campoUsuario && recordarUsuario) {
        campoUsuario.value = usuarioGuardado;
        recordarUsuario.checked = true;
    }

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const username = campoUsuario.value.trim();
        const password = campoPassword.value;

        if (!username || !password) {
            mostrarMensajeLogin(mensajeLogin, "Debes ingresar usuario y contraseña.", "error");
            return;
        }

        if (botonIngresar) botonIngresar.disabled = true;
        mostrarMensajeLogin(mensajeLogin, "Validando credenciales...", "info");

        try {
            limpiarSesion();

            const autenticacion = await LoginAPI.autenticar(username, password);
            if (!autenticacion) {
                mostrarMensajeLogin(
                    mensajeLogin,
                    "❌ Usuario o contraseña incorrectos.",
                    "error"
                );
                campoPassword.focus();
                if (botonIngresar) botonIngresar.disabled = false;
                return;
            }

            const { username: nombreSesion, proveedor, tokenPanther, tokenClarisa, roles: rolUsuario } =
                autenticacion;
            const tokenPrincipal = tokenPanther || tokenClarisa || "";
            const expiraEn = Date.now() + (1000 * 60 * 60 * 8);

            guardarSesion({
                username: nombreSesion,
                roles: rolUsuario,
                proveedor,
                token: tokenPrincipal,
                tokens: {
                    panther: tokenPanther,
                    clarisa: tokenClarisa
                },
                expiraEn
            });

            if (recordarUsuario?.checked) {
                localStorage.setItem("usuarioRecordadoServiAuto", username);
            } else {
                localStorage.removeItem("usuarioRecordadoServiAuto");
            }

            mostrarMensajeLogin(
                mensajeLogin,
                "✅ Inicio de sesión correcto.",
                "exito"
            );

            setTimeout(() => {
                window.location.href = "sistema.html";
            }, 500);
        } catch (error) {
            console.error(error);
            mostrarMensajeLogin(
                mensajeLogin,
                "Error al autenticar.",
                "error"
            );
            if (botonIngresar) botonIngresar.disabled = false;
        }
    });
}
/* =========================================================
   NAVEGACIÓN
========================================================= */

function inicializarNavegacionSistema() {
    const secciones = ["dashboard", "clientes", "vehiculo", "servicios", "empleados", "repuestos", "facturas", "configuracion"];
    const enlaces = [...document.querySelectorAll(".menu-sistema a")];
    const titulo = document.querySelector(".topbar-sistema h1");
    const subtitulo = document.querySelector(".subtitulo-sistema");
    const titulos = {
        dashboard: ["Inicio", "Panel principal"],
        clientes: ["Clientes", "Registro y consulta de clientes"],
        vehiculo: ["Vehículos", "Registro y consulta de vehículos"],
        servicios: ["Servicios", "Órdenes de trabajo y facturación"],
        empleados: ["Empleados", "Registro, disponibilidad y consulta del personal"],
        repuestos: ["Repuestos", "Inventario, existencias y precios"],
        facturas: ["Facturas", "Generación y consulta de facturas"],
        configuracion: ["Configuración", "Administración de los parámetros del sistema"]
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
   CONFIGURACION DEL SISTEMA
========================================================= */

let configuracionFinanciera = null;

function leerConfiguracionServiAuto() {
    return configuracionFinanciera;
}

async function inicializarConfiguracion() {
    const formulario = document.getElementById("formulario-configuracion");
    if (!formulario) return;

    const utilidad = document.getElementById("config-utilidad");
    const iva = document.getElementById("config-iva");
    const manoObra = document.getElementById("config-mano-obra");

    const passwordActual = document.getElementById("config-password-actual");
    const password = document.getElementById("config-password");
    const confirmarPassword = document.getElementById("config-confirmar-password");
    const guardar = formulario.querySelector('[type="submit"]');

    const sesion = obtenerSesion() || {};
    const roles = Number(sesion.roles) || 0;
    const esAdmin = roles === 1;
    let configuracionActual = null;

    // 1. Obtener configuración directamente desde Panther
    try {
        const registros = await ConfiguracionAPI.listar();
        const lista = Array.isArray(registros) ? registros : [];

        configuracionActual = lista
            .filter((registro) => !registro.dateDelete)
            .sort((a, b) =>
                String(b.fecha_actualizacion || b.id || "").localeCompare(
                    String(a.fecha_actualizacion || a.id || "")
                )
            )[0] || null;

        if (configuracionActual) {
            configuracionFinanciera = {
                id: Number(configuracionActual.id),
                porcentajeUtilidad: Number(configuracionActual.porcentaje_utilidad),
                porcentajeIva: Number(configuracionActual.iva),
                valorManoObra: Number(configuracionActual.valor_mano_obra)
            };
        }
    } catch (error) {
        console.error("No se pudo cargar la configuración de Panther:", error);
        mostrarEstado(`❌ No se pudo cargar la configuración: ${error.message}`);
    }

    // 2. Cargar en los inputs los valores que devolvió Panther
    const valores = leerConfiguracionServiAuto();
    if (utilidad) {
        utilidad.value = valores?.porcentajeUtilidad ?? "";
        utilidad.disabled = !esAdmin;
    }
    if (iva) {
        iva.value = valores?.porcentajeIva ?? "";
        iva.disabled = !esAdmin;
    }
    if (manoObra) {
        manoObra.value = valores?.valorManoObra ?? "";
        manoObra.disabled = !esAdmin;
    }

    const avisoPermisos = document.getElementById("aviso-configuracion-permisos");
    if (!esAdmin && avisoPermisos) {
        avisoPermisos.textContent = "Solo un administrador puede modificar los parámetros financieros.";
    }

    // 3. Guardar cambios en Panther (POST / PUT configuraciones y PUT users/change-password)
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const porcentajeUtilidad = Number(utilidad?.value);
        const porcentajeIva = Number(iva?.value);
        const valorManoObra = Number(manoObra?.value);

        const claveActual = passwordActual?.value || "";
        const nuevaPassword = password?.value || "";
        const confirmacion = confirmarPassword?.value || "";

        if (
            esAdmin &&
            (!Number.isFinite(porcentajeUtilidad) || porcentajeUtilidad < 0 || porcentajeUtilidad > 100)
        ) {
            mostrarEstado("⚠️ La utilidad debe estar entre 0 y 100 %.");
            return;
        }

        if (esAdmin && (!Number.isFinite(porcentajeIva) || porcentajeIva <= 0)) {
            mostrarEstado("⚠️ El IVA debe ser mayor que cero.");
            return;
        }

        if (esAdmin && (!Number.isFinite(valorManoObra) || valorManoObra < 0)) {
            mostrarEstado("⚠️ El valor de mano de obra no puede ser negativo.");
            return;
        }

        if (nuevaPassword || confirmacion || claveActual) {
            if (
                !claveActual ||
                !nuevaPassword ||
                nuevaPassword.length < 8 ||
                !/[A-Z]/.test(nuevaPassword) ||
                !/[a-z]/.test(nuevaPassword) ||
                !/[0-9]/.test(nuevaPassword) ||
                !/[^A-Za-z0-9]/.test(nuevaPassword)
            ) {
                mostrarEstado(
                    "⚠️ Ingresa tu contraseña actual y una nueva contraseña segura (8 caracteres, mayúscula, minúscula, número y símbolo)."
                );
                return;
            }
            if (nuevaPassword !== confirmacion) {
                mostrarEstado("⚠️ Las contraseñas nuevas no coinciden.");
                return;
            }
        }

        if (guardar) guardar.disabled = true;

        try {
            if (esAdmin) {
                const payload = {
                    iva: porcentajeIva,
                    valor_mano_obra: valorManoObra,
                    porcentaje_utilidad: porcentajeUtilidad
                };

                const idRegistro = configuracionActual?.id || configuracionFinanciera?.id;
                const respuestaGuardado = await ConfiguracionAPI.guardar(idRegistro, payload);

                const nuevoId = Number(respuestaGuardado?.id || idRegistro) || null;
                if (nuevoId) {
                    configuracionActual = { ...(configuracionActual || {}), id: nuevoId, ...payload };
                }

                configuracionFinanciera = {
                    id: nuevoId,
                    porcentajeUtilidad,
                    porcentajeIva,
                    valorManoObra
                };
            }

            if (nuevaPassword) {
                await ConfiguracionAPI.cambiarPassword(claveActual, nuevaPassword);
            }

            formulario.reset();
            const valoresActualizados = leerConfiguracionServiAuto();
            if (utilidad) utilidad.value = valoresActualizados?.porcentajeUtilidad ?? "";
            if (iva) iva.value = valoresActualizados?.porcentajeIva ?? "";
            if (manoObra) manoObra.value = valoresActualizados?.valorManoObra ?? "";

            mostrarEstado("✅ Configuración guardada correctamente.");
        } catch (error) {
            console.error("No se pudo guardar la configuración:", error);
            mostrarEstado(`❌ No se pudo guardar: ${error.message}`);
        } finally {
            if (guardar) guardar.disabled = false;
        }
    });
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
   CRUD DE CLIENTES - API PANTHER
========================================================= */

async function inicializarCRUDClientes() {

    let clientes = [];

    const modal = document.getElementById("modal-cliente");
    const formulario = document.getElementById("formulario-cliente");

    const idsCampos = [
        "nombres-cliente",
        "apellidos-cliente",
        "tipo-identificacion-cliente",
        "numero-identificacion-cliente",
        "telefono-cliente",
        "direccion-cliente",
        "correo-cliente"
    ];

    const campos = idsCampos.map(id => document.getElementById(id));

    const tabla = document.getElementById("lista-clientes");
    const buscador = document.getElementById("buscar-cliente");
    const idActual = document.getElementById("id-cliente");

    let modoEdicion = false;

    /* =======================================
       CARGAR CLIENTES
    ======================================= */

    async function cargarClientes() {

        try {
            clientes = await ClientesAPI.listar();

            mostrarClientes(buscador.value);

        } catch (error) {
            console.error(error);

            mostrarEstado(
                "❌ No fue posible obtener la lista de los clientes."
            );
        }
    }

    /* =======================================
       TABLA
    ======================================= */

    function mostrarClientes(filtro = "") {

        const consulta = filtro.toLowerCase().trim();

        const resultados = clientes.filter(cliente =>
            [
                cliente.nombres,
                cliente.apellidos,
                cliente.tipoIdentificacion,
                cliente.numeroIdentificacion,
                cliente.telefono
            ].some(valor =>
                String(valor || "")
                    .toLowerCase()
                    .includes(consulta)
            )
        );

        tabla.replaceChildren();

        if (!resultados.length) {

            const fila = tabla.insertRow();

            const celda = fila.insertCell();

            celda.colSpan = 8;

            celda.textContent = clientes.length
                ? "🔎 No se encontraron clientes."
                : "👥 No hay clientes registrados.";

            return;
        }

        resultados.forEach(cliente => {

            const fila = tabla.insertRow();

            [
                cliente.id,
                cliente.nombres,
                cliente.apellidos,
                cliente.tipoIdentificacion,
                cliente.numeroIdentificacion,
                cliente.telefono,
                cliente.direccion
            ].forEach(dato => {

                fila.insertCell().textContent = dato || "";

            });

            const acciones = fila.insertCell();

            acciones.append(

                crearAccion(
                    "✏️",
                    "Editar cliente",
                    "editar-cliente",
                    cliente.id
                ),

                crearAccion(
                    "🗑️",
                    "Eliminar cliente",
                    "eliminar-cliente",
                    cliente.id
                )

            );

        });

        document.getElementById("cantidad-clientes").textContent =
            `${resultados.length} ${resultados.length === 1
                ? "cliente"
                : "clientes"
            }`;

        document.getElementById("total-clientes").textContent =
            clientes.length;
    }

    /* =======================================
       MODAL
    ======================================= */

    function abrirCliente(cliente = null) {

        formulario.reset();

        modoEdicion = !!cliente;

        idActual.value = cliente?.id || "";

        document.getElementById(
            "titulo-modal-cliente"
        ).textContent = cliente
                ? "Editar cliente"
                : "Registrar cliente";

        document.getElementById(
            "descripcion-modal-cliente"
        ).textContent = cliente
                ? "Modifica la información del cliente."
                : "Ingresa la información del nuevo cliente.";

        document.getElementById(
            "guardar-cliente"
        ).textContent = cliente
                ? "💾 Guardar cambios"
                : "💾 Guardar cliente";

        if (cliente) {

            campos.forEach(campo => {

                campo.value =
                    cliente[campo.dataset.prop] || "";

            });

        }

        modal.showModal();

        campos[0].focus();
    }

    /* =======================================
       VALIDACIÓN
    ======================================= */

    conectarValidacion(formulario, campos, campo => {

        const valor = campo.value.trim();

        if (!valor) {
            return "Este campo es obligatorio.";
        }

        if (
            campo.id ===
            "numero-identificacion-cliente" &&
            valor.length > 20
        ) {
            return "Máximo 20 caracteres.";
        }

        if (
            campo.id === "telefono-cliente" &&
            !/^\d{7,10}$/.test(valor)
        ) {
            return "Debe contener entre 7 y 10 dígitos.";
        }

        if (
            [
                "nombres-cliente",
                "apellidos-cliente"
            ].includes(campo.id) &&
            valor.length > 40
        ) {
            return "Máximo 40 caracteres.";
        }

        if (
            campo.id === "direccion-cliente" &&
            valor.length > 80
        ) {
            return "Máximo 80 caracteres.";
        }

        return "";
    });

    /* =======================================
       GUARDAR
    ======================================= */

    formulario.addEventListener(
        "formulario-valido",
        async () => {

            try {

                const registro =
                    Object.fromEntries(
                        campos.map(campo => [
                            campo.dataset.prop,
                            campo.value.trim()
                        ])
                    );

                if (modoEdicion) {

                    await ClientesAPI.actualizar(
                        idActual.value,
                        registro
                    );

                    mostrarEstado(
                        "✅ Cliente actualizado correctamente."
                    );

                } else {

                    await ClientesAPI.crear(
                        registro
                    );

                    mostrarEstado(
                        "✅ Cliente registrado correctamente."
                    );
                }

                modal.close();

                await cargarClientes();

                window.dispatchEvent(
                    new Event(
                        "serviauto:clientes-actualizados"
                    )
                );

            } catch (error) {

                console.error(error);

                mostrarEstado(
                    "❌ Error guardando cliente."
                );
            }
        }
    );

    /* =======================================
       EVENTOS
    ======================================= */

    document
        .querySelector(".btn-nuevo-cliente")
        ?.addEventListener(
            "click",
            () => abrirCliente()
        );

    document
        .querySelectorAll(
            ".cerrar-modal-cliente, .btn-cancelar-cliente"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => modal.close()
            );

        });

    buscador.addEventListener(
        "input",
        () => mostrarClientes(
            buscador.value
        )
    );

    tabla.addEventListener(
        "click",
        async (evento) => {

            const boton =
                evento.target.closest(
                    "button[data-accion]"
                );

            if (!boton) return;

            const cliente =
                clientes.find(
                    item =>
                        String(item.id) ===
                        String(boton.dataset.id)
                );

            if (!cliente) return;

            if (
                boton.dataset.accion ===
                "editar-cliente"
            ) {

                abrirCliente(cliente);

                return;
            }

            if (
                boton.dataset.accion ===
                "eliminar-cliente"
            ) {

                const confirmar =
                    confirm(
                        `¿Eliminar al cliente ${cliente.nombres} ${cliente.apellidos}?`
                    );

                if (!confirmar) return;

                try {

                    await ClientesAPI.eliminar(
                        cliente.id
                    );

                    await cargarClientes();

                    mostrarEstado(
                        "🗑️ Cliente eliminado correctamente."
                    );

                } catch (error) {

                    console.error(error);

                    mostrarEstado(
                        "❌ Error eliminando cliente."
                    );
                }
            }
        }
    );

    /* =======================================
       INICIO
    ======================================= */

    await cargarClientes();
}

/* =========================================================
   CRUD DE VEHÍCULOS
========================================================= */
let vehiculos = [];
let clientes = [];

async function inicializarCRUDVehiculos() {
    let vehiculos = [];
    let clientes = [];
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

    /* =======================================
         CARGAR VEHÍCULOS
      ======================================= */

    async function cargarDatosVehiculos() {
        try {
            const [listaVehiculos, listaClientes] = await Promise.all([
                VehiculosAPI.listar(),
                ClientesAPI.listar()
            ]);
            vehiculos = listaVehiculos;
            clientes = listaClientes.map((cliente) => ({
                ...cliente,
                id: String(cliente.id)
            }));
            mostrarVehiculos(buscador.value);
        } catch (error) {
            console.error("Error cargando vehículos:", error);
            mostrarEstado(`❌ Error cargando vehículos: ${error.message}`);
        }
    }

    /* =======================================
     TABLA
  ======================================= */

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


    /* =======================================
       MODAL
    ======================================= */


    async function abrirVehiculo(vehiculo = null) {
        try {
            const listaClientes = await ClientesAPI.listar();
            clientes = listaClientes.map((cliente) => ({
                ...cliente,
                id: String(cliente.id)
            }));
        } catch (error) {
            console.error("Error cargando clientes:", error);
            mostrarEstado(`❌ Error cargando clientes: ${error.message}`);
        }

        if (clientes.length === 0) {
            mostrarEstado("⚠️ Registra primero un cliente para asociar el vehículo.");
            return;
        }

        formulario.reset();
        idActual.value = vehiculo?.id || "";
        propietario.replaceChildren(new Option("Seleccionar propietario", ""));
        clientes.forEach((cliente) => {
            const etiqueta = `${cliente.nombres} ${cliente.apellidos} (${cliente.tipoIdentificacion}: ${cliente.numeroIdentificacion})`;
            propietario.add(new Option(etiqueta, String(cliente.id)));
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

    /* =======================================
          VALIDACIÓN
       ======================================= */

    conectarValidacion(formulario, campos, (campo) => {
        const valor = campo.value.trim();
        if (!valor) return "Este campo es obligatorio.";

        if (campo.id === "vehiculo-placa") {
            if (!/^[A-Za-z0-9-]{5,10}$/.test(valor)) {
                return "La placa debe tener entre 5 y 10 letras, números o guiones.";
            }
            if (vehiculos.some((item) =>
                item.placa.toLowerCase() === valor.toLowerCase() && String(item.id) !== String(idActual.value)
            )) {
                return "La placa ya está registrada.";
            }
        }

        if (campo.id === "vehiculo-propietario" &&
            !clientes.some((cliente) => String(cliente.id) === String(valor))) {
            return "Selecciona un propietario registrado.";
        }

        return "";
    });

    /* =======================================
      GUARDAR
   ======================================= */

    formulario.addEventListener("formulario-valido", async () => {
        const registro = Object.fromEntries(campos.map((campo) => [
            campo.dataset.prop,
            campo.value.trim()
        ]));
        registro.placa = registro.placa.toUpperCase();

        try {
            if (idActual.value) {
                await VehiculosAPI.actualizar(idActual.value, registro);
            } else {
                await VehiculosAPI.crear(registro);
            }

            modal.close();
            await cargarDatosVehiculos();
            window.dispatchEvent(new Event("serviauto:vehiculos-actualizados"));
            mostrarEstado(idActual.value ? "✅ Vehículo actualizado correctamente." : "✅ Vehículo registrado correctamente.");
        } catch (error) {
            console.error("Error guardando vehículo:", error);
            mostrarEstado(`❌ Error guardando vehículo: ${error.message}`);
        }
    });

    document.getElementById("btn-registrar-vehiculo").addEventListener("click", () => abrirVehiculo());
    document.getElementById("cerrar-modal-vehiculo").addEventListener("click", () => modal.close());
    document.getElementById("btn-cancelar-vehiculo").addEventListener("click", () => modal.close());
    buscador.addEventListener("input", () => mostrarVehiculos(buscador.value));

    /* =======================================
         EVENTOS
      ======================================= */

    tabla.addEventListener("click", async (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const vehiculo = vehiculos.find((item) => String(item.id) === String(boton.dataset.id));
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
            try {
                await VehiculosAPI.eliminar(vehiculo.id);
                await cargarDatosVehiculos();
                window.dispatchEvent(new Event("serviauto:vehiculos-actualizados"));
                mostrarEstado("🗑️ Vehículo eliminado correctamente.");
            } catch (error) {
                console.error("Error eliminando vehículo:", error);
                mostrarEstado(`❌ Error eliminando vehículo: ${error.message}`);
            }
        }
    });

    window.addEventListener("serviauto:clientes-actualizados", async () => {
        try {
            const listaClientes = await ClientesAPI.listar();
            clientes = listaClientes.map((cliente) => ({ ...cliente, id: String(cliente.id) }));
            mostrarVehiculos(buscador.value);
        } catch (error) {
            console.error(error);
        }
    });

    window.addEventListener("serviauto:ver-vehiculos", (evento) => {
        buscador.value = "";
        document.querySelector('.menu-sistema a[href="#vehiculo"]').click();
        mostrarVehiculos("", evento.detail.propietarioId);
    });

    await cargarDatosVehiculos();
}

/* =========================================================
   ÓRDENES DE SERVICIO
========================================================= */

async function inicializarCRUDServicios() {
    const estadosValidos = ["Pendiente", "En proceso", "Finalizado"];
    const prioridadesValidas = ["Baja", "Media", "Alta", "Urgente"];
    const modal = document.getElementById("modal-servicio");
    const formulario = document.getElementById("formulario-servicio");
    const tabla = document.getElementById("tabla-servicios-body");
    const buscador = document.getElementById("buscar-servicio");
    const selectorCliente = document.getElementById("servicio-cliente");
    const selectorVehiculo = document.getElementById("servicio-vehiculo");
    const selectorEmpleado = document.getElementById("servicio-empleado");
    const selectorRepuestos = document.getElementById("servicio-repuestos");
    const idActual = document.getElementById("servicio-id");
    const campos = [
        "servicio-cliente",
        "servicio-vehiculo",
        "servicio-empleado",
        "servicio-estado",
        "servicio-prioridad",
        "servicio-fecha-inicio",
        "servicio-fecha-fin",
        "servicio-horas",
        "servicio-mano-obra",
        "servicio-repuestos",
        "servicio-descripcion"
    ].map((id) => document.getElementById(id));

    let servicios = [];
    let clientes = [];
    let vehiculos = [];
    let empleados = [];
    let repuestos = [];
    let filtroActual = "agenda";

    function idRegistro(registro) {
        return String(registro.id ?? registro.codigo ?? "");
    }

    function nombreEmpleado(empleado) {
        return empleado.nombreCompleto ||
            empleado.nombre ||
            [empleado.nombres, empleado.apellidos].filter(Boolean).join(" ") ||
            empleado.userName ||
            `Empleado ${idRegistro(empleado)}`;
    }

    function nombreRepuesto(repuesto) {
        return repuesto.nombre ||
            repuesto.descripcion ||
            repuesto.referencia ||
            `Repuesto ${idRegistro(repuesto)}`;
    }

    async function cargarCatalogos() {
        const [listaClientes, listaVehiculos, listaEmpleados, listaRepuestos] = await Promise.all([
            window.ClientesAPI?.listar ? window.ClientesAPI.listar() : [],
            window.VehiculosAPI?.listar ? window.VehiculosAPI.listar() : [],
            window.EmpleadosAPI?.listar ? window.EmpleadosAPI.listar() : [],
            window.RepuestosAPI?.listar ? window.RepuestosAPI.listar() : []
        ]);
        clientes = listaClientes;
        vehiculos = listaVehiculos;
        empleados = listaEmpleados;
        repuestos = listaRepuestos;
    }

    async function cargarServicios() {
        try {
            await cargarCatalogos();
            servicios = await window.ServiciosAPI.listar();
            mostrarServicios();
        } catch (error) {
            console.error("Error cargando servicios:", error);
            mostrarEstado(`❌ Error cargando servicios: ${error.message}`);
        }
    }

    function llenarSelector(selector, textoInicial, registros, etiqueta, seleccionado = "") {
        selector.replaceChildren(new Option(textoInicial, ""));
        registros.forEach((registro) => {
            const id = idRegistro(registro);
            if (!id) return;
            const opcion = new Option(etiqueta(registro), id);
            opcion.selected = id === String(seleccionado);
            selector.add(opcion);
        });
    }

    function llenarClientes(seleccionado = "") {
        llenarSelector(
            selectorCliente,
            "Seleccionar cliente",
            clientes,
            (cliente) => `${cliente.nombres} ${cliente.apellidos} (${cliente.numeroIdentificacion})`,
            seleccionado
        );
    }

    function llenarVehiculos(clienteId = "", seleccionado = "") {
        const disponibles = vehiculos.filter((vehiculo) =>
            !clienteId || String(vehiculo.propietarioId) === String(clienteId)
        );
        llenarSelector(
            selectorVehiculo,
            disponibles.length ? "Seleccionar vehículo" : "No hay vehículos registrados para este cliente",
            disponibles,
            (vehiculo) => `${vehiculo.placa} · ${vehiculo.modelo} · ${vehiculo.color}`,
            seleccionado
        );
    }

    function llenarReferencias(empleadoId = "", repuestoIds = [], repuestosServicio = []) {
        llenarSelector(selectorEmpleado, "Seleccionar empleado", empleados, nombreEmpleado, empleadoId);
        selectorRepuestos.replaceChildren();
        const idsActivos = new Set();
        repuestos.forEach((repuesto) => {
            const id = idRegistro(repuesto);
            if (!id) return;
            idsActivos.add(id);
            const opcion = new Option(nombreRepuesto(repuesto), id);
            opcion.selected = repuestoIds.includes(id);
            selectorRepuestos.add(opcion);
        });
        repuestosServicio.forEach((repuesto) => {
            const id = String(repuesto.repuesto_id ?? "");
            if (!id || idsActivos.has(id)) return;
            const opcion = new Option(`Repuesto ${id} (fuera de catálogo)`, id);
            opcion.disabled = true;
            opcion.selected = repuestoIds.includes(id);
            selectorRepuestos.add(opcion);
        });
    }

    function clientePorId(id) {
        return clientes.find((cliente) => idRegistro(cliente) === String(id));
    }

    function vehiculoPorId(id) {
        return vehiculos.find((vehiculo) => idRegistro(vehiculo) === String(id));
    }

    function empleadoPorId(id) {
        return empleados.find((empleado) => idRegistro(empleado) === String(id));
    }

    function claseEstado(estado) {
        if (estado === "Pendiente") return "estado-pendiente";
        if (estado === "En proceso") return "estado-proceso";
        if (estado === "Finalizado") return "estado-finalizado";
        return "";
    }

    function mostrarServicios() {
        const consulta = buscador.value.trim().toLocaleLowerCase();
        const resultados = servicios.filter((servicio) => {
            if (filtroActual === "agenda" && servicio.estado === "Finalizado") return false;
            if (["Pendiente", "En proceso", "Finalizado"].includes(filtroActual) &&
                servicio.estado !== filtroActual) {
                return false;
            }

            const cliente = clientePorId(servicio.clienteId);
            const vehiculo = vehiculoPorId(servicio.vehiculoId);
            const empleado = empleadoPorId(servicio.empleadoId);
            const nombreCliente = cliente
                ? `${cliente.nombres} ${cliente.apellidos}`.trim()
                : servicio.clienteNombre || "Cliente no disponible";
            return [
                servicio.id,
                servicio.descripcion,
                vehiculo?.placa,
                nombreCliente,
                nombreEmpleado(empleado || {}),
                servicio.estado
            ].some((dato) => String(dato || "").toLocaleLowerCase().includes(consulta));
        });

        tabla.replaceChildren();
        if (!resultados.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 11;
            celda.textContent = servicios.length
                ? "🔎 No hay órdenes que coincidan con el filtro."
                : "🧰 Todavía no hay órdenes de servicio registradas.";
        }

        resultados.forEach((servicio) => {
            const fila = tabla.insertRow();
            const cliente = clientePorId(servicio.clienteId);
            const vehiculo = vehiculoPorId(servicio.vehiculoId);
            const empleado = empleadoPorId(servicio.empleadoId);
            const nombreCliente = cliente
                ? `${cliente.nombres} ${cliente.apellidos}`.trim()
                : servicio.clienteNombre || "Cliente no disponible";
            [
                `OS-${servicio.id}`,
                servicio.descripcion,
                vehiculo?.placa || "Vehículo no disponible",
                nombreCliente,
                empleado ? nombreEmpleado(empleado) : "Empleado no disponible"
            ].forEach((dato) => {
                fila.insertCell().textContent = dato;
            });

            const estado = fila.insertCell();
            const etiquetaEstado = document.createElement("span");
            etiquetaEstado.className = `estado-servicio ${claseEstado(servicio.estado)}`.trim();
            etiquetaEstado.textContent = servicio.estado || "Sin estado";
            estado.append(etiquetaEstado);
            fila.insertCell().textContent = servicio.prioridad || "—";
            fila.insertCell().textContent = servicio.fechaInicio || "";
            fila.insertCell().textContent = new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 2
            }).format(servicio.montoTotal);

            const facturacion = fila.insertCell();
            const etiquetaFactura = document.createElement("span");
            const estadoFacturacion = servicio.estadoFacturacion ||
                servicio.estado_facturacion ||
                (servicio.facturable ? "Disponible" : "No disponible");
            etiquetaFactura.className =
                estadoFacturacion === "Disponible" ? "etiqueta-facturable" : "etiqueta-no-facturable";
            etiquetaFactura.textContent = estadoFacturacion;
            facturacion.append(etiquetaFactura);

            const acciones = fila.insertCell();
            acciones.append(
                crearAccion("✏️", "Editar servicio", "editar-servicio", servicio.id),
                crearAccion("🗑️", "Eliminar servicio", "eliminar-servicio", servicio.id)
            );
        });

        document.getElementById("cantidad-servicios").textContent =
            `${servicios.length} ${servicios.length === 1 ? "servicio registrado" : "servicios registrados"}`;
        document.getElementById("total-agenda").textContent =
            servicios.filter((servicio) => servicio.estado !== "Finalizado").length;
        document.getElementById("total-pendientes").textContent =
            servicios.filter((servicio) => servicio.estado === "Pendiente").length;
        document.getElementById("total-proceso").textContent =
            servicios.filter((servicio) => servicio.estado === "En proceso").length;
        document.getElementById("total-finalizados").textContent =
            servicios.filter((servicio) => servicio.estado === "Finalizado").length;
        document.getElementById("total-historial").textContent = servicios.length;
    }

    function limpiarErrores() {
        campos.forEach((campo) => {
            campo.closest(".campo-formulario").classList.remove("invalido");
            document.getElementById(`error-${campo.id}`).textContent = "";
        });
    }

    async function abrirServicio(servicio = null) {
        try {
            await cargarCatalogos();
        } catch (error) {
            mostrarEstado(`❌ No se pudieron cargar los catálogos: ${error.message}`);
            return;
        }

        formulario.reset();
        limpiarErrores();
        idActual.value = servicio?.id || "";
        document.getElementById("titulo-modal-servicio").textContent =
            servicio ? "Editar orden de servicio" : "Registrar servicio";

        llenarClientes(servicio?.clienteId || "");
        llenarVehiculos(servicio?.clienteId || "", servicio?.vehiculoId || "");
        llenarReferencias(
            servicio?.empleadoId || "",
            servicio?.repuestoIds || [],
            servicio?.repuestos || []
        );
        document.getElementById("servicio-estado").value = servicio?.estado || "Pendiente";
        document.getElementById("servicio-prioridad").value = servicio?.prioridad || "Media";
        document.getElementById("servicio-fecha-inicio").value =
            servicio?.fechaInicio || fechaLocalActual();
        document.getElementById("servicio-fecha-fin").value = servicio?.fechaFin || "";
        document.getElementById("servicio-horas").value = servicio?.horas ?? "";
        document.getElementById("servicio-mano-obra").value = servicio?.manoObra ?? "";
        document.getElementById("servicio-descripcion").value = servicio?.descripcion || "";
        document.getElementById("servicio-observaciones").value = servicio?.observaciones || "";
        modal.showModal();
        selectorCliente.focus();
    }

    function validarCampo(campo) {
        const valor = campo.value.trim();
        if (campo.id === "servicio-fecha-fin" && !valor) return "";

        if (campo.id === "servicio-repuestos") {
            const seleccionados = [...campo.selectedOptions].map((opcion) => opcion.value);
            return seleccionados.every((id) => repuestos.some((item) => idRegistro(item) === id))
                ? ""
                : "Selecciona únicamente repuestos registrados.";
        }

        if (!valor) {
            if (campo.id === "servicio-horas") {
                return "Las horas empleadas deben ser un número entero positivo.";
            }
            if (campo.id === "servicio-mano-obra") {
                return "El valor de mano de obra debe ser un número mayor a cero.";
            }
            if (campo.id === "servicio-descripcion") {
                return "La descripción del servicio es obligatoria.";
            }
            return "Este campo es obligatorio.";
        }
        if (campo.id === "servicio-cliente" && !clientePorId(valor)) {
            return "Selecciona un cliente registrado.";
        }
        if (campo.id === "servicio-vehiculo") {
            const vehiculo = vehiculoPorId(valor);
            if (!vehiculo) return "Selecciona un vehículo registrado.";
            if (![vehiculo.placa, vehiculo.modelo, vehiculo.color].every((dato) => String(dato || "").trim())) {
                return "El vehículo debe tener placa, modelo y color registrados.";
            }
            if (String(vehiculo.propietarioId) !== selectorCliente.value) {
                return "El vehículo debe pertenecer al cliente seleccionado.";
            }
        }
        if (campo.id === "servicio-empleado" && !empleadoPorId(valor)) {
            return "Selecciona un empleado registrado.";
        }
        if (campo.id === "servicio-estado" && !estadosValidos.includes(valor)) {
            return "Selecciona un estado válido.";
        }
        if (campo.id === "servicio-prioridad" && !prioridadesValidas.includes(valor)) {
            return "Selecciona una prioridad válida.";
        }
        if (campo.id === "servicio-fecha-inicio" && Number.isNaN(Date.parse(`${valor}T00:00:00`))) {
            return "Ingresa una fecha de inicio válida.";
        }
        if (campo.id === "servicio-fecha-fin") {
            if (Number.isNaN(Date.parse(`${valor}T00:00:00`))) return "Ingresa una fecha válida.";
            if (valor < document.getElementById("servicio-fecha-inicio").value) {
                return "La fecha estimada no puede ser anterior a la fecha de inicio.";
            }
        }
        if (campo.id === "servicio-horas" &&
            (!/^[1-9]\d*$/.test(valor) || !Number.isSafeInteger(Number(valor)))) {
            return "Las horas empleadas deben ser un número entero positivo.";
        }
        if (campo.id === "servicio-mano-obra" &&
            (!Number.isFinite(Number(valor)) || Number(valor) <= 0)) {
            return "El valor de mano de obra debe ser un número mayor a cero.";
        }
        if (campo.id === "servicio-descripcion" && !valor) {
            return "La descripción del servicio es obligatoria.";
        }
        return "";
    }

    conectarValidacion(formulario, campos, validarCampo);

    formulario.addEventListener("formulario-valido", async () => {
        const clienteSeleccionado = clientePorId(selectorCliente.value);
        if (!clienteSeleccionado) {
            mostrarEstado("⚠️ Selecciona un cliente registrado antes de guardar el servicio.");
            return;
        }

        const clienteNombre = `${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos}`.trim();
        const servicioExistente = servicios.find(
            (servicio) => idRegistro(servicio) === String(idActual.value)
        );
        const repuestosSeleccionados = [...selectorRepuestos.selectedOptions].map((opcion) => {
            const repuesto = repuestos.find((item) => idRegistro(item) === opcion.value);
            const existente = servicioExistente?.repuestos?.find(
                (item) => String(item.repuesto_id) === opcion.value
            );
            return {
                repuesto_id: Number(opcion.value),
                cantidad: Number(existente?.cantidad ?? 1),
                precio_unitario: Number(
                    existente?.precio_unitario ?? repuesto?.precio ?? repuesto?.precio_unitario ?? 0
                )
            };
        });
        const registro = {
            clienteId: selectorCliente.value,
            clienteNombre,
            clienteNumeroIdentificacion: clienteSeleccionado.numeroIdentificacion,
            vehiculoId: selectorVehiculo.value,
            empleadoId: selectorEmpleado.value,
            estado: document.getElementById("servicio-estado").value,
            estadoFacturacion: servicioExistente?.estadoFacturacion || servicioExistente?.estado_facturacion || "",
            prioridad: document.getElementById("servicio-prioridad").value,
            fechaInicio: document.getElementById("servicio-fecha-inicio").value,
            fechaFin: document.getElementById("servicio-fecha-fin").value,
            horas: Number(document.getElementById("servicio-horas").value),
            manoObra: Number(document.getElementById("servicio-mano-obra").value),
            repuestoIds: repuestosSeleccionados.map((repuesto) => String(repuesto.repuesto_id)),
            repuestos: repuestosSeleccionados,
            descripcion: document.getElementById("servicio-descripcion").value.trim(),
            observaciones: document.getElementById("servicio-observaciones").value.trim(),
            facturable: true
        };

        try {
            if (idActual.value) {
                await window.ServiciosAPI.actualizar(idActual.value, registro);
            } else {
                await window.ServiciosAPI.crear(registro);
            }

            modal.close();
            await cargarServicios();
            window.dispatchEvent(new CustomEvent("serviauto:servicios-actualizados", {
                detail: { servicio: registro }
            }));
            mostrarEstado(idActual.value
                ? "✅ Servicio actualizado correctamente y disponible para facturación."
                : "✅ Servicio registrado correctamente y disponible para facturación.");
        } catch (error) {
            console.error("Error guardando servicio:", error);
            mostrarEstado(`❌ Error guardando servicio: ${error.message}`);
        }
    });

    selectorCliente.addEventListener("change", () => llenarVehiculos(selectorCliente.value));
    document.getElementById("btn-registrar-servicio").addEventListener("click", () => abrirServicio());
    document.getElementById("cerrar-modal-servicio").addEventListener("click", () => modal.close());
    document.getElementById("btn-cancelar-servicio").addEventListener("click", () => modal.close());
    buscador.addEventListener("input", mostrarServicios);

    document.querySelectorAll(".filtro-servicio").forEach((boton) => {
        boton.addEventListener("click", () => {
            filtroActual = boton.dataset.filtro;
            document.querySelectorAll(".filtro-servicio").forEach((filtro) => {
                const activo = filtro === boton;
                filtro.classList.toggle("activo", activo);
                filtro.setAttribute("aria-pressed", String(activo));
            });
            mostrarServicios();
        });
    });

    tabla.addEventListener("click", async (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;
        const servicio = servicios.find((item) => idRegistro(item) === String(boton.dataset.id));
        if (!servicio) {
            mostrarEstado("⚠️ No se encontró el servicio seleccionado.");
            return;
        }
        if (boton.dataset.accion === "editar-servicio") {
            abrirServicio(servicio);
            return;
        }
        if (boton.dataset.accion === "eliminar-servicio" &&
            window.confirm(`¿Eliminar la orden OS-${servicio.id}? Esta acción no se puede deshacer.`)) {
            try {
                await window.ServiciosAPI.eliminar(servicio.id);
                await cargarServicios();
                window.dispatchEvent(new Event("serviauto:servicios-actualizados"));
                mostrarEstado("🗑️ Servicio eliminado correctamente.");
            } catch (error) {
                console.error("Error eliminando servicio:", error);
                mostrarEstado(`❌ Error eliminando servicio: ${error.message}`);
            }
        }
    });

    window.addEventListener("serviauto:clientes-actualizados", async () => {
        await cargarCatalogos();
        mostrarServicios();
    });
    window.addEventListener("serviauto:vehiculos-actualizados", async () => {
        await cargarCatalogos();
        mostrarServicios();
    });
    window.addEventListener("serviauto:empleados-actualizados", cargarCatalogos);
    window.addEventListener("serviauto:repuestos-actualizados", cargarCatalogos);
    window.addEventListener("serviauto:servicios-actualizados", async (evento) => {
        if (!Array.isArray(evento.detail?.serviciosFacturados)) return;
        await cargarServicios();
    });

    await cargarServicios();
}


/* =========================================================
   CRUD DE EMPLEADOS
========================================================= */
async function inicializarCRUDEmpleados() {
    let empleados = [];
    let todosLosEmpleados = [];

    const modal = document.getElementById("modal-empleado");
    const formulario = document.getElementById("formulario-empleado");
    const tabla = document.getElementById("lista-empleados");
    const buscador = document.getElementById("buscar-empleado");
    const idActual = document.getElementById("id-empleado");
    const idsCampos = [
        "nombres-empleado",
        "apellidos-empleado",
        "tipo-identificacion-empleado",
        "identificacion-empleado",
        "telefono-empleado",
        "direccion-empleado",
        "cargo-empleado",
        "especialidad-empleado",
        "estado-empleado"
    ];
    const campos = idsCampos.map((id) => document.getElementById(id));
    let filtroActual = "todos";
    let modoEdicion = false;

    function estadoEmpleado(empleado) {
        return empleado.estado || "Disponible";
    }

    /* =======================================
     CARGAR EMPLEADOS
  ======================================= */

    async function cargarEmpleados() {
        try {
            const [filtrados, generales] = await Promise.all([
                EmpleadosAPI.listarPorEstado(filtroActual),
                filtroActual === "todos" ? Promise.resolve(null) : EmpleadosAPI.listar()
            ]);
            empleados = filtrados;
            todosLosEmpleados = generales || filtrados;
            mostrarEmpleados();
        } catch (error) {
            console.error("Error cargando empleados:", error);
            mostrarEstado(`❌ Error cargando empleados: ${error.message}`);
        }
    }

    /* =======================================
         TABLA
      ======================================= */

    function mostrarEmpleados() {
        const consulta = buscador.value.trim().toLocaleLowerCase();
        const resultados = empleados.filter((empleado) => {
            const coincideFiltro = filtroActual === "todos" || estadoEmpleado(empleado) === filtroActual;
            const coincideBusqueda = [
                empleado.nombres,
                empleado.apellidos,
                empleado.nombreCompleto,
                empleado.nombre,
                empleado.identificacion,
                empleado.numeroIdentificacion,
                empleado.telefono,
                empleado.cargo,
                empleado.especialidad
            ].some((dato) => String(dato || "").toLocaleLowerCase().includes(consulta));
            return coincideFiltro && coincideBusqueda;
        });

        tabla.replaceChildren();
        if (!resultados.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 9;
            celda.textContent = todosLosEmpleados.length
                ? "🔎 No se encontraron empleados para este filtro."
                : "👥 Todavía no hay empleados registrados.";
        }

        resultados.forEach((empleado) => {
            const fila = tabla.insertRow();
            const nombre = empleado.nombres || empleado.nombreCompleto || empleado.nombre || "";
            const apellido = empleado.apellidos || "";
            [
                empleado.id,
                nombre,
                apellido,
                `${empleado.tipoIdentificacion || ""} ${empleado.identificacion || empleado.numeroIdentificacion || ""}`.trim(),
                empleado.telefono,
                empleado.cargo,
                empleado.especialidad
            ].forEach((dato) => {
                fila.insertCell().textContent = dato || "";
            });

            const celdaEstado = fila.insertCell();
            const etiqueta = document.createElement("span");
            etiqueta.className = `etiqueta-empleado estado-${estadoEmpleado(empleado).toLocaleLowerCase().replace(/\s+/g, "-")}`;
            etiqueta.textContent = estadoEmpleado(empleado);
            celdaEstado.append(etiqueta);

            const acciones = fila.insertCell();
            acciones.append(
                crearAccion("✏️", "Editar empleado", "editar-empleado", empleado.id),
                crearAccion("🗑️", "Eliminar empleado", "eliminar-empleado", empleado.id)
            );
        });

        document.getElementById("cantidad-empleados").textContent =
            `${resultados.length} ${resultados.length === 1 ? "empleado" : "empleados"}`;
        document.getElementById("total-empleados").textContent = todosLosEmpleados.length;
        document.getElementById("total-disponibles-empleados").textContent =
            todosLosEmpleados.filter((empleado) => estadoEmpleado(empleado) === "Disponible").length;
        document.getElementById("total-ocupados-empleados").textContent =
            todosLosEmpleados.filter((empleado) => estadoEmpleado(empleado) === "Ocupado").length;
        document.getElementById("total-no-disponibles-empleados").textContent =
            todosLosEmpleados.filter((empleado) => estadoEmpleado(empleado) === "No disponible").length;
    }

    /* =======================================
         MODAL
      ======================================= */

    function abrirEmpleado(empleado = null) {
        formulario.reset();
        campos.forEach((campo) => {
            campo.closest(".campo-formulario").classList.remove("invalido");
            document.getElementById(`error-${campo.id}`).textContent = "";
        });
        modoEdicion = Boolean(empleado);
        idActual.value = empleado?.id || "";
        document.getElementById("titulo-modal-empleado").textContent =
            empleado ? "Editar empleado" : "Registrar empleado";
        document.getElementById("descripcion-modal-empleado").textContent =
            empleado ? "Modifica la información del empleado." : "Ingresa la información del nuevo empleado.";
        document.getElementById("guardar-empleado").textContent =
            empleado ? "💾 Guardar cambios" : "💾 Guardar empleado";

        if (empleado) {
            campos.forEach((campo) => {
                const propiedad = campo.dataset.prop;
                const valor = propiedad === "identificacion"
                    ? empleado.identificacion || empleado.numeroIdentificacion
                    : propiedad === "estado"
                        ? estadoEmpleado(empleado)
                        : empleado[propiedad];
                campo.value = valor || "";
            });
        }

        modal.showModal();
        campos[0].focus();
    }

    /* =======================================
       VALIDACIÓN
    ======================================= */

    conectarValidacion(formulario, campos, (campo) => {
        const valor = campo.value.trim();
        if (!valor) return "Este campo es obligatorio.";

        if (campo.id === "telefono-empleado" && !/^\d{7,10}$/.test(valor)) {
            return "Ingresa un teléfono de 7 a 10 dígitos.";
        }
        if (campo.id === "identificacion-empleado") {
            if (valor.length > 20) return "Admite máximo 20 caracteres.";
            const tipo = document.getElementById("tipo-identificacion-empleado").value;
            const duplicado = todosLosEmpleados.some((empleado) =>
                String(empleado.id) !== String(idActual.value) &&
                empleado.tipoIdentificacion === tipo &&
                String(empleado.identificacion || empleado.numeroIdentificacion || "").toLocaleLowerCase() ===
                valor.toLocaleLowerCase()
            );
            if (duplicado) return "Ese tipo y número de identificación ya están registrados.";
        }

        return "";
    });

    /* =======================================
       GUARDAR
    ======================================= */

    formulario.addEventListener("formulario-valido", async () => {
        const registro = Object.fromEntries(campos.map((campo) => [
            campo.dataset.prop,
            campo.value.trim()
        ]));

        try {
            if (modoEdicion && idActual.value) {
                await EmpleadosAPI.actualizar(idActual.value, registro);
            } else {
                await EmpleadosAPI.crear(registro);
            }

            modal.close();
            await cargarEmpleados();
            window.dispatchEvent(new Event("serviauto:empleados-actualizados"));
            mostrarEstado(modoEdicion
                ? "✅ Empleado actualizado correctamente."
                : "✅ Empleado registrado correctamente.");
        } catch (error) {
            console.error("Error guardando empleado:", error);
            mostrarEstado(`❌ Error guardando empleado: ${error.message}`);
        }
    });

    document.querySelector(".btn-nuevo-empleado").addEventListener("click", () => abrirEmpleado());
    document.querySelectorAll(".cerrar-modal-empleado, .btn-cancelar-empleado").forEach((boton) => {
        boton.addEventListener("click", () => modal.close());
    });
    buscador.addEventListener("input", mostrarEmpleados);

    document.querySelectorAll(".filtro-empleado").forEach((boton) => {
        boton.addEventListener("click", async () => {
            filtroActual = boton.dataset.filtro;
            document.querySelectorAll(".filtro-empleado").forEach((filtro) => {
                const activo = filtro === boton;
                filtro.classList.toggle("activo", activo);
                filtro.setAttribute("aria-pressed", String(activo));
            });
            await cargarEmpleados();
        });
    });


    /* =======================================
       EVENTOS
    ======================================= */

    tabla.addEventListener("click", async (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;
        const empleado = empleados.find((item) => String(item.id) === String(boton.dataset.id));
        if (!empleado) {
            mostrarEstado("⚠️ No se encontró el empleado seleccionado.");
            return;
        }

        if (boton.dataset.accion === "editar-empleado") {
            abrirEmpleado(empleado);
            return;
        }
        if (boton.dataset.accion === "eliminar-empleado" &&
            window.confirm(`¿Eliminar al empleado ${empleado.nombres || empleado.nombre || ""}? Esta acción no se puede deshacer.`)) {
            try {
                await EmpleadosAPI.eliminar(empleado.id);
                await cargarEmpleados();
                window.dispatchEvent(new Event("serviauto:empleados-actualizados"));
                mostrarEstado("🗑️ Empleado eliminado correctamente.");
            } catch (error) {
                console.error("Error eliminando empleado:", error);
                mostrarEstado(`❌ Error eliminando empleado: ${error.message}`);
            }
        }
    });

    await cargarEmpleados();
}
/* =========================================================
   CRUD DE REPUESTOS E INVENTARIO
========================================================= */
async function inicializarCRUDRepuestos() {
    let repuestos = [];
    const modal = document.getElementById("modal-repuesto");
    const formulario = document.getElementById("formulario-repuesto");
    const tabla = document.getElementById("lista-repuestos");
    const buscador = document.getElementById("buscar-repuesto");
    const idsCampos = [
        "referencias-repuesto",
        "descripcion-repuesto",
        "marca-repuesto",
        "precio-unitario-repuesto",
        "stock-repuesto",
        "stock-minimo",
        "stock-maximo"
    ];
    const campos = idsCampos.map((id) => document.getElementById(id));
    const formatoMoneda = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 2
    });
    let idActual = "";
    let modoEdicion = false;

    function referencia(repuesto) {
        return repuesto.referencia || repuesto.referencias || repuesto.codigo || "";
    }

    async function cargarRepuestos() {
        try {
            repuestos = await RepuestosAPI.listar();
            mostrarRepuestos();
        } catch (error) {
            console.error("Error cargando repuestos:", error);
            mostrarEstado(`❌ Error cargando repuestos: ${error.message}`);
        }
    }

    function mostrarRepuestos() {
        const consulta = buscador.value.trim().toLocaleLowerCase();
        const resultados = repuestos.filter((repuesto) =>
            [referencia(repuesto), repuesto.descripcion, repuesto.marca]
                .some((dato) => String(dato || "").toLocaleLowerCase().includes(consulta))
        );

        tabla.replaceChildren();
        if (!resultados.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 6;
            celda.textContent = repuestos.length
                ? "🔎 No se encontraron repuestos."
                : "📦 Todavía no hay repuestos registrados.";
        }

        resultados.forEach((repuesto) => {
            const fila = tabla.insertRow();
            const stock = Number(repuesto.stock ?? 0);
            const minimo = Number(repuesto.stockMinimo ?? 0);
            [
                referencia(repuesto),
                repuesto.descripcion,
                repuesto.marca,
                formatoMoneda.format(Number(repuesto.precio ?? repuesto.precioUnitario ?? repuesto.valor ?? 0))
            ].forEach((dato) => {
                fila.insertCell().textContent = dato || "";
            });

            const celdaStock = fila.insertCell();
            const etiqueta = document.createElement("span");
            etiqueta.className = `etiqueta-stock ${stock === 0 ? "stock-agotado" : stock <= minimo ? "stock-bajo" : "stock-disponible"}`;
            etiqueta.textContent = `${stock} ${stock === 1 ? "unidad" : "unidades"}`;
            celdaStock.append(etiqueta);

            const acciones = fila.insertCell();
            acciones.append(
                crearAccion("✏️", "Editar repuesto", "editar-repuesto", repuesto.id),
                crearAccion("🗑️", "Eliminar repuesto", "eliminar-repuesto", repuesto.id)
            );
        });

        document.getElementById("cantidad-repuestos").textContent =
            `${resultados.length} ${resultados.length === 1 ? "repuesto" : "repuestos"}`;
        document.getElementById("total-repuestos").textContent = repuestos.length;
        document.getElementById("total-ocupados").textContent =
            repuestos.filter((repuesto) => Number(repuesto.stock ?? 0) <= Number(repuesto.stockMinimo ?? 0)).length;
        document.getElementById("total-disponibles").textContent =
            repuestos.filter((repuesto) => Number(repuesto.stock ?? 0) > 0).length;
    }

    function abrirRepuesto(repuesto = null) {
        formulario.reset();
        campos.forEach((campo) => {
            campo.closest(".campo-formulario").classList.remove("invalido");
            document.getElementById(`error-${campo.id}`).textContent = "";
        });
        modoEdicion = Boolean(repuesto);
        idActual = repuesto?.id ? String(repuesto.id) : "";
        document.getElementById("titulo-modal-repuesto").textContent =
            repuesto ? "Editar repuesto" : "Registrar repuesto";
        document.getElementById("descripcion-modal-repuesto").textContent =
            repuesto ? "Modifica la información y existencias del repuesto." : "Ingresa la información del nuevo repuesto.";

        if (repuesto) {
            campos.forEach((campo) => {
                const propiedad = campo.dataset.prop;
                const alternativas = propiedad === "referencia" ? ["referencias", "codigo"]
                    : propiedad === "precio" ? ["precioUnitario", "valor"]
                        : propiedad === "stockMinimo" ? ["stock_minimo"]
                            : propiedad === "stockMaximo" ? ["stock_maximo"]
                                : [];
                const valor = repuesto[propiedad] ?? alternativas.map((alternativa) => repuesto[alternativa]).find((dato) => dato !== undefined);
                campo.value = valor ?? "";
            });
        }

        modal.showModal();
        campos[0].focus();
    }

    conectarValidacion(formulario, campos, (campo) => {
        const valor = campo.value.trim();
        if (!valor) return "Este campo es obligatorio.";

        if (campo.id === "referencias-repuesto" && repuestos.some((repuesto) =>
            String(repuesto.id) !== String(idActual) &&
            referencia(repuesto).toLocaleLowerCase() === valor.toLocaleLowerCase()
        )) {
            return "Esa referencia ya está registrada.";
        }
        if (campo.id === "precio-unitario-repuesto" &&
            (!Number.isFinite(Number(valor)) || Number(valor) <= 0)) {
            return "Ingresa un precio mayor que cero.";
        }
        if (["stock-repuesto", "stock-minimo", "stock-maximo"].includes(campo.id) &&
            (!Number.isInteger(Number(valor)) || Number(valor) < 0)) {
            return "Ingresa una cantidad entera igual o mayor que cero.";
        }
        if (campo.id === "stock-repuesto" &&
            Number(valor) > Number(document.getElementById("stock-maximo").value)) {
            return "El stock actual no puede superar el máximo definido.";
        }
        if (campo.id === "stock-maximo" &&
            Number(valor) < Number(document.getElementById("stock-minimo").value)) {
            return "El stock máximo debe ser igual o mayor que el mínimo.";
        }
        if (campo.id === "stock-minimo" &&
            Number(document.getElementById("stock-maximo").value) < Number(valor)) {
            return "El stock mínimo no puede superar el máximo.";
        }

        return "";
    });

    formulario.addEventListener("formulario-valido", async () => {
        const registro = Object.fromEntries(campos.map((campo) => [
            campo.dataset.prop,
            ["precio"].includes(campo.dataset.prop)
                ? Number(campo.value)
                : ["stock", "stockMinimo", "stockMaximo"].includes(campo.dataset.prop)
                    ? Number(campo.value)
                    : campo.value.trim()
        ]));

        try {
            if (modoEdicion && idActual) {
                await RepuestosAPI.actualizar(idActual, registro);
            } else {
                await RepuestosAPI.crear(registro);
            }

            modal.close();
            await cargarRepuestos();
            window.dispatchEvent(new Event("serviauto:repuestos-actualizados"));
            mostrarEstado(modoEdicion
                ? "✅ Repuesto actualizado correctamente."
                : "✅ Repuesto registrado correctamente.");
        } catch (error) {
            console.error("Error guardando repuesto:", error);
            mostrarEstado(`❌ Error guardando repuesto: ${error.message}`);
        }
    });

    document.querySelector(".btn-nuevo-repuesto").addEventListener("click", () => abrirRepuesto());
    document.querySelectorAll(".cerrar-modal-repuesto, .btn-cancelar-repuesto").forEach((boton) => {
        boton.addEventListener("click", () => modal.close());
    });
    buscador.addEventListener("input", mostrarRepuestos);

    tabla.addEventListener("click", async (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;
        const repuesto = repuestos.find((item) => String(item.id) === String(boton.dataset.id));
        if (!repuesto) {
            mostrarEstado("⚠️ No se encontró el repuesto seleccionado.");
            return;
        }

        if (boton.dataset.accion === "editar-repuesto") {
            abrirRepuesto(repuesto);
            return;
        }
        if (boton.dataset.accion === "eliminar-repuesto" &&
            window.confirm(`¿Eliminar el repuesto ${referencia(repuesto)}? Esta acción no se puede deshacer.`)) {
            try {
                await RepuestosAPI.eliminar(repuesto.id);
                await cargarRepuestos();
                window.dispatchEvent(new Event("serviauto:repuestos-actualizados"));
                mostrarEstado("🗑️ Repuesto eliminado correctamente.");
            } catch (error) {
                console.error("Error eliminando repuesto:", error);
                mostrarEstado(`❌ Error eliminando repuesto: ${error.message}`);
            }
        }
    });

    await cargarRepuestos();
}
/* =======================================
     CRUD DE FACTURACION
  ======================================= */

function inicializarFacturacion() {
    const modalFactura = document.getElementById("modal-factura");
    const formularioFactura = document.getElementById("formulario-factura");
    const modalItem = document.getElementById("modal-item-venta");
    const formularioItem = document.getElementById("formulario-item-venta");
    const selectorCliente = document.getElementById("cliente-factura");
    const selectorPlazo = document.getElementById("plazo-factura");
    const fechaFactura = document.getElementById("fecha-factura");
    const fechaVencimiento = document.getElementById("vencimiento-factura");
    const selectorImpuesto = document.getElementById("impuesto-item");
    const selectorServicio = document.getElementById("servicio-item-factura");
    const precioBase = document.getElementById("precio-unitario-item");
    const precioImpuestos = document.getElementById("precio-impuestos-item");
    let items = [];
    let indiceEdicion = -1;
    let clientes = [];
    let repuestos = [];
    let servicios = [];
    const tablaFacturas = document.getElementById("lista-facturas");
    const buscarFacturas = document.getElementById("buscar-facturas");
    let facturas = [];
    const formatoMoneda = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });

    if (!modalFactura || !formularioFactura || !modalItem || !formularioItem) return;

    function moneda(valor) {
        return formatoMoneda.format(Number.isFinite(valor) ? valor : 0);
    }

    function tasaImpuesto(tipo) {
        const configuracion = leerConfiguracionServiAuto() || {};

        if (tipo === "iva-19") {
            return (Number(configuracion.porcentajeIva) || 19) / 100;
        }

        if (tipo === "iva-5") return 0.05;

        return 0;
    }

    function redondear(valor) {
        return Math.round((valor + Number.EPSILON) * 100) / 100;
    }

    function obtenerDatosItem() {
        const base = Math.max(0, Number(precioBase.value) || 0);
        const referencia = Math.max(0, Number(document.getElementById("precio-referencia-item").value) || 0);
        const precioAplicado = base > 0 ? base : referencia;
        const cantidad = Math.max(0, Number(document.getElementById("cantidad-item").value) || 0);
        const descuentoPorcentaje = Math.min(100, Math.max(0, Number(document.getElementById("descuento-item").value) || 0));
        const bruto = precioAplicado * cantidad;
        const descuento = bruto * descuentoPorcentaje / 100;
        const subtotal = bruto - descuento;
        const impuestos = subtotal * tasaImpuesto(selectorImpuesto.value);

        return {
            bruto: redondear(bruto),
            descuento: redondear(descuento),
            subtotal: redondear(subtotal),
            impuestos: redondear(impuestos),
            total: redondear(subtotal + impuestos),
            precioAplicado
        };
    }

    function actualizarResumenItem() {
        const resumen = obtenerDatosItem();
        document.getElementById("descuento-item-resumen").textContent = moneda(resumen.descuento);
        document.getElementById("subtotal-item-resumen").textContent = moneda(resumen.subtotal);
        document.getElementById("impuestos-item-resumen").textContent = moneda(resumen.impuestos);
        document.getElementById("total-item-resumen").textContent = moneda(resumen.total);
    }

    function actualizarTotalesFactura() {
        const subtotal = redondear(items.reduce((total, item) => total + item.subtotal, 0));
        const impuestos = redondear(items.reduce((total, item) => total + item.impuestos, 0));
        const valorDescuento = Math.max(0, Number(document.getElementById("descuento-general").value) || 0);
        const esPorcentaje = document.getElementById("tipo-descuento-general").value === "porcentaje";
        const descuentoGeneral = Math.min(subtotal, esPorcentaje ? subtotal * Math.min(100, valorDescuento) / 100 : valorDescuento);
        const descuentoLineas = redondear(items.reduce((total, item) => total + item.descuento, 0));
        const total = Math.max(0, subtotal - descuentoGeneral + impuestos);

        document.getElementById("subtotal-factura").textContent = moneda(subtotal + descuentoLineas);
        document.getElementById("descuento-factura").textContent = moneda(descuentoLineas + descuentoGeneral);
        document.getElementById("impuestos-factura").textContent = moneda(impuestos);
        document.getElementById("total-factura").textContent = moneda(total);
    }

    function obtenerPayloadFactura() {
        const cliente = clientes.find((registro) => String(registro.id) === selectorCliente.value);
        if (!cliente || !cliente.tipoIdentificacion || !cliente.numeroIdentificacion) {
            throw new Error("Selecciona un cliente con identificación válida.");
        }
        if (!items.length) {
            throw new Error("Agrega al menos un ítem antes de guardar la factura.");
        }

        const nit = document.getElementById("nit-emisor").value.trim().split("-")[0].replace(/[^\d]/g, "");
        if (!nit || !document.getElementById("resolucion-factura").value.trim() ||
            !document.getElementById("numero-documento-comercial").value.trim()) {
            throw new Error("Completa los datos de emisión y verifica el número de identificación del cliente.");
        }

        return {
            cliente_id: Number(cliente.id),
            nit_emisor: nit,
            numero_resolucion: document.getElementById("resolucion-factura").value.trim(),
            numero_documento_comercial: document.getElementById("numero-documento-comercial").value.trim(),
            tipo_factura: document.getElementById("tipo-factura").value,
            fecha: fechaFactura.value,
            fecha_vencimiento: fechaVencimiento.value,
            medio_pago: document.getElementById("medio-pago").value,
            naturaleza_cliente: document.getElementById("naturaleza-cliente-factura").value,
            observacion: document.getElementById("observaciones-factura").value.trim(),
            descuento_general_valor: Number(document.getElementById("descuento-general").value) || 0,
            tipo_descuento_general: document.getElementById("tipo-descuento-general").value,
            items: items.map((item) => ({
                nombre: item.nombre,
                precio_unitario: item.precioAplicado,
                precio_referencia: item.precioReferencia,
                cantidad: item.cantidad,
                codigo: item.codigo,
                descuento_porcentaje: item.descuentoPorcentaje,
                observacion: item.observacion,
                unidad: item.unidad,
                impuesto: item.impuesto,
                servicio_id: item.servicioId || null
            }))
        };
    }

    async function procesarFactura(evento) {
        evento.preventDefault();

        if (!formularioFactura.reportValidity()) return;

        const accion = evento.submitter?.dataset.accion || "enviar";
        const botones = [...formularioFactura.querySelectorAll('[type="submit"]')];
        botones.forEach((boton) => { boton.disabled = true; });

        try {
            const payload = obtenerPayloadFactura();
            const respuesta = await FacturasAPI.crear(payload, accion);
            const serviciosFacturados = payload.items
                .map((item) => item.servicio_id)
                .filter(Boolean);
            if (serviciosFacturados.length) {
                window.dispatchEvent(new CustomEvent("serviauto:servicios-actualizados", {
                    detail: { serviciosFacturados }
                }));
            }
            await cargarFacturas();
            const numero = payload.numero_documento_comercial;
            if (accion === "guardar") {
                mostrarEstado(`✅ Factura ${numero} guardada como borrador en Panther.`);
            } else if (respuesta.envio?.success) {
                mostrarEstado(`✅ Factura ${numero} guardada y enviada a Clarisacloud.`);
            } else {
                mostrarEstado(
                    `⚠️ Factura ${numero} guardada, pero no se pudo enviar: ` +
                    `${respuesta.envio?.message || "revisa el estado de envío."}`
                );
            }
            modalFactura.close();
        } catch (error) {
            console.error("No se pudo procesar la factura:", error);
            mostrarEstado(`❌ ${error.message || "Ocurrió un error al procesar la factura."}`);
        } finally {
            botones.forEach((boton) => { boton.disabled = false; });
        }
    }

    function mostrarFacturas() {
        if (!tablaFacturas) return;
        const termino = (buscarFacturas?.value || "").trim().toLocaleLowerCase();
        const facturasFiltradas = facturas.filter((factura) => [
            factura.numero_documento_comercial,
            factura.id,
            factura.cliente_nombre,
            factura.estado_envio,
            factura.fecha,
            factura.fecha_vencimiento
        ].some((valor) => String(valor || "").toLocaleLowerCase().includes(termino)));
        tablaFacturas.replaceChildren();
        if (!facturasFiltradas.length) {
            const fila = tablaFacturas.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 7;
            celda.textContent = facturas.length
                ? "No hay facturas que coincidan con la búsqueda."
                : "Todavía no hay facturas guardadas.";
            return;
        }

        facturasFiltradas.forEach((factura) => {
            const fila = tablaFacturas.insertRow();
            const valores = [
                factura.numero_documento_comercial || `#${factura.id}`,
                factura.cliente_nombre || "Cliente no disponible",
                factura.fecha || "—",
                factura.fecha_vencimiento || "—",
                moneda(Number(factura.total)),
                factura.estado_envio || "BORRADOR"
            ];
            valores.forEach((valor) => {
                fila.insertCell().textContent = String(valor);
            });
            const acciones = fila.insertCell();
            if (
                ["BORRADOR", "ERROR"].includes(factura.estado_envio) &&
                factura.cliente_id &&
                factura.numero_documento_comercial
            ) {
                const enviar = crearAccion("Enviar", "Enviar factura", "enviar-factura", String(factura.id));
                acciones.append(enviar);
            } else if (factura.estado_envio === "PENDIENTE") {
                acciones.textContent = "Envío pendiente";
            } else {
                acciones.textContent = "—";
            }
        });
    }

    async function cargarFacturas() {
        if (!tablaFacturas) return;
        try {
            facturas = await FacturasAPI.listar();
            mostrarFacturas();
        } catch (error) {
            console.error("No se pudieron cargar las facturas:", error);
            mostrarEstado(`❌ No se pudieron cargar las facturas: ${error.message}`);
        }
    }

    async function actualizarConfiguracionFactura() {
        if (!window.ConfiguracionAPI?.listar) return;
        const configuraciones = await ConfiguracionAPI.listar();
        const configuracion = (Array.isArray(configuraciones) ? configuraciones : [])
            .filter((registro) => !registro.dateDelete)
            .sort((a, b) =>
                String(b.fecha_actualizacion || b.id || "").localeCompare(
                    String(a.fecha_actualizacion || a.id || "")
                )
            )[0];
        if (configuracion) {
            configuracionFinanciera = {
                id: Number(configuracion.id),
                porcentajeIva: Number(configuracion.iva),
                porcentajeUtilidad: Number(configuracion.porcentaje_utilidad),
                valorManoObra: Number(configuracion.valor_mano_obra)
            };
            const opcionIva = selectorImpuesto.querySelector('option[value="iva-19"]');
            if (opcionIva) {
                opcionIva.textContent = `IVA ${configuracionFinanciera.porcentajeIva}% (configurado)`;
            }
        }
    }

    function mostrarItems() {
        const tabla = document.getElementById("lista-items-factura");
        tabla.replaceChildren();

        if (!items.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 7;
            celda.className = "fila-items-vacia";
            celda.textContent = "Agrega los productos o servicios de esta factura.";
        }

        items.forEach((item, indice) => {
            const fila = tabla.insertRow();
            const porcentajeIvaConfigurado =
                Number(leerConfiguracionServiAuto()?.porcentajeIva) || 19;
            [
                item.servicioId ? `${item.nombre} (OS-${item.servicioId})` : item.nombre,
                `${item.cantidad} ${item.unidad}`,
                moneda(item.precioAplicado),
                {
                    "iva-19": `IVA ${porcentajeIvaConfigurado}%`,
                    "iva-5": "IVA 5%",
                    exento: "Exento",
                    excluido: "Excluido"
                }[item.impuesto],
                moneda(item.descuento),
                moneda(item.total)
            ].forEach((dato) => {
                fila.insertCell().textContent = dato;
            });

            const acciones = fila.insertCell();
            const editar = crearAccion("✎", "Editar ítem", "editar-item-factura", String(indice));
            const eliminar = crearAccion("×", "Eliminar ítem", "eliminar-item-factura", String(indice));
            acciones.append(editar, eliminar);
        });

        document.getElementById("cantidad-items-factura").textContent =
            `${items.length} ${items.length === 1 ? "ítem" : "ítems"}`;
        actualizarTotalesFactura();
    }

    function actualizarFechaVencimiento() {
        const plazo = selectorPlazo.value;
        const manual = plazo === "manual";
        fechaVencimiento.readOnly = !manual;
        fechaVencimiento.min = fechaFactura.value;

        if (manual) return;

        const fecha = new Date(`${fechaFactura.value}T00:00:00`);
        fecha.setDate(fecha.getDate() + Number(plazo || 0));
        fechaVencimiento.value = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    }

    function cargarClientes() {
        const opcionInicial = selectorCliente.options[0];
        selectorCliente.replaceChildren(opcionInicial);
        clientes.forEach((cliente) => {
            const opcion = document.createElement("option");
            opcion.value = cliente.id;
            opcion.textContent = `${cliente.nombres || ""} ${cliente.apellidos || ""} - ${cliente.numeroIdentificacion || ""}`.trim();
            selectorCliente.append(opcion);
        });
    }

    function actualizarDetalleCliente() {
        const cliente = clientes.find((registro) => String(registro.id) === selectorCliente.value);
        document.getElementById("factura-documento-cliente").textContent = cliente
            ? `${cliente.tipoIdentificacion || ""} ${cliente.numeroIdentificacion || ""}`.trim() : "—";
        document.getElementById("factura-direccion-cliente").textContent = cliente?.direccion || "—";
        document.getElementById("factura-email-cliente").textContent = cliente?.correo || "—";
        document.getElementById("factura-telefono-cliente").textContent = cliente?.telefono || "—";
    }

    function cargarCatalogoItems() {
        const catalogo = document.getElementById("catalogo-items-factura");
        catalogo.replaceChildren();
        const nombres = repuestos.map((repuesto) =>
            repuesto.descripcion || repuesto.nombre || repuesto.referencia || repuesto.codigo
        );
        nombres.filter(Boolean).forEach((nombre) => {
            const opcion = document.createElement("option");
            opcion.value = nombre;
            catalogo.append(opcion);
        });
    }

    function cargarServiciosFacturables() {
        selectorServicio.replaceChildren();
        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Ítem manual o repuesto";
        selectorServicio.append(opcionInicial);

        const serviciosEnFactura = new Set(items
            .filter((item, indice) => indice !== indiceEdicion && item.servicioId)
            .map((item) => String(item.servicioId)));

        servicios
            .filter((servicio) => {
                const estadoFact = servicio.estadoFacturacion || servicio.estado_facturacion;
                return (
                    servicio.estado === "Finalizado" &&
                    estadoFact === "Disponible" &&
                    !serviciosEnFactura.has(String(servicio.id))
                );
            })
            .forEach((servicio) => {
                const monto = Number(servicio.montoTotal ?? servicio.monto_total ?? 0) || 0;
                const opcion = document.createElement("option");
                opcion.value = String(servicio.id);
                opcion.textContent = `OS-${servicio.id} · ${servicio.descripcion} · ${moneda(monto)}`;
                selectorServicio.append(opcion);
            });
    }
    let servicioAplicado = false;
    function completarDesdeServicio() {
        const servicio = servicios.find((registro) => {
            const estadoFact = registro.estadoFacturacion || registro.estado_facturacion;
            return (
                String(registro.id) === selectorServicio.value &&
                registro.estado === "Finalizado" &&
                estadoFact === "Disponible"
            );
        });
        const camposBloqueados = [
            document.getElementById("nombre-item"),
            precioBase,
            precioImpuestos,
            document.getElementById("cantidad-item"),
            document.getElementById("unidad-item"),
            document.getElementById("precio-referencia-item"),
            document.getElementById("codigo-item")
        ];

        if (!servicio) {
            camposBloqueados.forEach((campo) => { campo.disabled = false; });
            if (servicioAplicado) {
                document.getElementById("nombre-item").value = "";
                precioBase.value = "0";
                precioImpuestos.value = "0";
                document.getElementById("cantidad-item").value = "1";
                document.getElementById("precio-referencia-item").value = "0";
                document.getElementById("codigo-item").value = "";
            }
            servicioAplicado = false;
            actualizarResumenItem();
            return;
        }

        const monto = Number(servicio.montoTotal ?? servicio.monto_total ?? 0) || 0;
        document.getElementById("nombre-item").value = servicio.descripcion;
        precioBase.value = monto;
        precioImpuestos.value = redondear(
            monto * (1 + tasaImpuesto(selectorImpuesto.value))
        );
        document.getElementById("cantidad-item").value = "1";
        document.getElementById("unidad-item").value = "unidad";
        document.getElementById("precio-referencia-item").value = "0";
        document.getElementById("codigo-item").value = `OS-${servicio.id}`;
        camposBloqueados.forEach((campo) => { campo.disabled = true; });
        servicioAplicado = true;
        actualizarResumenItem();
    }
    function completarDesdeCatalogo() {
        const nombre = document.getElementById("nombre-item").value.trim().toLowerCase();
        const repuesto = repuestos.find((registro) =>
            [registro.descripcion, registro.nombre, registro.referencia, registro.codigo]
                .some((dato) => String(dato || "").trim().toLowerCase() === nombre)
        );
        if (!repuesto) return;

        const valor = Number(repuesto.precio ?? repuesto.precioUnitario ?? repuesto.valor ?? 0);
        document.getElementById("codigo-item").value =
            repuesto.referencia || repuesto.codigo || "";
        if (valor > 0) {
            precioBase.value = valor;
            precioImpuestos.value = redondear(valor * (1 + tasaImpuesto(selectorImpuesto.value)));
        }
        actualizarResumenItem();
    }

    function abrirItem(indice = -1) {
        indiceEdicion = indice;
        formularioItem.reset();
        servicioAplicado = false;
        cargarServiciosFacturables();
        selectorServicio.value = "";
        completarDesdeServicio();
        selectorImpuesto.value = "iva-19";
        document.getElementById("cantidad-item").value = "1";
        document.getElementById("precio-unitario-item").value = "0";
        document.getElementById("precio-impuestos-item").value = "0";
        document.getElementById("descuento-item").value = "0";
        document.getElementById("precio-referencia-item").value = "0";
        document.getElementById("titulo-modal-item").textContent =
            indice === -1 ? "Asociar ítem de venta" : "Editar ítem de venta";

        if (indice !== -1) {
            const item = items[indice];
            document.getElementById("nombre-item").value = item.nombre;
            selectorImpuesto.value = item.impuesto;
            precioBase.value = item.precioBase;
            precioImpuestos.value = item.precioConImpuestos;
            document.getElementById("cantidad-item").value = item.cantidad;
            document.getElementById("unidad-item").value = item.unidad;
            document.getElementById("precio-referencia-item").value = item.precioReferencia;
            document.getElementById("codigo-item").value = item.codigo;
            document.getElementById("descuento-item").value = item.descuentoPorcentaje;
            document.getElementById("observacion-item").value = item.observacion;
            selectorServicio.value = item.servicioId ? String(item.servicioId) : "";
            completarDesdeServicio();
        }

        actualizarResumenItem();
        modalItem.showModal();
        document.getElementById("nombre-item").focus();
    }

    document.querySelectorAll(".btn-nueva-factura, .btn-abrir-factura").forEach((boton) => {
        boton.addEventListener("click", async () => {
            try {
                await actualizarConfiguracionFactura();
                [clientes, repuestos, servicios] = await Promise.all([
                    ClientesAPI.listar(),
                    RepuestosAPI.listar(),
                    ServiciosAPI.listar()
                ]);
            } catch (error) {
                mostrarEstado(`❌ No se pudieron cargar los datos de facturación: ${error.message}`);
                return;
            }
            items = [];
            formularioFactura.reset();
            cargarClientes();
            cargarCatalogoItems();
            fechaFactura.value = fechaLocalActual();
            selectorPlazo.value = "0";
            selectorCliente.value = "";
            actualizarDetalleCliente();
            actualizarFechaVencimiento();
            mostrarItems();
            modalFactura.showModal();
        });
    });

    document.querySelectorAll(".cerrar-modal-factura").forEach((boton) => {
        boton.addEventListener("click", () => modalFactura.close());
    });
    document.querySelectorAll(".btn-agregar-item").forEach((boton) => {
        boton.addEventListener("click", () => abrirItem());
    });
    document.querySelectorAll(".cerrar-modal-item").forEach((boton) => {
        boton.addEventListener("click", () => modalItem.close());
    });

    formularioFactura.addEventListener("submit", procesarFactura);
    buscarFacturas?.addEventListener("input", mostrarFacturas);
    tablaFacturas?.addEventListener("click", async (evento) => {
        const boton = evento.target.closest('button[data-accion="enviar-factura"]');
        if (!boton) return;
        boton.disabled = true;
        try {
            const respuesta = await FacturasAPI.enviar(boton.dataset.id);
            await cargarFacturas();
            mostrarEstado(respuesta.envio?.success
                ? "✅ Factura guardada enviada correctamente a Clarisacloud."
                : `⚠️ No se pudo enviar la factura: ${respuesta.envio?.message || "revisa el estado."}`);
        } catch (error) {
            console.error("No se pudo enviar la factura guardada:", error);
            mostrarEstado(`❌ No se pudo enviar la factura: ${error.message}`);
            boton.disabled = false;
        }
    });
    selectorCliente.addEventListener("change", actualizarDetalleCliente);
    selectorPlazo.addEventListener("change", actualizarFechaVencimiento);
    fechaFactura.addEventListener("change", actualizarFechaVencimiento);
    document.getElementById("descuento-general").addEventListener("input", actualizarTotalesFactura);
    document.getElementById("tipo-descuento-general").addEventListener("change", actualizarTotalesFactura);

    precioBase.addEventListener("input", () => {
        precioImpuestos.value = redondear((Number(precioBase.value) || 0) * (1 + tasaImpuesto(selectorImpuesto.value)));
        actualizarResumenItem();
    });
    precioImpuestos.addEventListener("input", () => {
        precioBase.value = redondear((Number(precioImpuestos.value) || 0) / (1 + tasaImpuesto(selectorImpuesto.value)));
        actualizarResumenItem();
    });
    selectorImpuesto.addEventListener("change", () => {
        precioImpuestos.value = redondear((Number(precioBase.value) || 0) * (1 + tasaImpuesto(selectorImpuesto.value)));
        actualizarResumenItem();
    });
    ["nombre-item", "cantidad-item", "descuento-item", "precio-referencia-item"].forEach((id) => {
        document.getElementById(id).addEventListener("input", actualizarResumenItem);
    });
    document.getElementById("nombre-item").addEventListener("change", completarDesdeCatalogo);
    selectorServicio.addEventListener("change", completarDesdeServicio);

    formularioItem.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const nombre = document.getElementById("nombre-item").value.trim();
        const servicioId = selectorServicio.value ? Number(selectorServicio.value) : null;
        const cantidad = Number(document.getElementById("cantidad-item").value);
        const base = Number(precioBase.value) || 0;
        const referencia = Number(document.getElementById("precio-referencia-item").value) || 0;
        const descuentoPorcentaje = Number(document.getElementById("descuento-item").value);
        const codigo = document.getElementById("codigo-item").value.trim();

        if (!nombre || !selectorImpuesto.value || !cantidad || cantidad <= 0 ||
            (base <= 0 && referencia <= 0) || !codigo ||
            descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
            mostrarEstado("⚠️ Completa el ítem, el código, el precio (o su referencia) y los valores válidos.");
            return;
        }

        if (servicioId !== null && items.some((item, indice) =>
            indice !== indiceEdicion && Number(item.servicioId) === servicioId
        )) {
            mostrarEstado("⚠️ Ese servicio ya está agregado a esta factura.");
            return;
        }

        const resumen = obtenerDatosItem();
        const registro = {
            servicioId,
            nombre,
            impuesto: selectorImpuesto.value,
            cantidad,
            unidad: document.getElementById("unidad-item").value,
            precioBase: base,
            precioConImpuestos: Number(precioImpuestos.value) || 0,
            precioReferencia: referencia,
            precioAplicado: resumen.precioAplicado,
            codigo,
            descuentoPorcentaje,
            descuento: resumen.descuento,
            subtotal: resumen.subtotal,
            impuestos: resumen.impuestos,
            total: resumen.total,
            observacion: document.getElementById("observacion-item").value.trim()
        };

        if (indiceEdicion === -1) items.push(registro);
        else items[indiceEdicion] = registro;

        mostrarItems();
        modalItem.close();
    });

    document.getElementById("lista-items-factura").addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;
        const indice = Number(boton.dataset.id);
        if (!Number.isInteger(indice) || !items[indice]) return;

        if (boton.dataset.accion === "editar-item-factura") {
            abrirItem(indice);
        } else if (boton.dataset.accion === "eliminar-item-factura") {
            items.splice(indice, 1);
            mostrarItems();
        }
    });

    cargarFacturas();
}


function generarId(registros) {
    const mayor = registros.reduce((maximo, registro) => {
        const numero = Number.parseInt(registro.id, 10);
        return Number.isFinite(numero) ? Math.max(maximo, numero) : maximo;
    }, 0);

    return String(mayor + 1).padStart(3, "0");
}


function fechaLocalActual() {
    const fecha = new Date();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${fecha.getFullYear()}-${mes}-${dia}`;
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
