(function (global) {
  var loc = global.location || {};
  var protocolo = String(loc.protocol || "");
  var host = String(loc.hostname || "");
  var puerto = String(loc.port || "");
  var pathname = String(loc.pathname || "");

  var esArchivoLocal = protocolo === "file:";
  var esHostLocal = host === "127.0.0.1" || host === "localhost" || host === "::1";
  var puertosDev = { "5500": true, "5501": true, "5502": true, "5173": true, "3000": true, "4173": true };
  var esLiveServer = esHostLocal && Boolean(puertosDev[puerto]);
  var esApacheTaller = !esArchivoLocal && pathname.indexOf("/taller/") !== -1;

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

  var candidatosApi = [];
  candidatosApi.push("http://localhost/taller/backend/rest");
  candidatosApi.push("http://127.0.0.1/taller/backend/rest");
  candidatosApi.push("http://localhost/taller/backend/rest/index.php");
  candidatosApi.push("http://127.0.0.1/taller/backend/rest/index.php");

  if (esApacheTaller && !esLiveServer) {
    candidatosApi.unshift("../backend/rest");
    candidatosApi.push("../backend/rest/index.php");
  }

  if (esArchivoLocal || esLiveServer) {
    candidatosApi = [
      "http://localhost/taller/backend/rest",
      "http://127.0.0.1/taller/backend/rest",
      "http://localhost/taller/backend/rest/index.php",
      "http://127.0.0.1/taller/backend/rest/index.php"
    ];
  }

  candidatosApi = deduplicar(candidatosApi);
  var API_TALLER_BASE = candidatosApi[0] || "http://localhost/taller/backend/rest";

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

  async function pantherFetch(ruta, opciones) {
    var intentos = deduplicar([API_TALLER_BASE].concat(candidatosApi));
    var ultimoError = null;
    var detalleIntentos = [];

    for (var i = 0; i < intentos.length; i++) {
      var base = intentos[i];
      var url = construirUrlConBase(base, ruta);

      try {
        var respuesta = await fetch(url, {
          method: (opciones && opciones.method) || "GET",
          headers: (opciones && opciones.headers) || {},
          body: opciones && opciones.body !== undefined ? opciones.body : undefined
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
          detalleIntentos.push(url + " -> respuesta no JSON");
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
        detalleIntentos.push(url + " -> " + (errorRed && errorRed.message ? errorRed.message : "error de red"));
        ultimoError = errorRed;
      }
    }

    var mensaje =
      "No fue posible conectar con el servidor del taller. " +
      "Abre la página desde http://localhost/taller/Plantilla/ e inicia Apache en XAMPP. " +
      (detalleIntentos.length ? ("Intentos: " + detalleIntentos.join(" | ")) : "");

    var errorConexion = new Error(mensaje);
    errorConexion.esErrorConexion = true;
    errorConexion.intentos = intentos;
    errorConexion.detalleIntentos = detalleIntentos;
    if (ultimoError && ultimoError.message) {
      errorConexion.causa = ultimoError.message;
    }
    throw errorConexion;
  }

  var CLAVE_TOKEN = "olimac_panther_token";
  var CLAVE_USUARIO = "olimac_panther_user";
  var CLAVE_ROL = "olimac_panther_role";

  var MODULOS_POR_ROL = {
    ADMIN: ["Clientes", "Vehículos", "Proveedores", "Empleados", "Servicios", "Repuestos", "Inventario", "Facturación"],
    MECANICO: ["Servicios", "Repuestos", "Inventario"],
    RECEPCIONISTA: ["Clientes", "Vehículos", "Servicios", "Facturación"]
  };

  var CATALOGO_MODULOS = [
    { id: "Clientes", etiqueta: "Clientes", pagina: "no-sidebar.html", recurso: "clientes" },
    { id: "Vehículos", etiqueta: "Vehículos", pagina: "left-sidebar.html", recurso: "vehiculos" },
    { id: "Proveedores", etiqueta: "Proveedores", pagina: "proveedores.html", recurso: "proveedores" },
    { id: "Empleados", etiqueta: "Empleados", pagina: "right-sidebar.html", recurso: "empleados" },
    { id: "Servicios", etiqueta: "Servicios", pagina: "orden-servicio.html", recurso: "ordenes" },
    { id: "Repuestos", etiqueta: "Repuestos", pagina: "repuestos.html", recurso: "repuestos" },
    { id: "Inventario", etiqueta: "Inventario", pagina: "inventario.html", recurso: "inventario" },
    { id: "Facturación", etiqueta: "Facturación", pagina: "factura.html", recurso: "facturas" }
  ];

  var ALIAS_MODULO = {
    clientes: "Clientes",
    vehiculos: "Vehículos",
    vehículos: "Vehículos",
    proveedores: "Proveedores",
    empleados: "Empleados",
    servicios: "Servicios",
    "órdenes de servicio": "Servicios",
    "ordenes de servicio": "Servicios",
    repuestos: "Repuestos",
    inventario: "Inventario",
    facturacion: "Facturación",
    facturación: "Facturación",
    facturas: "Facturación"
  };

  function normalizarRol(rol) {
    return String(rol || "").trim().toUpperCase();
  }

  function normalizarModulo(modulo) {
    var bruto = String(modulo || "").trim();
    if (!bruto) {
      return "";
    }
    var alias = ALIAS_MODULO[bruto.toLowerCase()];
    if (alias) {
      return alias;
    }
    for (var i = 0; i < CATALOGO_MODULOS.length; i++) {
      if (CATALOGO_MODULOS[i].id.toLowerCase() === bruto.toLowerCase()) {
        return CATALOGO_MODULOS[i].id;
      }
    }
    return bruto;
  }

  function guardarSesion(keyAPI, usuario, rol) {
    var token = String(keyAPI || "").trim();
    var user = String(usuario || "").trim();
    var role = normalizarRol(rol);
    if (!token || !user || !role) {
      return false;
    }
    sessionStorage.setItem(CLAVE_TOKEN, token);
    sessionStorage.setItem(CLAVE_USUARIO, user);
    sessionStorage.setItem(CLAVE_ROL, role);
    return true;
  }

  function obtenerSesion() {
    var keyAPI = sessionStorage.getItem(CLAVE_TOKEN) || "";
    var usuario = sessionStorage.getItem(CLAVE_USUARIO) || "";
    var rol = normalizarRol(sessionStorage.getItem(CLAVE_ROL) || "");
    if (!keyAPI || !rol) {
      return null;
    }
    return {
      keyAPI: keyAPI,
      usuario: usuario,
      rol: rol,
      token: keyAPI
    };
  }

  function cerrarSesion(destino) {
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_USUARIO);
    sessionStorage.removeItem(CLAVE_ROL);
    sessionStorage.removeItem("olimac_panther_logout_manual");
    sessionStorage.removeItem("olimac_sesion");
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_ROL);
    if (destino) {
      global.location.replace(destino);
    }
  }

  function modulosPermitidos(rol) {
    var lista = MODULOS_POR_ROL[normalizarRol(rol)] || [];
    return lista.slice();
  }

  function tienePermisoModulo(modulo, rolOpcional) {
    var sesion = obtenerSesion();
    var rol = normalizarRol(rolOpcional || (sesion && sesion.rol) || "");
    if (!rol) {
      return false;
    }
    var id = normalizarModulo(modulo);
    var permitidos = modulosPermitidos(rol);
    return permitidos.indexOf(id) !== -1;
  }

  function protegerAccesoModulo(modulo, opciones) {
    var opts = opciones || {};
    var sesion = obtenerSesion();
    if (!sesion) {
      global.location.replace(opts.login || "login.html");
      return false;
    }
    if (!tienePermisoModulo(modulo, sesion.rol)) {
      global.location.replace(opts.panel || "panel-control.html");
      return false;
    }
    return true;
  }

  function aplicarVisibilidadModulos(contenedor, selectorTarjeta) {
    var root = typeof contenedor === "string" ? document.querySelector(contenedor) : contenedor;
    if (!root) {
      return;
    }
    var sesion = obtenerSesion();
    var rol = sesion ? sesion.rol : "";
    var tarjetas = root.querySelectorAll(selectorTarjeta || "[data-modulo]");
    for (var i = 0; i < tarjetas.length; i++) {
      var tarjeta = tarjetas[i];
      var modulo = tarjeta.getAttribute("data-modulo") || "";
      var permitido = Boolean(sesion) && tienePermisoModulo(modulo, rol);
      if (permitido) {
        tarjeta.hidden = false;
        tarjeta.removeAttribute("hidden");
      } else {
        tarjeta.hidden = true;
        tarjeta.setAttribute("hidden", "hidden");
      }
    }
  }

  function construirEnlacesNavPorRol(ulNav, opciones) {
    var opts = opciones || {};
    var sesion = obtenerSesion();
    if (!ulNav || !sesion) {
      return;
    }
    var paginaActual = String(global.location.pathname || "").split("/").pop().toLowerCase() || "index.html";
    var html = "";
    if (opts.incluirInicio !== false) {
      html += '<li' + (paginaActual === "index.html" ? ' class="current"' : "") + '><a href="index.html">Inicio</a></li>';
    }
    if (opts.incluirPanel !== false) {
      html += '<li' + (paginaActual === "panel-control.html" ? ' class="current"' : "") + '><a href="panel-control.html">Panel de control</a></li>';
    }
    var permitidos = modulosPermitidos(sesion.rol);
    for (var i = 0; i < CATALOGO_MODULOS.length; i++) {
      var item = CATALOGO_MODULOS[i];
      if (permitidos.indexOf(item.id) === -1) {
        continue;
      }
      var actual = paginaActual === String(item.pagina).toLowerCase();
      html += '<li' + (actual ? ' class="current"' : "") + '><a href="' + item.pagina + '">' + item.etiqueta + "</a></li>";
    }
    var etiquetaUsuario = "Usuario: " + (sesion.usuario || "—") + " | Rol: " + sesion.rol;
    html += '<li class="nav-sesion"><span>' + etiquetaUsuario + "</span></li>";
    html += '<li><a href="#" id="btnCerrarSesionNav">Cerrar sesión</a></li>';
    ulNav.innerHTML = html;
    var btnSalir = document.getElementById("btnCerrarSesionNav");
    if (btnSalir) {
      btnSalir.addEventListener("click", function (evento) {
        evento.preventDefault();
        cerrarSesion(opts.destinoLogout || "index.html");
      });
    }
  }

  function montarNavbarApp(opciones) {
    var opts = opciones || {};
    var links = document.getElementById(opts.linksId || "orsNavLinks");
    var sessionBox = document.getElementById(opts.sessionId || "orsNavSession");
    if (!links) {
      return false;
    }

    var sesion = obtenerSesion();
    var paginaActual = String(global.location.pathname || "").split("/").pop().toLowerCase() || "index.html";
    var html = "";

    if (opts.incluirInicio !== false) {
      html +=
        '<a class="ors-nav__link' +
        (paginaActual === "index.html" ? " is-active" : "") +
        '" href="index.html">Inicio</a>';
    }
    if (opts.incluirPanel !== false) {
      html +=
        '<a class="ors-nav__link' +
        (paginaActual === "panel-control.html" ? " is-active" : "") +
        '" href="panel-control.html">Panel de control</a>';
    }

    if (sesion) {
      var permitidos = modulosPermitidos(sesion.rol);
      for (var i = 0; i < CATALOGO_MODULOS.length; i++) {
        var item = CATALOGO_MODULOS[i];
        if (permitidos.indexOf(item.id) === -1) {
          continue;
        }
        var actual = paginaActual === String(item.pagina).toLowerCase();
        html +=
          '<a class="ors-nav__link' +
          (actual ? " is-active" : "") +
          '" href="' +
          item.pagina +
          '">' +
          item.etiqueta +
          "</a>";
      }
    }

    links.innerHTML = html;

    if (sessionBox) {
      if (sesion) {
        sessionBox.innerHTML =
          '<span class="ors-nav__user">Usuario: ' +
          (sesion.usuario || "—") +
          " | Rol: " +
          sesion.rol +
          "</span>" +
          '<button type="button" class="ors-nav__cta ors-nav__cta--logout" id="btnCerrarSesionNav">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 12h9"></path><path d="M15.5 8.5L19 12l-3.5 3.5"></path><path d="M13 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"></path></svg>' +
          "<span>Cerrar sesión</span>" +
          "</button>";
        var btnSalir = document.getElementById("btnCerrarSesionNav");
        if (btnSalir) {
          btnSalir.addEventListener("click", function (evento) {
            evento.preventDefault();
            cerrarSesion(opts.destinoLogout || "index.html");
          });
        }
      } else {
        sessionBox.innerHTML =
          '<a class="ors-nav__cta" href="login.html">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 12h9"></path><path d="M15.5 8.5L19 12l-3.5 3.5"></path><path d="M13 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"></path></svg>' +
          '<span class="ors-nav__cta-label">Iniciar sesión</span>' +
          "</a>";
      }
    }

    return true;
  }

  function actualizarBotonAccesoPublico(enlace) {
    var nodo = typeof enlace === "string" ? document.querySelector(enlace) : enlace;
    if (!nodo) {
      return;
    }
    var sesion = obtenerSesion();
    var etiqueta = sesion ? "Panel de control" : "Iniciar sesión";
    var destino = sesion ? "panel-control.html" : "login.html";
    var label = nodo.querySelector(".ors-nav__cta-label, [data-label-acceso]");
    if (label) {
      label.textContent = etiqueta;
    } else {
      nodo.textContent = etiqueta;
    }
    nodo.setAttribute("href", destino);
  }

  global.API_TALLER = API_TALLER_BASE;
  global.API_TALLER_CANDIDATOS = candidatosApi;
  global.construirUrlApiTaller = construirUrlApiTaller;
  global.pantherFetch = pantherFetch;
  global.CLAVE_TOKEN_TALLER = CLAVE_TOKEN;
  global.CLAVE_USUARIO_TALLER = CLAVE_USUARIO;
  global.CLAVE_ROL_TALLER = CLAVE_ROL;
  global.MODULOS_POR_ROL = MODULOS_POR_ROL;
  global.CATALOGO_MODULOS = CATALOGO_MODULOS;
  global.guardarSesion = guardarSesion;
  global.obtenerSesion = obtenerSesion;
  global.cerrarSesion = cerrarSesion;
  global.tienePermisoModulo = tienePermisoModulo;
  global.modulosPermitidos = modulosPermitidos;
  global.protegerAccesoModulo = protegerAccesoModulo;
  global.aplicarVisibilidadModulos = aplicarVisibilidadModulos;
  global.construirEnlacesNavPorRol = construirEnlacesNavPorRol;
  global.montarNavbarApp = montarNavbarApp;
  global.actualizarBotonAccesoPublico = actualizarBotonAccesoPublico;
  global.RUTAS_TALLER = CATALOGO_MODULOS.map(function (item) {
    return { modulo: item.id, recurso: item.recurso, pagina: item.pagina };
  });
})(window);
