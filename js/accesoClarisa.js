// Solicitudes internas a Panther. La sesión de AutoGestión autoriza cada operación.
async function pedirFactura(ruta = "", cuerpo) {
    if (!Sesion.activa()) {
        Sesion.exigir();
        throw new Error("Inicia sesión en AutoGestión.");
    }
    const opciones = { headers: { authorization: Sesion.token(), Accept: "application/json" }, cache: "no-store" };
    if (cuerpo !== undefined) {
        opciones.method = "POST";
        opciones.headers["Content-Type"] = "application/json";
        opciones.body = JSON.stringify(cuerpo);
    }
    const respuesta = await fetch(CONFIG.API_BASE + "facturas" + ruta, opciones);
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok || datos?.state !== "OK") {
        throw new Error(typeof datos?.data === "string" ? datos.data : "Panther no confirmó la operación. Revisa la ruta facturas y la tabla factura_taller.");
    }
    return datos.data;
}

document.addEventListener("DOMContentLoaded", () => {
    const campo = (id) => document.getElementById(id);
    const lista = campo("facturasGuardadas");
    const dialogo = campo("dialogoClarisa");
    const estado = campo("estadoEnvio");
    const enviar = campo("abrirEnvio");
    const verificar = campo("verificarClarisa");
    const cancelar = campo("cancelarClarisa");
    const clave = campo("claveClarisa");
    let facturaElegida;
    let ocupado = false;
    let versionLista = 0;

    async function cargar(id) {
        const version = ++versionLista;
        enviar.disabled = true;
        try {
            const filas = await pedirFactura();
            if (version !== versionLista) return;
            lista.replaceChildren(new Option("Selecciona una factura", ""));
            for (const f of filas) {
                lista.add(new Option(f.prefijo + " " + f.consecutivo + " · " + f.estado, f.id));
            }
            if (id) lista.value = String(id);
            enviar.disabled = !lista.value;
        } catch (e) {
            if (version === versionLista) estado.textContent = e.message;
        }
    }

    document.addEventListener("facturaGuardada", (e) => {
        estado.textContent = "Factura guardada en Panther con ID " + e.detail + ".";
        cargar(e.detail);
    });
    lista.addEventListener("change", () => {
        estado.textContent = "";
        enviar.disabled = !lista.value;
    });
    enviar.addEventListener("click", async () => {
        if (!lista.value || ocupado) return;
        ocupado = true;
        lista.disabled = enviar.disabled = true;
        try {
            const f = await pedirFactura("/" + lista.value);
            const d = f.documento;
            if (!["guardada", "rechazada"].includes(f.estado)) {
                estado.textContent = f.estado + ". " + f.detalle;
                return;
            }
            facturaElegida = f.id;

            const totalFormateado = Number(d.total).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });

            campo("resumenEnvio").textContent =
            `${d.prefijoDcto} ${d.consecutivoDcto} · ${d.cliente.nombreRazonSocial} · ${totalFormateado}`;            
            campo("mensajeClarisa").textContent = "";
            dialogo.showModal();
            clave.focus();
        } catch (e) {
            estado.textContent = e.message;
        } finally {
            ocupado = lista.disabled = enviar.disabled = false;
        }
    });
    cancelar.addEventListener("click", () => dialogo.close());
    dialogo.addEventListener("cancel", (e) => { if (ocupado) e.preventDefault(); });
    dialogo.addEventListener("close", () => { clave.value = ""; });
    campo("formClarisa").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (ocupado) return;
        ocupado = verificar.disabled = cancelar.disabled = true;
        const mensaje = campo("mensajeClarisa");
        mensaje.textContent = "Validando acceso a Clarisa…";
        const control = new AbortController();
        const limite = setTimeout(() => control.abort(), CONFIG.TIEMPO_MAXIMO_MS);
        let envioIniciado = false;
        try {
            const respuesta = await fetch("https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/", {
                method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
                body: JSON.stringify({ usuario: campo("usuarioClarisa").value.trim(), contrasenia: clave.value }),
                signal: control.signal
            });
            const datos = await respuesta.json();
            const token = datos?.data?.token;
            if (!respuesta.ok || datos?.success === false || typeof token !== "string" || !token.trim()) {
                throw new Error("Clarisa no confirmó el acceso. Revisa tus credenciales.");
            }
            mensaje.textContent = "Enviando la factura guardada…";
            envioIniciado = true;
            const r = await pedirFactura("/" + facturaElegida + "/enviar", {tokenClarisa: token});
            estado.textContent = "Factura #" + r.id + " · " + r.estado + ". " + r.detalle;
            dialogo.close();
            await cargar(facturaElegida);
        } catch (error) {
            if (envioIniciado) {
                dialogo.close();
                estado.textContent = "No se confirmó el envío. Consulta el estado antes de reintentar. " + error.message;
                await cargar(facturaElegida);
            } else {
                mensaje.textContent = error.name === "AbortError" ? "Clarisa tardó demasiado en responder." : error.message;
            }
        } finally {
            clearTimeout(limite);
            clave.value = "";
            ocupado = verificar.disabled = cancelar.disabled = false;
        }
    });
    cargar();
});
