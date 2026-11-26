(function (global) {
    "use strict";

    global.PANTHER_API_URL = "http://localhost/panther-api";

    async function solicitarPanther(recurso, opciones = {}) {
        const sesion = global.obtenerSesion?.() || {};
        const token =
            sesion.tokens?.panther ||
            global.obtenerTokenValido?.() ||
            localStorage.getItem("pantherToken") ||
            "";

        if (!token) {
            throw new Error("No hay token de Panther activo. Inicia sesión nuevamente.");
        }

        const headers = {
            Authorization: token,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(opciones.headers || {})
        };

        const respuesta = await fetch(`${global.PANTHER_API_URL}/${recurso}`, {
            ...opciones,
            headers
        });

        const texto = await respuesta.text();
        let json = {};
        if (texto) {
            try {
                json = JSON.parse(texto);
            } catch {
                json = { message: texto };
            }
        }

        if (!respuesta.ok || (json.state && !["OK", "CREATE"].includes(json.state))) {
            const detalle = json.message || json.data || `Error HTTP ${respuesta.status}`;
            throw new Error(typeof detalle === "string" ? detalle : JSON.stringify(detalle));
        }

        return json.data !== undefined ? json.data : json;
    }

    global.solicitarPanther = solicitarPanther;
})(window);
