(function (global) {
    "use strict";

    /* Adaptador CRUD de órdenes y normalización de campos de servicios. */
    function normalizarRepuestoIds(servicio) {
        const raw = servicio.repuestoIds ?? servicio.repuesto_ids ?? servicio.repuestos ?? [];
        if (Array.isArray(raw)) {
            return raw
                .map((item) => String(
                    typeof item === "object" && item !== null
                        ? item.id ?? item.repuesto_id ?? ""
                        : item
                ))
                .filter(Boolean);
        }
        if (typeof raw === "string" && raw.trim()) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return parsed.map((id) => String(id)).filter(Boolean);
                }
            } catch {
                return raw.split(",").map((id) => id.trim()).filter(Boolean);
            }
        }
        return [];
    }

    function normalizarServicio(servicio) {
        const estadoFacturacion =
            servicio.estadoFacturacion ?? servicio.estado_facturacion ?? "";
        const facturableRaw = servicio.facturable;
        const facturable = facturableRaw === undefined
            ? (estadoFacturacion ? estadoFacturacion === "Disponible" : true)
            : Boolean(Number(facturableRaw) || facturableRaw === true);
        const repuestos = Array.isArray(servicio.repuestos)
            ? servicio.repuestos.map((item) => ({
                repuesto_id: Number(item.repuesto_id ?? item.id ?? 0),
                cantidad: Number(item.cantidad ?? 1),
                precio_unitario: Number(item.precio_unitario ?? 0)
            }))
            : [];
        return {
            ...servicio,
            id: String(servicio.id ?? servicio.codigo ?? ""),
            clienteId: String(servicio.clienteId ?? servicio.cliente_id ?? ""),
            clienteNombre: servicio.clienteNombre ?? servicio.cliente_nombre ?? "",
            clienteNumeroIdentificacion:
                servicio.clienteNumeroIdentificacion ?? servicio.cliente_numero_identificacion ?? "",
            vehiculoId: String(servicio.vehiculoId ?? servicio.vehiculo_id ?? ""),
            empleadoId: String(servicio.empleadoId ?? servicio.empleado_id ?? ""),
            estado: servicio.estado || "Pendiente",
            estadoFacturacion,
            prioridad: servicio.prioridad || "Media",
            fechaInicio: servicio.fechaInicio ?? servicio.fecha_inicio ?? "",
            fechaFin: servicio.fechaFin ?? servicio.fecha_estimada_fin ?? servicio.fecha_fin ?? "",
            horas: Number(servicio.horas ?? servicio.horas_empleadas ?? 0),
            manoObra: Number(
                servicio.manoObra ?? servicio.valor_mano_obra ?? servicio.mano_obra ?? 0
            ),
            subtotalRepuestos: Number(servicio.subtotalRepuestos ?? servicio.subtotal_repuestos ?? 0),
            montoTotal: Number(servicio.montoTotal ?? servicio.monto_total ?? 0),
            repuestos,
            repuestoIds: normalizarRepuestoIds(servicio),
            descripcion: servicio.descripcion || "",
            observaciones: servicio.observaciones || "",
            facturable,
            fechaRegistro: servicio.fechaRegistro ?? servicio.fecha_registro ?? ""
        };
    }

    function normalizarPayload(servicio) {
        const repuestoIds = normalizarRepuestoIds(servicio);
        const repuestos = Array.isArray(servicio.repuestos)
            ? servicio.repuestos.map((item) => ({
                repuesto_id: Number(item.repuesto_id ?? item.id),
                cantidad: Number(item.cantidad ?? 1),
                precio_unitario: Number(item.precio_unitario ?? 0)
            }))
            : repuestoIds.map((id) => ({
                repuesto_id: Number(id),
                cantidad: 1,
                precio_unitario: 0
            }));

        const payload = {
            cliente_id: Number(servicio.clienteId ?? servicio.cliente_id),
            vehiculo_id: Number(servicio.vehiculoId ?? servicio.vehiculo_id),
            empleado_id: Number(servicio.empleadoId ?? servicio.empleado_id),
            estado: servicio.estado || "Pendiente",
            prioridad: servicio.prioridad || "Media",
            fecha_inicio: servicio.fechaInicio ?? servicio.fecha_inicio ?? "",
            fecha_estimada_fin:
                servicio.fechaFin ?? servicio.fecha_estimada_fin ?? servicio.fecha_fin ?? "",
            horas_empleadas: Number(servicio.horas ?? servicio.horas_empleadas ?? 0),
            valor_mano_obra: Number(
                servicio.manoObra ?? servicio.valor_mano_obra ?? servicio.mano_obra ?? 0
            ),
            repuestos,
            descripcion: String(servicio.descripcion || "").trim(),
            observaciones: String(servicio.observaciones || "").trim()
        };
        const estadoFacturacion = servicio.estadoFacturacion ?? servicio.estado_facturacion;
        if (estadoFacturacion) {
            payload.estado_facturacion = estadoFacturacion;
        }
        return payload;
    }

    async function listar() {
        const registros = await global.solicitarPanther("servicios");
        return (Array.isArray(registros) ? registros : [])
            .filter((item) => !item.dateDelete)
            .map(normalizarServicio);
    }

    async function crear(servicio) {
        return global.solicitarPanther("servicios", {
            method: "POST",
            body: JSON.stringify(normalizarPayload(servicio))
        });
    }

    async function actualizar(id, servicio) {
        return global.solicitarPanther(`servicios/${id}`, {
            method: "PUT",
            body: JSON.stringify(normalizarPayload(servicio))
        });
    }

    async function eliminar(id) {
        return global.solicitarPanther(`servicios/${id}`, { method: "DELETE" });
    }

    global.ServiciosAPI = Object.freeze({ listar, crear, actualizar, eliminar });
})(window);