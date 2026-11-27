(function (global) {
    "use strict";

    async function listar() {
        const facturas = await global.solicitarPanther("facturas");
        return Array.isArray(facturas) ? facturas : [];
    }

    async function crear(factura, accion) {
        return global.solicitarPanther("facturas", {
            method: "POST",
            body: JSON.stringify({ ...factura, accion })
        });
    }

    async function enviar(id) {
        return global.solicitarPanther(`facturas/${encodeURIComponent(id)}/enviar`, {
            method: "POST",
            body: JSON.stringify({})
        });
    }

    global.FacturasAPI = Object.freeze({ listar, crear, enviar });
})(window);
