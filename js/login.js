const $ = (id) => document.getElementById(id);
const inputUsuario = $("usuario");
const inputClave = $("clave");
const btnIngresar = $("btnIngresar");
const btnVerClave = $("verClave");
const mensaje = $("mensajeLogin");

// Si ya hay una sesion vigente no se vuelve a pedir el login
if (Sesion.activa()) {
    window.location.replace(CONFIG.PAGINA_MODULOS);
}

$("formLogin").addEventListener("submit", iniciarSesion);
btnVerClave.addEventListener("click", alternarClave);

function alternarClave() {
    const oculta = inputClave.type === "password";
    inputClave.type = oculta ? "text" : "password";
    btnVerClave.textContent = oculta ? "Ocultar" : "Ver";
    btnVerClave.setAttribute("aria-label", oculta ? "Ocultar contraseña" : "Mostrar contraseña");
}

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje " + (tipo || "");
}
function marcarInvalidos(si) {
    [inputUsuario, inputClave].forEach((c) => (si ? c.setAttribute("aria-invalid", "true") : c.removeAttribute("aria-invalid")));
}

// Bloqueo por intentos fallidos
function bloqueoRestante() {
    try { return Math.max(0, Number(localStorage.getItem("ag_panther_bloqueo") || 0) - Date.now()); } catch (e) { return 0; }
}
function sumarFallo() {
    try {
        const n = Number(localStorage.getItem("ag_panther_fallos") || 0) + 1;
        if (n >= CONFIG.INTENTOS_MAX_LOGIN) {
            localStorage.setItem("ag_panther_bloqueo", String(Date.now() + CONFIG.BLOQUEO_MS));
            localStorage.setItem("ag_panther_fallos", "0");
        } else {
            localStorage.setItem("ag_panther_fallos", String(n));
        }
    } catch (e) { }
}
function limpiarFallos() {
    try { localStorage.removeItem("ag_panther_fallos"); localStorage.removeItem("ag_panther_bloqueo"); } catch (e) { }
}

async function iniciarSesion(event) {
    event.preventDefault();
    marcarInvalidos(false);

    if (bloqueoRestante() > 0) {
    actualizarBloqueo();
    return;
    }

    if (btnIngresar.disabled) return;

    const usuario = inputUsuario.value.trim();
    const clave = inputClave.value;
    if (!usuario || !clave) {
        mostrarMensaje("Escribe tu usuario y tu contraseña.", "error");
        marcarInvalidos(true);
        (usuario ? inputClave : inputUsuario).focus();
        return;
    }

    btnIngresar.disabled = true;
    btnIngresar.textContent = "Ingresando...";
    mostrarMensaje("");
    
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), CONFIG.TIEMPO_MAXIMO_MS);

    try {
        const respuesta = await fetch(CONFIG.API_BASE + "useraction/login", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ user: usuario, password: clave }),
            signal: controlador.signal
        });

        // Apache puede devolver una página de error
        let datos = null;
        try { datos = await respuesta.json(); } catch (e) { }

        if (respuesta.status === 401 || respuesta.status === 403) {
            const e = new Error("Usuario o contraseña incorrectos.");
            e.credenciales = true;
            throw e;
        }
        if (!respuesta.ok) {
            throw new Error(Util.mensajeHttp(respuesta.status));
        }
        if (datos?.state !== "OK" || datos.code !== 200) {
            throw new Error("Respuesta de Panther inesperada. Revisa la ruta de la API.");
        }
        const token = datos.data?.keyAPI;
        if (typeof token !== "string" || !token.trim()) {
            throw new Error("El servidor no devolvió un token.");
        }

        Sesion.guardar(token, datos.data.user || usuario);
        limpiarFallos();
        Util.registrar("login_ok", usuario);
        mostrarMensaje("Ingreso exitoso. Redirigiendo...", "ok");
        window.location.href = CONFIG.PAGINA_MODULOS;

    } catch (error) {
        if (error.credenciales) {
            sumarFallo();
            marcarInvalidos(true);
        }
        if (error.name === "AbortError") {
            mostrarMensaje("El servidor tardó demasiado en responder. Intenta de nuevo.", "error");
        } else if (error instanceof TypeError) {
            // fetch falla con TypeError por red caida
            mostrarMensaje("No se pudo conectar con el servicio de autenticación. Revisa tu conexión.", "error");
            console.error("Posible CORS o red:", error);
        } else {
            mostrarMensaje(error.message, "error");
        }
        Util.registrar("login_fallido", usuario);
        inputClave.value = ""; // no se deja la contraseña en el formulario
        inputClave.focus();
        btnIngresar.disabled = false;
        btnIngresar.textContent = "Ingresar";
        actualizarBloqueo();
    } finally {
        clearTimeout(temporizador);
    }
}

let siguienteActualizacion;
let mostrandoBloqueo = false;

function actualizarBloqueo() {
    clearTimeout(siguienteActualizacion);

    const restante = bloqueoRestante();

    if (restante > 0) {
        if (!mostrandoBloqueo) {
            mostrarMensaje(
                "Alcanzaste el límite de intentos. Espera para volver a ingresar.",
                "error"
            );
        }

        mostrandoBloqueo = true;
        btnIngresar.disabled = true;

        const segundos = Math.ceil(restante / 1000);
        btnIngresar.textContent = "Reintentar en " + segundos + " s";

        // Actualiza el botón cuando cambie el segundo que se muestra.
        const siguienteSegundo = restante % 1000 || 1000;
        siguienteActualizacion = setTimeout(actualizarBloqueo, siguienteSegundo);
    } else if (mostrandoBloqueo) {
        mostrandoBloqueo = false;
        btnIngresar.disabled = false;
        btnIngresar.textContent = "Ingresar";
        mostrarMensaje("Ya puedes volver a intentarlo.");
    }
}

// Recupera el tiempo restante al recargar o volver a la página.
window.addEventListener("pageshow", actualizarBloqueo);

// Mantiene el contador al día si el bloqueo cambia en otra pestaña.
window.addEventListener("storage", (evento) => {
    if (evento.key === "ag_panther_bloqueo" || evento.key === null) {
        actualizarBloqueo();
    }
});

actualizarBloqueo();
