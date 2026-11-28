const resultado = document.getElementById("resultado");
const permisosFormulario = {
    admin: ["abrir", "asignacion", "horas", "estado"],
    recepcion: ["abrir"],
    jefe_taller: ["asignacion", "estado"],
    mecanico: ["horas", "estado"]
};

function asignarIdEnFormularios(idOrden) {
    for (const formId of ["asignacion", "horas", "estado"]) {
        const form = document.getElementById(formId);
        if (form && form.elements.id) {
            form.elements.id.value = idOrden;
        }
    }
}

function renderizarMisOrdenesMecanico(lista) {
    const main = document.querySelector("main.contenedor") || document.body;
    let seccion = document.getElementById("mis-ordenes-mecanico");
    if (!seccion) {
        seccion = document.createElement("section");
        seccion.id = "mis-ordenes-mecanico";
        seccion.style.marginTop = "20px";
        main.appendChild(seccion);
    }

    const ordenes = Array.isArray(lista) ? lista : (lista ? [lista] : []);
    if (!ordenes.length) {
        seccion.innerHTML = "<h2>Mis órdenes asignadas</h2><p>No tienes órdenes asignadas en este momento.</p>";
        return;
    }

    const filas = ordenes.map((o) => {
        const id = o.id ?? "";
        const vehiculo = o.placa || (o.vehiculo_id ? `Vehículo #${o.vehiculo_id}` : "-");
        const diagnostico = o.diagnostico || "-";
        const estado = o.estado || "-";
        const horas = o.horas_trabajadas ?? 0;
        return `
            <tr>
                <td>#${id}</td>
                <td>${vehiculo}</td>
                <td>${diagnostico}</td>
                <td><strong>${estado}</strong></td>
                <td>${horas} h</td>
                <td><button type="button" class="btn btn-secundario" data-orden-id="${id}">Seleccionar</button></td>
            </tr>
        `;
    }).join("");

    seccion.innerHTML = `
        <h2>Mis órdenes asignadas</h2>
        <table class="tabla-crud" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Vehículo</th>
                    <th>Diagnóstico</th>
                    <th>Estado</th>
                    <th>Horas</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>
    `;

    seccion.querySelectorAll("[data-orden-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const idSel = btn.getAttribute("data-orden-id");
            asignarIdEnFormularios(idSel);
            resultado.textContent = `Orden #${idSel} seleccionada.`;
        });
    });
}

async function iniciarOrdenes() {
    const perfil = await catalogoApi("perfil");
    const rol = String(perfil?.rol || "").trim().toLowerCase();
    const acciones = permisosFormulario[rol] || [];

    if (!acciones.length) {
        resultado.textContent = "Tu rol no tiene operaciones de órdenes.";
    }

    for (const accion of acciones) {
        const form = document.getElementById(accion);
        if (!form) continue;
        form.hidden = false;
        form.onsubmit = async evento => {
            evento.preventDefault();
            const boton = form.querySelector("button");
            boton.disabled = true;
            try {
                const datos = Object.fromEntries(new FormData(form));
                let ruta = "ordenes";
                let metodo = "POST";
                if (accion === "abrir") {
                    const opcion = form.elements.vehiculo.selectedOptions[0];
                    datos.vehiculo_id = datos.vehiculo;
                    datos.cliente_id = opcion.dataset.cliente;
                    delete datos.vehiculo;
                } else {
                    ruta += "/" + encodeURIComponent(datos.id) + "/" + accion;
                    delete datos.id;
                    metodo = "PUT";
                }
                const respuesta = await catalogoApi(ruta, metodo, datos);
                const id = respuesta?.orden_id ?? respuesta?.id ?? respuesta;
                resultado.textContent = accion === "abrir" && ["string", "number"].includes(typeof id)
                    ? "Orden creada. Número " + id : "Operación guardada.";
                form.reset();
                if (rol === "mecanico") {
                    renderizarMisOrdenesMecanico(await catalogoApi("ordenes"));
                }
            } catch (e) {
                resultado.textContent = e.message;
            } finally {
                boton.disabled = false;
            }
        };
    }

    if (acciones.includes("abrir")) {
        const selector = document.querySelector('[name="vehiculo"]');
        selector.add(new Option("Selecciona un vehículo", ""));
        for (const v of await catalogoApi("vehiculos")) {
            const opcion = new Option(v.placa + " · " + v.propietario, v.id);
            opcion.dataset.cliente = v.cliente_id;
            selector.add(opcion);
        }
    }

    if (rol === "mecanico") {
        renderizarMisOrdenesMecanico(await catalogoApi("ordenes"));
    }
}

iniciarOrdenes().catch(e => { resultado.textContent = e.message; });