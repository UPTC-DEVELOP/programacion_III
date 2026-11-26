(function (global) {
    "use strict";

    /* Adaptador CRUD de vehículos y normalización de campos de la API. */
    function normalizarVehiculo(vehiculo) {
        return {
            ...vehiculo,
            id: String(vehiculo.id ?? ""),
            placa: String(vehiculo.placa || "").toUpperCase(),
            modelo: vehiculo.modelo || "",
            color: vehiculo.color || "",
            propietarioId: String(vehiculo.propietarioId ?? vehiculo.propietario_id ?? ""),
            fechaIngreso: vehiculo.fechaIngreso || vehiculo.fecha_ingreso || "",
            horaIngreso: vehiculo.horaIngreso || vehiculo.hora_ingreso || ""
        };
    }

    function normalizarPayload(vehiculo) {
        return {
            placa: String(vehiculo.placa || "").trim().toUpperCase(),
            modelo: String(vehiculo.modelo || "").trim(),
            color: String(vehiculo.color || "").trim(),
            propietario_id: Number(vehiculo.propietarioId ?? vehiculo.propietario_id),
            fecha_ingreso: vehiculo.fechaIngreso || vehiculo.fecha_ingreso,
            hora_ingreso: vehiculo.horaIngreso || vehiculo.hora_ingreso
        };
    }

    async function listar() {
        const registros = await global.solicitarPanther("vehiculos");
        return (Array.isArray(registros) ? registros : [])
            .filter((item) => !item.dateDelete)
            .map(normalizarVehiculo);
    }

    async function crear(vehiculo) {
        return global.solicitarPanther("vehiculos", {
            method: "POST",
            body: JSON.stringify(normalizarPayload(vehiculo))
        });
    }

    async function actualizar(id, vehiculo) {
        return global.solicitarPanther(`vehiculos/${id}`, {
            method: "PUT",
            body: JSON.stringify(normalizarPayload(vehiculo))
        });
    }

    async function eliminar(id) {
        return global.solicitarPanther(`vehiculos/${id}`, { method: "DELETE" });
    }

    global.VehiculosAPI = Object.freeze({ listar, crear, actualizar, eliminar });
})(window);