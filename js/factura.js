(() => {
    Sesion.exigir();

    const $ = (id) => document.getElementById(id);
    const contItems = $("items");
    const dinero = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 });
    const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

    $("usuarioSesion").textContent = Sesion.usuario() || "";
    $("btnSalir").addEventListener("click", () => Sesion.cerrar());
    $("emisor").textContent = "Emisor: NIT 12345 · Prefijo SETP · entorno de pruebas";

    // Consecutivo y fecha
    function consecutivoSugerido() {
        return String(990000001);
    }

    function hoy() {
        const d = new Date();
        return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }

    $("consecutivo").value = consecutivoSugerido();
    $("vencimiento").value = hoy();

    // Items
    function agregarItem(tipo) {
        const fila = document.createElement("div");
        fila.className = "item";
        fila.setAttribute("role", "group");
        fila.innerHTML = // plantilla fija, sin datos del usuario
            '<select class="i-tipo" aria-label="Tipo de ítem"><option>Repuesto</option><option>Mano de obra</option></select>' +
            '<input class="i-codigo" placeholder="Referencia" maxlength="15" aria-label="Referencia">' +
            '<input class="i-nombre" placeholder="Descripción y marca" maxlength="200" aria-label="Descripción y marca">' +
            '<input class="i-cantidad" type="number" min="0.01" step="any" value="1" aria-label="Cantidad">' +
            '<input class="i-precio" type="number" min="1" step="any" placeholder="Precio" aria-label="Precio unitario">' +
            '<output class="i-subtotal">$ 0</output>' +
            '<button type="button" class="i-quitar" aria-label="Quitar ítem">✕</button>';
        fila.querySelector(".i-tipo").value = tipo || "Repuesto";
        contItems.appendChild(fila);
        ajustarTipo(fila);
    }
    function ajustarTipo(fila) {
        const mo = fila.querySelector(".i-tipo").value === "Mano de obra";
        fila.querySelector(".i-cantidad").setAttribute("aria-label", mo ? "Horas empleadas" : "Cantidad");
        fila.querySelector(".i-precio").placeholder = mo ? "Valor por hora" : "Precio";
        const cod = fila.querySelector(".i-codigo"), nom = fila.querySelector(".i-nombre");
        if (mo && !cod.value) cod.value = "MO";
        if (mo && !nom.value) nom.value = "Mano de obra";
    }
    function leerItems() {
        return Array.from(contItems.querySelectorAll(".item")).map((f) => ({
            fila: f,
            tipo: f.querySelector(".i-tipo").value,
            codigo: f.querySelector(".i-codigo").value.trim(),
            nombre: f.querySelector(".i-nombre").value.trim(),
            cantidad: Number(f.querySelector(".i-cantidad").value) || 0,
            precio: Number(f.querySelector(".i-precio").value) || 0
        }));
    }

    // Calculos
    function itemsFinales() {
        const items = leerItems();
        const base = items.reduce((s, i) => s + redondear(i.cantidad * i.precio), 0);
        const pct = Number($("utilidad").value) || 0;
        if (pct > 0 && base > 0) {
            items.push({ tipo: "Utilidad", codigo: "UTIL", nombre: "Utilidad estimada del servicio", cantidad: 1, precio: redondear(base * pct / 100) });
        }
        return items;
    }
    function totales(items) {
        let base = 0, iva = 0;
        items.forEach((i) => {
            const b = redondear(i.cantidad * i.precio);
            base += b;
            iva += redondear(b * 19 / 100);
        });
        base = redondear(base); iva = redondear(iva);
        return { base: base, iva: iva, total: redondear(base + iva) };
    }
    function actualizar() {
        leerItems().forEach((i) => { i.fila.querySelector(".i-subtotal").textContent = dinero.format(redondear(i.cantidad * i.precio)); });
        const t = totales(itemsFinales());
        $("resBase").textContent = dinero.format(t.base);
        $("resIva").textContent = dinero.format(t.iva);
        $("resTotal").textContent = dinero.format(t.total);
    }

    // Validacion
    let campoFallido = null;
    function fallo(campo, texto) {
        campoFallido = typeof campo === "string" ? $(campo) : campo;
        return texto;
    }
    function validar(items, t) {
        campoFallido = null;
        if (!/^\d{1,9}$/.test($("consecutivo").value.trim())) return fallo("consecutivo", "El consecutivo debe tener entre 1 y 9 dígitos.");
        if (!$("vencimiento").value) return fallo("vencimiento", "Indica la fecha de vencimiento.");
        if (document.querySelectorAll('input[name="medio"]:checked').length === 0) return fallo(document.querySelector('input[name="medio"]'), "Selecciona al menos un medio de pago.");
        if (!/^\d{3,13}$/.test($("numId").value.trim())) return fallo("numId", "El documento del cliente debe tener entre 3 y 13 dígitos.");
        const nombre = $("nombre").value.trim();
        if (nombre.length < 5 || nombre.length > 255) return fallo("nombre", "El nombre del cliente debe tener entre 5 y 255 caracteres.");
        const tel = $("telefono").value.trim();
        if (tel && !/^\d{1,15}$/.test(tel)) return fallo("telefono", "El teléfono solo admite números (máximo 15).");
        if (items.length === 0) return fallo("btnAgregarItem", "Agrega al menos un repuesto o servicio.");
        for (const [n, i] of items.entries()) {
            const c = (sel) => (i.fila ? i.fila.querySelector(sel) : null);
            const p = "Ítem " + (n + 1) + ": ";
            if (i.codigo.length < 1 || i.codigo.length > 15) return fallo(c(".i-codigo"), p + "la referencia debe tener entre 1 y 15 caracteres.");
            if (i.nombre.length < 4) return fallo(c(".i-nombre"), p + "la descripción debe tener al menos 4 caracteres.");
            if (i.cantidad <= 0) return fallo(c(".i-cantidad"), p + "la cantidad debe ser mayor que 0.");
            if (i.precio <= 0) return fallo(c(".i-precio"), p + "el precio debe ser mayor que 0.");
        }
        if (t.total <= 0) return fallo("btnAgregarItem", "El total debe ser mayor que 0.");
        return null;
    }

    function mostrar(texto, tipo) {
        $("mensajeFactura").textContent = texto;
        $("mensajeFactura").className = "mensaje " + (tipo || "");
    }
    // JSON para Clarisa utiliza la estructura de la guia de factura
    function construirJson(items, t) {
        const ingreso = $("ingreso").value.replace("T", " ");
        const observacion = [
            $("placa").value.trim() && "Placa: " + $("placa").value.trim(),
            $("modelo").value.trim() && "Modelo: " + $("modelo").value.trim(),
            $("color").value.trim() && "Color: " + $("color").value.trim(),
            ingreso && "Ingreso: " + ingreso,
            $("empleado").value.trim() && "Empleado: " + $("empleado").value.trim()
        ].filter(Boolean).join(" | ");

        const cliente = {
            nombreRazonSocial: $("nombre").value.trim(),
            tipoIdentificacion: $("tipoId").value,
            numIdentificacion: $("numId").value.trim(),
            naturaleza: $("naturaleza").value,
            respFiscales: $("respFiscales").value,
            respTributarias: $("respTributarias").value
        };
        if ($("direccion").value.trim()) cliente.direccion = $("direccion").value.trim();
        if ($("telefono").value.trim()) cliente.telefono = $("telefono").value.trim();

        const factura = {
            nit: "12345",
            numeroResolucion: "18760000001",
            consecutivoDcto: $("consecutivo").value.trim(),
            prefijoDcto: "SETP",
            fechaVencimiento: $("vencimiento").value,
            formaPago: $("formaPago").value,
            mediosPago: Array.from(document.querySelectorAll('input[name="medio"]:checked')).map((c) => c.value),
            total: Number.isInteger(t.total) ? t.total.toFixed(1) : String(t.total),
            cliente: cliente,
            items: items.map((i) => ({
                codigo: i.codigo,
                nombreItem: i.nombre,
                precioBaseUnitario: i.precio,
                cantidad: i.cantidad,
                observacion: i.tipo,
                unidad: "94",
                impuestos: [{ tipo: "IVA", claseImpuesto: "PO", tarifaTributo: 19 }]
            }))
        };
        if (observacion) factura.observacion = observacion;
        return factura;
    }

    // Eventos
    $("btnAgregarItem").addEventListener("click", () => { agregarItem("Repuesto"); });
    contItems.addEventListener("input", actualizar);
    contItems.addEventListener("change", (e) => {
        if (e.target.classList.contains("i-tipo")) ajustarTipo(e.target.closest(".item"));
        actualizar();
    });
    contItems.addEventListener("click", (e) => {
        if (e.target.classList.contains("i-quitar")) { e.target.closest(".item").remove(); actualizar(); }
    });
    $("utilidad").addEventListener("input", actualizar);

    $("formFactura").addEventListener("submit", (event) => {
        event.preventDefault();
        mostrar("");
        document.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));

        const items = itemsFinales();
        const t = totales(items);
        const error = validar(items, t);
        if (error) {
            mostrar(error, "error");
            if (campoFallido) { campoFallido.setAttribute("aria-invalid", "true"); campoFallido.focus();
                if (campoFallido.setCustomValidity) {
                    campoFallido.setCustomValidity(error);
                    campoFallido.reportValidity();
                    campoFallido.setCustomValidity("");
                } }
            return;
        }

        if (!Sesion.activa()) {
            Sesion.exigir();
            return;
        }
        try {
            abrirAccesoClarisa(construirJson(items, t));
        } catch (error) {
            mostrar("No se pudo abrir el acceso a Clarisa. " + error.message, "error");
        }
    });

    // Limpiar
    $("btnLimpiar").addEventListener("click", () => {
        // Reiniciar el formulario HTML
        $("formFactura").reset();
    
        // Borrar los items generados dinámicamente
        contItems.innerHTML = "";
    
        // Volver a crear los items por defecto
        agregarItem("Repuesto");
        agregarItem("Mano de obra");
    
        // Restablecer el consecutivo y la fecha
        $("consecutivo").value = consecutivoSugerido();
        $("vencimiento").value = hoy();
    
        // Ocultar resultados y mensajes
        mostrar("");
    
        // Actualizar los totales a 0
        actualizar();
    
        // Quitar los bordes rojos de error
        document.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
    });

    agregarItem("Repuesto");
    agregarItem("Mano de obra");
    actualizar();

    const abrirAccesoClarisa = conectarAccesoClarisa(mostrar, dinero);
    $("btnEnviar").disabled = false;
    mostrar("");
})();
