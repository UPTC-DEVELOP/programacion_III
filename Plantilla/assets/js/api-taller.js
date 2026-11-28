(function (global) {
  var loc = global.location || {};
  var protocolo = String(loc.protocol || "");
  var host = String(loc.hostname || "");
  var puerto = String(loc.port || "");

  var esArchivoLocal = protocolo === "file:";
  var esHostLocal = host === "127.0.0.1" || host === "localhost" || host === "::1";
  var esLiveServer = esHostLocal && (puerto === "5500" || puerto === "5501");

  function deduplicar(lista) {
    var vistos = {};
    var salida = [];
    for (var i = 0; i < lista.length; i++) {
      var item = String(lista[i] || "").replace(/\/+$/, "");
      if (item && !vistos[item]) {
        vistos[item] = true;
        salida.push(item);
      }
    }
    return salida;
  }

  // Rutas ordenadas para la API REST Panther sobre Apache (XAMPP / producción):
  // - En Apache (http://localhost/taller/Plantilla/... o producción):
  //   usa ruta relativa nativa "../backend/rest" (resuelve a /taller/backend/rest/<recurso>
  //   con .htaccess + mod_rewrite). Fallback automático a "../backend/rest/index.php?PATH_INFO=".
  // - En Live Server (5500/5501) o file://: apunta a Apache de XAMPP en http://localhost/taller/backend/rest.
  var candidatosApi = [];
  if (esArchivoLocal || esLiveServer) {
    candidatosApi.push("http://localhost/taller/backend/rest");
    candidatosApi.push("http://127.0.0.1/taller/backend/rest");
    candidatosApi.push("http://localhost/taller/backend/rest/index.php");
  } else {
    candidatosApi.push("../backend/rest");
    candidatosApi.push("../backend/rest/index.php");
    if (esHostLocal) {
      candidatosApi.push("http://localhost/taller/backend/rest");
    }
  }
  candidatosApi = deduplicar(candidatosApi);

  var API_TALLER_BASE = candidatosApi[0] || "../backend/rest";

  function construirUrlConBase(base, ruta) {
    var limpia = String(ruta || "").replace(/^\/+/, "");
    if (base.indexOf("index.php") !== -1) {
      return base + "?PATH_INFO=" + encodeURIComponent(limpia);
    }
    return base.replace(/\/+$/, "") + "/" + limpia;
  }

  function construirUrlApiTaller(ruta) {
    return construirUrlConBase(API_TALLER_BASE, ruta);
  }

  /**
   * Ejecuta la petición contra Panther y valida que la respuesta sea JSON real
   * (si recibe HTML 404 o código PHP crudo, intenta automáticamente el siguiente candidato).
   */
  async function pantherFetch(ruta, opciones) {
    var intentos = deduplicar([API_TALLER_BASE].concat(candidatosApi));
    var ultimoError = null;

    for (var i = 0; i < intentos.length; i++) {
      var base = intentos[i];
      var url = construirUrlConBase(base, ruta);

      try {
        var respuesta = await fetch(url, {
          method: (opciones && opciones.method) || "GET",
          headers: (opciones && opciones.headers) || {},
          body: opciones && opciones.body !== undefined ? opciones.body : undefined,
          mode: "cors"
        });

        var texto = await respuesta.text();
        var recortado = texto.trim();

        var parecePhpCrudo = recortado.indexOf("<?php") === 0;
        var pareceHtml = recortado.indexOf("<") === 0;
        var json = null;

        if (!parecePhpCrudo && recortado !== "") {
          try {
            json = JSON.parse(recortado);
          } catch (errParse) {
            json = null;
          }
        }

        if (parecePhpCrudo || (pareceHtml && json === null)) {
          ultimoError = new Error("El servidor en " + base + " no devolvió JSON válido.");
          continue;
        }

        API_TALLER_BASE = base;
        global.API_TALLER = API_TALLER_BASE;

        return {
          respuesta: respuesta,
          json: json || {},
          url: url,
          base: base
        };
      } catch (errorRed) {
        ultimoError = errorRed;
      }
    }

    var errorConexion = new Error(
      ultimoError && ultimoError.message
        ? ultimoError.message
        : "No fue posible conectar con el servidor del taller."
    );
    errorConexion.esErrorConexion = true;
    errorConexion.intentos = intentos;
    throw errorConexion;
  }

  global.API_TALLER = API_TALLER_BASE;
  global.API_TALLER_CANDIDATOS = candidatosApi;
  global.construirUrlApiTaller = construirUrlApiTaller;
  global.pantherFetch = pantherFetch;
  global.RUTAS_TALLER = [
    { modulo: "Clientes", recurso: "clientes", pagina: "no-sidebar.html" },
    { modulo: "Vehículos", recurso: "vehiculos", pagina: "left-sidebar.html" },
    { modulo: "Proveedores", recurso: "proveedores", pagina: "proveedores.html" },
    { modulo: "Órdenes de servicio", recurso: "ordenes", pagina: "orden-servicio.html" },
    { modulo: "Empleados", recurso: "empleados", pagina: "right-sidebar.html" },
    { modulo: "Repuestos", recurso: "repuestos", pagina: "repuestos.html" },
    { modulo: "Inventario", recurso: "inventario", pagina: "inventario.html" },
    { modulo: "Facturación", recurso: "facturas", pagina: "factura.html" }
  ];
})(window);
