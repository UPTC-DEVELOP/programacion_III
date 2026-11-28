const recurso = document.querySelector("[data-recurso]").dataset.recurso;
const form = document.getElementById("formRegistro");
const modal = document.getElementById("modalForm");
const confirmacion = document.getElementById("modalEliminar");
const busqueda = document.getElementById("buscador");
const singular = recurso === "clientes" ? "cliente" : "repuesto";
const columnas = Array.from(form.querySelectorAll("[name]"), input => input.name);
const visibles = recurso === "repuestos" ? [...columnas, "existencias"] : columnas;
let registros = [];
let seleccionado;
let permiteBorrar = false;
function aviso(mensaje) {
    const zona = document.getElementById("aviso");
    zona.textContent = mensaje;
    zona.classList.add("visible");
    clearTimeout(aviso.timer);
    aviso.timer = setTimeout(() => zona.classList.remove("visible"), 4500);
}
function abrir(fila) {
    seleccionado = fila;
    form.reset();
    for (const campo of columnas) form.elements[campo].value = fila?.[campo] ?? "";
    document.getElementById("modalTitulo").textContent = (fila ? "Editar " : "Nuevo ") + singular;
    modal.showModal();
}
function render() {
    const cuerpo = document.querySelector("tbody");
    cuerpo.replaceChildren();
    for (const fila of registros) {
        if (!visibles.some(c => String(fila[c]).toLowerCase().includes(busqueda.value.toLowerCase().trim()))) continue;
        const tr = cuerpo.insertRow();
        for (const campo of visibles) tr.insertCell().textContent = fila[campo];
        const acciones = tr.insertCell();
        const editar = document.createElement("button");
        editar.className = "btn-tabla";
        editar.textContent = "Editar";
        editar.onclick = () => abrir(fila);
        acciones.append(editar);
        if (permiteBorrar) {
            const borrar = editar.cloneNode();
            borrar.textContent = "Eliminar";
            borrar.onclick = () => {
                seleccionado = fila;
                document.getElementById("textoEliminar").textContent = "¿Eliminar " + fila.nombre + "?";
                confirmacion.showModal();
            };
            acciones.append(borrar);
        }
    }
    const vacio = document.getElementById("vacio");
    vacio.hidden = cuerpo.rows.length > 0;
    vacio.textContent = busqueda.value ? "Sin coincidencias." : "Sin registros.";
}
async function cargar() {
    const [filas, perfil] = await Promise.all([catalogoApi(recurso), catalogoApi("perfil")]);
    registros = filas;
    permiteBorrar = perfil.rol === "admin";
    render();
}
form.onsubmit = async event => {
    event.preventDefault();
    const boton = document.getElementById("btnGuardar");
    boton.disabled = true;
    try {
        const ficha = Object.fromEntries(new FormData(form));
        await catalogoApi(seleccionado ? recurso + "/" + seleccionado.id : recurso, seleccionado ? "PUT" : "POST", ficha);
        modal.close();
        await cargar();
        aviso("Registro guardado.");
    } catch (e) { window.alert(e.message); }
    finally { boton.disabled = false; }
};
document.getElementById("btnConfirmarEliminar").onclick = async event => {
    const boton = event.currentTarget;
    boton.disabled = true;
    try {
        await catalogoApi(recurso + "/" + seleccionado.id, "DELETE");
        confirmacion.close();
        await cargar();
    } catch (e) { confirmacion.close(); aviso(e.message); }
    finally { boton.disabled = false; }
};
document.getElementById("btnNuevo").onclick = () => abrir(null);
document.querySelectorAll("[data-cerrar]").forEach(b => b.onclick = () => b.closest("dialog").close());
busqueda.oninput = render;
cargar().catch(e => aviso(e.message));
