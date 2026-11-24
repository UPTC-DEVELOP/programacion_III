// Utilidades compartidas sin datos sensibles
const Util = {
    mensajeHttp(status) {
        const m = {
            400: "La solicitud no es válida. Revisa los datos enviados.",
            401: "No autorizado. Revisa tus credenciales o vuelve a iniciar sesión.",
            403: "No tienes permiso para realizar esta acción.",
            404: "No se encontró el servicio solicitado.",
            408: "La solicitud tardó demasiado en procesarse.",
            429: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
            500: "Error interno del servidor. Intenta más tarde.",
            502: "El servidor no respondió correctamente. Intenta más tarde.",
            503: "El servicio no está disponible por el momento."
        };
        return m[status] || ("El servidor respondió con el código HTTP " + status + ".");
    },
    // Registro de accesos y envios guarda los ultimos 30
    registrar(evento, detalle) {
        try {
            const lista = JSON.parse(localStorage.getItem("ag_registro") || "[]");
            lista.push({ fecha: new Date().toISOString(), evento: evento, detalle: detalle || "" });
            localStorage.setItem("ag_registro", JSON.stringify(lista.slice(-30)));
        } catch (e) { }
    }
};
