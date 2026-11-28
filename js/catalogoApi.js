async function catalogoApi(ruta, metodo = "GET", datos) {
    const opciones = {
        method: metodo, cache: "no-store",
        headers: { authorization: Sesion.token(), Accept: "application/json" }
    };
    if (datos !== undefined) {
        opciones.headers["Content-Type"] = "application/json";
        opciones.body = JSON.stringify(datos);
    }
    const respuesta = await fetch(CONFIG.API_BASE + ruta, opciones);
    let json;
    try { json = await respuesta.json(); }
    catch { throw new Error("Panther no devolvió JSON. Revisa la ruta y la instalación del recurso."); }
    if (!respuesta.ok || json.state !== "OK") {
        throw new Error(typeof json.data === "string" ? json.data : "Panther rechazó la operación.");
    }
    return json.data;
}
