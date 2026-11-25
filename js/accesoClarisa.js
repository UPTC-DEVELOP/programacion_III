function conectarAccesoClarisa(mostrar, dinero) {
    const $ = (id) => document.getElementById(id);

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


    let documentoPendiente = null;
    let emisionEnCurso = false;

    function abrirAccesoClarisa(documento) {
        if (emisionEnCurso || $("dialogoClarisa").open) return;
        documentoPendiente = documento;
        $("resumenEnvio").textContent = documento.prefijoDcto + " " + documento.consecutivoDcto
            + " · " + documento.cliente.nombreRazonSocial + " · " + dinero.format(Number(documento.total));
        $("mensajeClarisa").textContent = "";
        $("dialogoClarisa").showModal();
        $("claveClarisa").focus();
    }

    async function obtenerTokenClarisa(usuario, clave) {
        const control = new AbortController();
        const limite = setTimeout(() => control.abort(), CONFIG.TIEMPO_MAXIMO_MS);
        try {
            const r = await fetch("https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "omit", cache: "no-store", signal: control.signal,
                body: JSON.stringify({ usuario, contrasenia: clave })
            });
            const datos = await r.json().catch(() => null);
            const token = datos?.data?.token;
            if (!r.ok || datos?.success === false || typeof token !== "string" || !token.trim()) {
                throw new Error("Revisa los datos de acceso a Clarisa.");
            }
            return token;
        } finally {
            clearTimeout(limite);
        }
    }

    const dialogo = $("dialogoClarisa");
    const clave = $("claveClarisa");
    const enviar = $("verificarClarisa");
    const cancelar = $("cancelarClarisa");
    cancelar.addEventListener("click", () => dialogo.close());
    dialogo.addEventListener("cancel", (e) => { if (emisionEnCurso) e.preventDefault(); });
    dialogo.addEventListener("close", () => {
        clave.value = "";
        documentoPendiente = null;
    });

    $("formClarisa").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (emisionEnCurso || !documentoPendiente) return;
        emisionEnCurso = enviar.disabled = cancelar.disabled = true;
        let id;
        let etapa = "login";
        try {
            $("mensajeClarisa").textContent = "Verificando acceso a Clarisa…";
            const token = await obtenerTokenClarisa($("usuarioClarisa").value.trim(), clave.value);
            etapa = "guardar";
            $("mensajeClarisa").textContent = "Guardando factura en Panther…";
            const guardada = await pedirFactura("", documentoPendiente);
            id = guardada.id;
            const local = " La factura quedó guardada en Panther con ID " + id + ".";
            etapa = "consultar";
            const factura = await pedirFactura("/" + id);
            let resultado = factura;
            if (["guardada", "rechazada"].includes(factura.estado)) {
                etapa = "enviar";
                $("mensajeClarisa").textContent = "Enviando la factura guardada a Clarisa…";
                resultado = await pedirFactura("/" + id + "/enviar", { tokenClarisa: token });
            }
            if (resultado.estado === "enviada") {
                mostrar("Clarisa confirmó la recepción de tu factura." + local, "ok");
            } else if (resultado.estado === "rechazada") {
                mostrar("Clarisa rechazó la factura. " + resultado.detalle + local, "error");
            } else {
                mostrar("El envío está pendiente de verificación." + local, "error");
            }
            dialogo.close();
        } catch (error) {
            if (etapa === "login") {
                $("mensajeClarisa").textContent = error.name === "AbortError"
                    ? "Clarisa tardó demasiado en responder." : "No se pudo validar el acceso a Clarisa. Revisa la conexión y las credenciales.";
                clave.focus();
            } else {
                const local = id ? " La factura quedó guardada en Panther con ID " + id + "." : "";
                const aviso = etapa === "guardar" ? "Panther no confirmó el guardado. "
                    : etapa === "consultar" ? "No se pudo consultar la factura guardada. "
                    : "No se pudo confirmar el envío a Clarisa. Revisa el estado antes de reintentar. ";
                mostrar(aviso + error.message + local, "error");
                dialogo.close();
            }
        } finally {
            clave.value = "";
            emisionEnCurso = enviar.disabled = cancelar.disabled = false;
        }
    });
    return abrirAccesoClarisa;
}
