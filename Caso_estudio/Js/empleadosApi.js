(function (global) {
    "use strict";

    /* Adaptador CRUD de empleados y filtros de disponibilidad. */
    const SLUGS_ESTADO = {
        "disponible": "disponible",
        "ocupado": "ocupado",
        "no disponible": "no-disponible",
        "no-disponible": "no-disponible",
        "no_disponible": "no-disponible"
    };

    function normalizarEmpleado(empleado) {
        return {
            ...empleado,
            id: String(empleado.id ?? ""),
            nombres: empleado.nombres || "",
            apellidos: empleado.apellidos || "",
            tipoIdentificacion: empleado.tipoIdentificacion || empleado.tipo_identificacion || "",
            identificacion: empleado.identificacion || empleado.numero_identificacion || "",
            telefono: empleado.telefono || "",
            direccion: empleado.direccion || "",
            cargo: empleado.cargo || "",
            especialidad: empleado.especialidad || "",
            estado: empleado.estado || "Disponible"
        };
    }

    function normalizarPayload(empleado) {
        return {
            nombres: String(empleado.nombres || "").trim(),
            apellidos: String(empleado.apellidos || "").trim(),
            tipo_identificacion: String(empleado.tipoIdentificacion ?? empleado.tipo_identificacion ?? "").trim(),
            identificacion: String(empleado.identificacion ?? empleado.numero_identificacion ?? "").trim(),
            telefono: String(empleado.telefono || "").trim(),
            direccion: String(empleado.direccion || "").trim(),
            cargo: String(empleado.cargo || "").trim(),
            especialidad: String(empleado.especialidad || "").trim(),
            estado: empleado.estado || "Disponible"
        };
    }

    function resolverSlugEstado(filtro) {
        if (!filtro || filtro.toLowerCase() === "todos") return "";
        const clave = filtro.trim().toLowerCase();
        return SLUGS_ESTADO[clave] || encodeURIComponent(clave.replace(/\s+/g, "-"));
    }

    async function listar() {
        const registros = await global.solicitarPanther("empleados");
        return (Array.isArray(registros) ? registros : [])
            .filter((item) => !item.dateDelete)
            .map(normalizarEmpleado);
    }

    async function listarPorEstado(estado) {
        const slug = resolverSlugEstado(estado);
        if (!slug) return listar();

        const registros = await global.solicitarPanther(`empleados/${slug}`);
        return (Array.isArray(registros) ? registros : [])
            .filter((item) => !item.dateDelete)
            .map(normalizarEmpleado);
    }

    async function crear(empleado) {
        return global.solicitarPanther("empleados", {
            method: "POST",
            body: JSON.stringify(normalizarPayload(empleado))
        });
    }

    async function actualizar(id, empleado) {
        return global.solicitarPanther(`empleados/${id}`, {
            method: "PUT",
            body: JSON.stringify(normalizarPayload(empleado))
        });
    }

    async function eliminar(id) {
        return global.solicitarPanther(`empleados/${id}`, { method: "DELETE" });
    }

    global.EmpleadosAPI = Object.freeze({
        listar,
        listarPorEstado,
        crear,
        actualizar,
        eliminar
    });
})(window);