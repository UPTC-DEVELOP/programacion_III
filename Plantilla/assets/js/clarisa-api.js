var CLARISA_BASE = "https://pru.clarisacloud.com:8443";

function extraerMensajeClarisa(json, respaldo) {
  if (!json) {
    return respaldo;
  }
  if (json.textResponse) {
    return json.textResponse;
  }
  if (json.text_response) {
    return json.text_response;
  }
  if (json.data && json.data.errores && json.data.errores.length) {
    return json.data.errores.map(function (error) {
      return error.mensaje || error.message || error.descripcion || JSON.stringify(error);
    }).join(" ");
  }
  return respaldo;
}

async function llamarClarisa(ruta, opciones) {
  const headers = { "Content-Type": "application/json" };
  if (opciones && opciones.token) {
    headers.Authorization = opciones.token;
  }
  let respuesta;
  try {
    respuesta = await fetch(CLARISA_BASE + ruta, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(opciones && opciones.body ? opciones.body : {})
    });
  } catch (error) {
    throw new Error("No fue posible conectar con Clarisa.");
  }
  let json = null;
  try {
    json = await respuesta.json();
  } catch (e) {
    json = null;
  }
  return { status: respuesta.status, json: json };
}

async function loginClarisa(usuario, contrasenia) {
  return llamarClarisa("/seguridad/rest/api/v1/login/", {
    body: { usuario: usuario, contrasenia: contrasenia }
  });
}

async function emitirFacturaNacional(payload, token) {
  return llamarClarisa("/api/factura/rest/v1/factura/nacional", {
    token: token,
    body: payload
  });
}

async function consultarEstadoFactura(nit, numeroDocumento, token) {
  const ruta = CLARISA_BASE + "/api/factura/rest/v1/factura/validacion/?nit=" + encodeURIComponent(nit) + "&numeroDocumento=" + encodeURIComponent(numeroDocumento) + "&tipoDocumento=01";
  let respuesta;
  try {
    respuesta = await fetch(ruta, { headers: { Authorization: token } });
  } catch (error) {
    throw new Error("No fue posible conectar con Clarisa.");
  }
  let json = null;
  try {
    json = await respuesta.json();
  } catch (e) {
    json = null;
  }
  return { status: respuesta.status, json: json };
}

function obtenerConfigClarisa() {
  return {
    nit: "12345",
    numeroResolucion: "18760000001",
    prefijoDcto: "SETP",
    consecutivoDcto: "990000024"
  };
}
