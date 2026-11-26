(function (global) {
    "use strict";

    function normalizarCliente(cliente) {
        return {
            ...cliente,
            tipoIdentificacion: cliente.tipoIdentificacion || cliente.tipo_identificacion || "",
            numeroIdentificacion: cliente.numeroIdentificacion || cliente.numero_identificacion || ""
        };
    }

    function normalizarPayload(cliente) {
        return {
            nombres: cliente.nombres,
            apellidos: cliente.apellidos,
            tipo_identificacion: cliente.tipoIdentificacion || cliente.tipo_identificacion,
            numero_identificacion: cliente.numeroIdentificacion || cliente.numero_identificacion,
            correo: cliente.correo,
            direccion: cliente.direccion,
            telefono: cliente.telefono
        };
    }

    async function listar() {
        const registros = await global.solicitarPanther("Clientes");
        return (Array.isArray(registros) ? registros : []).map(normalizarCliente);
    }

    async function crear(cliente) {
        return global.solicitarPanther("Clientes", {
            method: "POST",
            body: JSON.stringify(normalizarPayload(cliente))
        });
    }

    async function actualizar(id, cliente) {
        return global.solicitarPanther(`Clientes/${id}`, {
            method: "PUT",
            body: JSON.stringify(normalizarPayload(cliente))
        });
    }

    async function eliminar(id) {
        return global.solicitarPanther(`Clientes/${id}`, { method: "DELETE" });
    }

    global.ClientesAPI = Object.freeze({ listar, crear, actualizar, eliminar });
})(window);
