(function (global) {
    "use strict";

    /* Adaptador CRUD de repuestos; convierte entre campos UI y campos SQL. */
    function normalizarRepuesto(repuesto) {
        const referencia = repuesto.referencia ?? repuesto.referencias ?? repuesto.codigo ?? "";
        const precio = Number(
            repuesto.precio ?? repuesto.precioUnitario ?? repuesto.precio_unitario ?? repuesto.valor ?? 0
        );
        const stock = Number(repuesto.stock ?? repuesto.stockActual ?? repuesto.stock_actual ?? 0);
        const stockMinimo = Number(repuesto.stockMinimo ?? repuesto.stock_minimo ?? 0);
        const stockMaximo = Number(repuesto.stockMaximo ?? repuesto.stock_maximo ?? 0);

        return {
            ...repuesto,
            id: String(repuesto.id ?? ""),
            referencia,
            referencias: referencia,
            codigo: referencia,
            descripcion: repuesto.descripcion || "",
            marca: repuesto.marca || "",
            precio,
            precioUnitario: precio,
            valor: precio,
            stock,
            stockMinimo,
            stockMaximo
        };
    }

    function normalizarPayload(repuesto) {
        const referencia = String(
            repuesto.referencia ?? repuesto.referencias ?? repuesto.codigo ?? ""
        ).trim();
        const precio = Number(
            repuesto.precio ?? repuesto.precioUnitario ?? repuesto.precio_unitario ?? repuesto.valor ?? 0
        );
        const stock = Number(repuesto.stock ?? repuesto.stockActual ?? repuesto.stock_actual ?? 0);
        const stockMinimo = Number(repuesto.stockMinimo ?? repuesto.stock_minimo ?? 0);
        const stockMaximo = Number(repuesto.stockMaximo ?? repuesto.stock_maximo ?? 0);

        return {
            referencia,
            referencias: referencia,
            codigo: referencia,
            descripcion: String(repuesto.descripcion || "").trim(),
            marca: String(repuesto.marca || "").trim(),
            precio_unitario: precio,
            stock_actual: stock,
            stock_minimo: stockMinimo,
            stock_maximo: stockMaximo
        };
    }

    async function listar() {
        const registros = await global.solicitarPanther("repuestos");
        return (Array.isArray(registros) ? registros : [])
            .filter((item) => !item.dateDelete)
            .map(normalizarRepuesto);
    }

    async function crear(repuesto) {
        return global.solicitarPanther("repuestos", {
            method: "POST",
            body: JSON.stringify(normalizarPayload(repuesto))
        });
    }

    async function actualizar(id, repuesto) {
        return global.solicitarPanther(`repuestos/${id}`, {
            method: "PUT",
            body: JSON.stringify(normalizarPayload(repuesto))
        });
    }

    async function eliminar(id) {
        return global.solicitarPanther(`repuestos/${id}`, { method: "DELETE" });
    }

    global.RepuestosAPI = Object.freeze({ listar, crear, actualizar, eliminar });
})(window);

