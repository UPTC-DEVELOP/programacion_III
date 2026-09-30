/* ==========================================================
   CRUD Vehículos — AutoGestión ERP
   Persistencia: localStorage (clave "ag_vehiculos").
   Cuando tengas backend, reemplaza solo la sección
   "CAPA DE DATOS" por llamadas fetch() a tu API.
   ========================================================== */

/* ---------- CAPA DE DATOS ---------- */
const CLAVE = "ag_vehiculos";
const CLAVE_CLIENTES = "ag_clientes";   // la llenará el CRUD de clientes
const CLAVE_INICIO = "ag_vehiculos_init";

// Se usan solo si aún no existe el módulo de clientes
const CLIENTES_DEMO = ["Carlos Rodríguez", "Laura Gómez", "Andrés Pérez"];

const VEHICULOS_DEMO = [
    { id: "demo1", placa: "ABC123", propietario: "Carlos Rodríguez", marca: "Toyota", modelo: "Corolla", anio: "2022", color: "Gris", kilometraje: "35000" },
    { id: "demo2", placa: "XYZ987", propietario: "Laura Gómez", marca: "Mazda", modelo: "3", anio: "2020", color: "Rojo", kilometraje: "58000" }
];

function leerVehiculos() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE)) || [];
    } catch (e) {
        return [];
    }
}

function guardarVehiculos(lista) {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
}

function crearVehiculo(datos) {
    const lista = leerVehiculos();
    lista.push({ id: Date.now().toString(), ...datos });
    guardarVehiculos(lista);
}

function actualizarVehiculo(id, datos) {
    guardarVehiculos(leerVehiculos().map(v => (v.id === id ? { ...v, ...datos } : v)));
}

function eliminarVehiculo(id) {
    guardarVehiculos(leerVehiculos().filter(v => v.id !== id));
}

// Devuelve los nombres de clientes para el select de propietario
function leerPropietarios() {
    try {
        const clientes = JSON.parse(localStorage.getItem(CLAVE_CLIENTES)) || [];
        const nombres = clientes.map(c => c.nombre).filter(Boolean);
        if (nombres.length) return nombres;
    } catch (e) { /* usa la lista demo */ }
    return CLIENTES_DEMO;
}

// Datos de ejemplo la primera vez que se abre el módulo
if (!localStorage.getItem(CLAVE_INICIO)) {
    if (leerVehiculos().length === 0) guardarVehiculos(VEHICULOS_DEMO);
    localStorage.setItem(CLAVE_INICIO, "1");
}

/* ---------- REFERENCIAS DOM ---------- */
const $ = id => document.getElementById(id);

const tabla = $("tablaVehiculos");
const vacio = $("vacio");
const buscador = $("buscador");
const modalForm = $("modalForm");
const modalEliminar = $("modalEliminar");
const form = $("formVehiculo");
const aviso = $("aviso");

const CAMPOS = ["placa", "propietario", "marca", "modelo", "anio", "color", "kilometraje"];
let idAEliminar = null;

/* ---------- UTILIDADES ---------- */
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function mostrarAviso(mensaje, esError = false) {
    aviso.textContent = mensaje;
    aviso.classList.toggle("error-aviso", esError);
    aviso.classList.add("visible");
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(() => aviso.classList.remove("visible"), 2600);
}

/* ---------- RENDER (READ) ---------- */
function render() {
    const lista = leerVehiculos();
    const texto = buscador.value.trim().toLowerCase();

    const filtrados = lista
        .filter(v => !texto || [v.placa, v.marca, v.modelo, v.propietario]
            .some(c => (c || "").toLowerCase().includes(texto)))
        .sort((a, b) => (a.placa || "").localeCompare(b.placa || ""));

    tabla.innerHTML = filtrados.map(v => `
        <tr>
            <td class="placa">${escapar(v.placa)}</td>
            <td>${escapar(v.marca)}</td>
            <td>${escapar(v.modelo)}</td>
            <td>${escapar(v.anio)}</td>
            <td>${escapar(v.color) || "—"}</td>
            <td>${v.kilometraje ? Number(v.kilometraje).toLocaleString("es-CO") + " km" : "—"}</td>
            <td>${escapar(v.propietario)}</td>
            <td class="acciones-celda">
                <div class="acciones">
                    <button type="button" class="btn-tabla" data-editar="${v.id}">Editar</button>
                    <button type="button" class="btn-tabla eliminar" data-eliminar="${v.id}">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join("");

    if (filtrados.length === 0) {
        vacio.hidden = false;
        vacio.textContent = lista.length === 0
            ? "Aún no hay vehículos registrados. Usa “Nuevo vehículo” para agregar el primero."
            : "Ningún vehículo coincide con la búsqueda.";
    } else {
        vacio.hidden = true;
    }
}

/* ---------- SELECT DE PROPIETARIO ---------- */
function cargarPropietarios(seleccionado = "") {
    const nombres = [...leerPropietarios()];
    // Si el propietario guardado ya no está en la lista, se conserva igual
    if (seleccionado && !nombres.includes(seleccionado)) nombres.push(seleccionado);

    $("propietario").innerHTML =
        `<option value="">Selecciona un cliente…</option>` +
        nombres.map(n => `<option value="${escapar(n)}">${escapar(n)}</option>`).join("");
    $("propietario").value = seleccionado;
}

/* ---------- VALIDACIÓN ---------- */
function validar(datos, idActual) {
    const errores = {};
    const anioMax = new Date().getFullYear() + 1;

    // Placa colombiana: carro ABC123 | moto ABC12D
    if (!/^[A-Z]{3}\d{2}[A-Z0-9]$/.test(datos.placa)) {
        errores.placa = "Formato inválido. Ej: ABC123 o ABC12D.";
    } else if (leerVehiculos().some(v => v.placa === datos.placa && v.id !== idActual)) {
        errores.placa = "Ya existe un vehículo con esta placa.";
    }

    if (!datos.propietario) errores.propietario = "Selecciona el propietario.";
    if (!datos.marca) errores.marca = "Ingresa la marca.";
    if (!datos.modelo) errores.modelo = "Ingresa el modelo.";

    const anio = Number(datos.anio);
    if (!Number.isInteger(anio) || anio < 1950 || anio > anioMax) {
        errores.anio = `Ingresa un año entre 1950 y ${anioMax}.`;
    }

    if (datos.kilometraje !== "" && Number(datos.kilometraje) < 0) {
        errores.kilometraje = "No puede ser negativo.";
    }
    return errores;
}

function mostrarErrores(errores) {
    form.querySelectorAll("[data-error]").forEach(el => {
        const campo = el.dataset.error;
        el.textContent = errores[campo] || "";
        el.closest(".campo").classList.toggle("invalido", Boolean(errores[campo]));
    });
}

function leerFormulario() {
    const datos = {};
    CAMPOS.forEach(c => (datos[c] = $(c).value.trim()));
    datos.placa = datos.placa.toUpperCase();
    return datos;
}

/* ---------- MODAL CREAR / EDITAR ---------- */
function abrirFormulario(vehiculo = null) {
    form.reset();
    mostrarErrores({});
    cargarPropietarios(vehiculo ? vehiculo.propietario : "");

    $("idVehiculo").value = vehiculo ? vehiculo.id : "";
    $("modalTitulo").textContent = vehiculo ? "EDITAR VEHÍCULO" : "NUEVO VEHÍCULO";

    if (vehiculo) {
        CAMPOS.filter(c => c !== "propietario").forEach(c => ($(c).value = vehiculo[c] ?? ""));
    }
    modalForm.showModal();
    $("placa").focus();
}

/* ---------- EVENTOS ---------- */
$("btnNuevo").addEventListener("click", () => abrirFormulario());

$("placa").addEventListener("input", e => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

// Crear / actualizar
form.addEventListener("submit", e => {
    e.preventDefault();
    const id = $("idVehiculo").value;
    const datos = leerFormulario();
    const errores = validar(datos, id);
    mostrarErrores(errores);
    if (Object.keys(errores).length) return;

    if (id) {
        actualizarVehiculo(id, datos);
        mostrarAviso("Vehículo actualizado");
    } else {
        crearVehiculo(datos);
        mostrarAviso("Vehículo registrado");
    }
    modalForm.close();
    render();
});

// Editar / eliminar (delegación de eventos)
tabla.addEventListener("click", e => {
    const btnEditar = e.target.closest("[data-editar]");
    const btnEliminar = e.target.closest("[data-eliminar]");

    if (btnEditar) {
        const v = leerVehiculos().find(x => x.id === btnEditar.dataset.editar);
        if (v) abrirFormulario(v);
    }

    if (btnEliminar) {
        const v = leerVehiculos().find(x => x.id === btnEliminar.dataset.eliminar);
        if (!v) return;
        idAEliminar = v.id;
        $("textoEliminar").textContent =
            `Vas a eliminar el vehículo ${v.placa} (${v.marca} ${v.modelo}). Esta acción no se puede deshacer.`;
        modalEliminar.showModal();
    }
});

$("btnConfirmarEliminar").addEventListener("click", () => {
    if (idAEliminar) {
        eliminarVehiculo(idAEliminar);
        idAEliminar = null;
        mostrarAviso("Vehículo eliminado");
        render();
    }
    modalEliminar.close();
});

// Cerrar modales (botones y clic fuera)
document.querySelectorAll("[data-cerrar]").forEach(btn => {
    btn.addEventListener("click", () => btn.closest("dialog").close());
});
[modalForm, modalEliminar].forEach(d => {
    d.addEventListener("click", e => {
        if (e.target === d) d.close();
    });
});

buscador.addEventListener("input", render);

/* ---------- INICIO ---------- */
render();