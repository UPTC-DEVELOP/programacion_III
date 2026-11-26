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
let vencimientoBloqueo = 0;
function bloqueoRestante() {
    try { return Math.max(0, Number(localStorage.getItem("ag_panther_bloqueo") || vencimientoBloqueo) - Date.now()); } catch (e) { return Math.max(0, vencimientoBloqueo - Date.now()); }
}
function recordarBloqueo(segundos) {
    vencimientoBloqueo = Date.now() + segundos * 1000;
    try {
        localStorage.setItem("ag_panther_bloqueo", String(vencimientoBloqueo));
    } catch (error) {
        // El contador también funciona en memoria.
    }
}
function limpiarFallos() {
    vencimientoBloqueo = 0;
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

        if (respuesta.status === 429) {
            const segundos = Number(datos?.data?.segundos || respuesta.headers.get("Retry-After")) || 60;
            recordarBloqueo(segundos);
            throw new Error("Espera antes de volver a ingresar.");
        }
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
            mostrarMensaje("Alcanzaste el límite de intentos. Espera para volver a ingresar.", "error");
        }
        mostrandoBloqueo = true;
        btnIngresar.disabled = true;
        btnIngresar.textContent = "Reintentar en " + Math.ceil(restante / 1000) + " s";
        siguienteActualizacion = setTimeout(actualizarBloqueo, restante % 1000 || 1000);
    } else if (mostrandoBloqueo) {
        mostrandoBloqueo = false;
        btnIngresar.disabled = false;
        btnIngresar.textContent = "Ingresar";
        mostrarMensaje("Ya puedes volver a intentarlo.");
    }
}

window.addEventListener("pageshow", actualizarBloqueo);
window.addEventListener("storage", (evento) => {
    if (evento.key === "ag_panther_bloqueo" || evento.key === null) actualizarBloqueo();
});
actualizarBloqueo();
