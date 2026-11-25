(() => {
  "use strict";

  const FACTURACION_ENDPOINT = "panther/rest/facturacion";
  const CLAVE_TOKEN_PANTHER = "servicesMechanic.pantherToken";
  const IDENTIFICADORES_SECCIONES = [
    "dashboard",
    "clientes",
    "vehiculos",
    "empleados",
    "repuestos",
    "facturacion"
  ];

  const formulario = document.getElementById("formulario-facturacion");

  if (!formulario) {
    return;
  }

  const nitEmisor = document.getElementById("factura-nit");
  const numeroResolucion = document.getElementById("factura-resolucion");
  const consecutivo = document.getElementById("factura-consecutivo");
  const prefijo = document.getElementById("factura-prefijo");
  const fechaVencimiento = document.getElementById("factura-vencimiento");
  const formaPago = document.getElementById("factura-forma-pago");
  const mediosPago = document.getElementById("factura-medios-pago");
  const nombreCliente = document.getElementById("cliente-razon-social");
  const tipoIdentificacion = document.getElementById(
    "cliente-tipo-identificacion"
  );
  const numeroIdentificacion = document.getElementById(
    "cliente-numero-identificacion"
  );
  const naturalezaCliente = document.getElementById("cliente-naturaleza");
  const codigoItem = document.getElementById("item-codigo");
  const nombreItem = document.getElementById("item-descripcion");
  const precioUnitario = document.getElementById("item-precio-unitario");
  const cantidad = document.getElementById("item-cantidad");
  const unidadItem = document.getElementById("item-unidad");
  const tipoImpuesto = document.getElementById("item-impuesto-tipo");
  const claseImpuesto = document.getElementById("item-impuesto-clase");
  const tarifaTributo = document.getElementById("item-impuesto-tarifa");
  const subtotal = document.getElementById("resumen-subtotal");
  const valorImpuesto = document.getElementById("resumen-impuestos");
  const total = document.getElementById("factura-total");
  const estadoCalculo = document.getElementById("ayuda-resumen-factura");
  const botonEnviar = formulario.querySelector(".btn-enviar-factura");
  const botonVistaPrevia = document.getElementById("btn-vista-previa-json");
  const estadoVistaPrevia = document.getElementById(
    "estado-vista-previa-json"
  );
  const vistaPrevia = document.getElementById("vista-previa-json");
  const contenidoVistaPrevia = document.getElementById(
    "contenido-vista-previa-json"
  );
  const estadoEnvio = document.getElementById("estado-envio-factura");
  const confirmacionFactura = document.getElementById("confirmacion-factura");
  const datosConfirmacionFactura = document.getElementById(
    "datos-confirmacion-factura"
  );
  const seccionFacturacion = document.getElementById("facturacion");
  const enlaceFacturacion = document.querySelector(
    '.menu-sistema a[href="#facturacion"]'
  );
  const enlacesMenu = document.querySelectorAll(".menu-sistema a");
  const tituloTopbar = document.querySelector(".topbar-sistema h2");
  const subtituloTopbar = document.querySelector(".topbar-sistema p");
  const botonCerrarSesion = document.getElementById("btn-cerrar-sesion");

  const controles = [
    nitEmisor,
    numeroResolucion,
    consecutivo,
    prefijo,
    fechaVencimiento,
    formaPago,
    mediosPago,
    nombreCliente,
    tipoIdentificacion,
    numeroIdentificacion,
    naturalezaCliente,
    codigoItem,
    nombreItem,
    precioUnitario,
    cantidad,
    unidadItem,
    tipoImpuesto,
    claseImpuesto,
    tarifaTributo,
    subtotal,
    valorImpuesto,
    total,
    estadoCalculo,
    botonEnviar,
    botonVistaPrevia,
    estadoVistaPrevia,
    vistaPrevia,
    contenidoVistaPrevia,
    estadoEnvio,
    confirmacionFactura,
    datosConfirmacionFactura,
    seccionFacturacion,
    enlaceFacturacion
  ];

  if (controles.some((control) => !control)) {
    return;
  }

  const DECIMALES_RESULTADO = 6;
  const ESCALA_RESULTADO = 10n ** BigInt(DECIMALES_RESULTADO);
  const CLASE_PORCENTUAL = "PO";
  const CLASE_NOMINAL = "NM";
  const CLASES_ESTADO = [
    "estado-calculo-correcto",
    "estado-calculo-advertencia",
    "estado-calculo-error"
  ];
  let envioEnCurso = false;
  let facturaConfirmada = false;
  let estadoUltimaFactura = null;

  botonEnviar.disabled = true;

  function convertirDecimal(valor) {
    const texto = valor.trim();

    if (!/^\d+(?:\.\d+)?$/.test(texto)) {
      return null;
    }

    const [parteEntera, parteDecimal = ""] = texto.split(".");

    return {
      coeficiente: BigInt(`${parteEntera}${parteDecimal}`),
      escala: 10n ** BigInt(parteDecimal.length)
    };
  }

  function dividirRedondeando(numerador, denominador) {
    return (numerador + denominador / 2n) / denominador;
  }

  function multiplicarAEscala(valorA, valorB) {
    const numerador =
      valorA.coeficiente * valorB.coeficiente * ESCALA_RESULTADO;
    const denominador = valorA.escala * valorB.escala;

    return dividirRedondeando(numerador, denominador);
  }

  function calcularPorcentaje(valorEscalado, tarifa) {
    const numerador = valorEscalado * tarifa.coeficiente;
    const denominador = tarifa.escala * 100n;

    return dividirRedondeando(numerador, denominador);
  }

  function formatearEscala(valorEscalado) {
    const parteEntera = valorEscalado / ESCALA_RESULTADO;
    let parteDecimal = String(valorEscalado % ESCALA_RESULTADO).padStart(
      DECIMALES_RESULTADO,
      "0"
    );

    while (parteDecimal.length > 2 && parteDecimal.endsWith("0")) {
      parteDecimal = parteDecimal.slice(0, -1);
    }

    return `${parteEntera}.${parteDecimal}`;
  }

  function limpiarResultados() {
    subtotal.value = "";
    valorImpuesto.value = "";
    total.value = "";
  }

  function limpiarValidacion() {
    [precioUnitario, cantidad, tarifaTributo].forEach((campo) => {
      campo.removeAttribute("aria-invalid");
    });
  }

  function marcarInvalido(campo) {
    campo.setAttribute("aria-invalid", "true");
  }

  function mostrarEstado(mensaje, clase = "") {
    estadoCalculo.textContent = mensaje;
    estadoCalculo.classList.remove(...CLASES_ESTADO);

    if (clase) {
      estadoCalculo.classList.add(clase);
    }
  }

  function datosIncompletos() {
    return (
      precioUnitario.value.trim() === "" ||
      cantidad.value.trim() === "" ||
      tipoImpuesto.value === "" ||
      claseImpuesto.value === "" ||
      tarifaTributo.value.trim() === ""
    );
  }

  function actualizarCalculos() {
    limpiarValidacion();

    if (precioUnitario.validity.badInput) {
      limpiarResultados();
      marcarInvalido(precioUnitario);
      mostrarEstado(
        "Ingresa un precio base unitario numérico y no negativo.",
        "estado-calculo-error"
      );
      return;
    }

    if (cantidad.validity.badInput) {
      limpiarResultados();
      marcarInvalido(cantidad);
      mostrarEstado(
        "La cantidad debe ser un número mayor que cero.",
        "estado-calculo-error"
      );
      return;
    }

    if (tarifaTributo.validity.badInput) {
      limpiarResultados();
      marcarInvalido(tarifaTributo);
      mostrarEstado(
        "Ingresa una tarifa del tributo numérica y no negativa.",
        "estado-calculo-error"
      );
      return;
    }

    if (datosIncompletos()) {
      limpiarResultados();
      mostrarEstado(
        "Completa precio, cantidad, tipo, clase y tarifa del impuesto para calcular el resumen."
      );
      return;
    }

    const precio = convertirDecimal(precioUnitario.value);
    const unidades = convertirDecimal(cantidad.value);
    const tarifa = convertirDecimal(tarifaTributo.value);

    if (!precio) {
      limpiarResultados();
      marcarInvalido(precioUnitario);
      mostrarEstado(
        "Ingresa un precio base unitario numérico y no negativo.",
        "estado-calculo-error"
      );
      return;
    }

    if (!unidades || unidades.coeficiente <= 0n) {
      limpiarResultados();
      marcarInvalido(cantidad);
      mostrarEstado(
        "La cantidad debe ser un número mayor que cero.",
        "estado-calculo-error"
      );
      return;
    }

    if (!tarifa) {
      limpiarResultados();
      marcarInvalido(tarifaTributo);
      mostrarEstado(
        "Ingresa una tarifa del tributo numérica y no negativa.",
        "estado-calculo-error"
      );
      return;
    }

    const subtotalCalculado = multiplicarAEscala(precio, unidades);
    subtotal.value = formatearEscala(subtotalCalculado);

    if (claseImpuesto.value === CLASE_NOMINAL) {
      valorImpuesto.value = "";
      total.value = "";
      mostrarEstado(
        "El impuesto nominal requiere una fórmula especial. Solo se muestra el subtotal; impuesto y total no fueron calculados.",
        "estado-calculo-advertencia"
      );
      return;
    }

    if (claseImpuesto.value !== CLASE_PORCENTUAL) {
      valorImpuesto.value = "";
      total.value = "";
      mostrarEstado(
        "La clase de impuesto seleccionada no admite el cálculo porcentual disponible.",
        "estado-calculo-advertencia"
      );
      return;
    }

    const impuestoCalculado = calcularPorcentaje(subtotalCalculado, tarifa);
    const totalCalculado = subtotalCalculado + impuestoCalculado;

    valorImpuesto.value = formatearEscala(impuestoCalculado);
    total.value = formatearEscala(totalCalculado);

    mostrarEstado(
      "Cálculo porcentual actualizado correctamente. Los importes se muestran con hasta seis decimales.",
      "estado-calculo-correcto"
    );
  }

  function crearErrorValidacion(campo, mensaje, marcarError = true) {
    if (marcarError) {
      campo.setAttribute("aria-invalid", "true");
    }

    return {
      valido: false,
      campo,
      mensaje
    };
  }

  function limpiarValidacionFactura() {
    formulario.querySelectorAll('[aria-invalid="true"]').forEach((campo) => {
      campo.removeAttribute("aria-invalid");
    });
  }

  function leerNumeroParaJson(
    campo,
    nombre,
    debeSerMayorQueCero = false,
    marcarErrores = true
  ) {
    const texto = campo.value.trim();
    const valor = Number(texto);

    if (
      texto === "" ||
      texto.includes(",") ||
      campo.validity.badInput ||
      !Number.isFinite(valor)
    ) {
      return crearErrorValidacion(
        campo,
        `${nombre} debe ser un número válido. Usa punto para los decimales.`,
        marcarErrores
      );
    }

    if (debeSerMayorQueCero ? valor <= 0 : valor < 0) {
      return crearErrorValidacion(
        campo,
        debeSerMayorQueCero
          ? `${nombre} debe ser mayor que cero.`
          : `${nombre} no puede ser negativo.`,
        marcarErrores
      );
    }

    return {
      valido: true,
      valor
    };
  }

  function construirFacturaMinima({ marcarErrores = true } = {}) {
    if (marcarErrores) {
      limpiarValidacionFactura();
    }

    const errorValidacion = (campo, mensaje) =>
      crearErrorValidacion(campo, mensaje, marcarErrores);

    const camposRequeridos = [
      [nitEmisor, "NIT del emisor"],
      [numeroResolucion, "Número de resolución"],
      [consecutivo, "Consecutivo"],
      [fechaVencimiento, "Fecha de vencimiento"],
      [formaPago, "Forma de pago"],
      [nombreCliente, "Nombre o razón social del cliente"],
      [tipoIdentificacion, "Tipo de identificación del cliente"],
      [numeroIdentificacion, "Número de identificación del cliente"],
      [naturalezaCliente, "Naturaleza del cliente"],
      [codigoItem, "Código del producto o servicio"],
      [nombreItem, "Nombre del producto o servicio"],
      [precioUnitario, "Precio base unitario"],
      [cantidad, "Cantidad"],
      [unidadItem, "Unidad"],
      [tipoImpuesto, "Tipo de impuesto"],
      [claseImpuesto, "Clase de impuesto"],
      [tarifaTributo, "Tarifa del tributo"]
    ];

    for (const [campo, nombre] of camposRequeridos) {
      if (campo.value.trim() === "") {
        return errorValidacion(campo, `Completa el campo ${nombre}.`);
      }

      if (!campo.validity.valid) {
        return errorValidacion(
          campo,
          `Revisa el formato del campo ${nombre}.`
        );
      }
    }

    const nit = nitEmisor.value.trim();
    const resolucion = numeroResolucion.value.trim();
    const numeroConsecutivo = consecutivo.value.trim();
    const textoPrefijo = prefijo.value.trim();
    const razonSocial = nombreCliente.value.trim();
    const identificacionCliente = numeroIdentificacion.value.trim();
    const codigoProducto = codigoItem.value.trim();
    const nombreProducto = nombreItem.value.trim();

    if (!/^[A-Za-z0-9]{3,13}$/.test(nit)) {
      return errorValidacion(
        nitEmisor,
        "El NIT debe contener entre 3 y 13 caracteres alfanuméricos, sin dígito de verificación."
      );
    }

    if (!/^\d{1,14}$/.test(resolucion)) {
      return errorValidacion(
        numeroResolucion,
        "La resolución debe contener únicamente números y máximo 14 dígitos."
      );
    }

    if (!/^\d{1,9}$/.test(numeroConsecutivo)) {
      return errorValidacion(
        consecutivo,
        "El consecutivo debe contener entre 1 y 9 dígitos."
      );
    }

    if (textoPrefijo !== "" && !/^[A-Za-z0-9]{1,4}$/.test(textoPrefijo)) {
      return errorValidacion(
        prefijo,
        "El prefijo solo puede contener hasta 4 caracteres alfanuméricos."
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento.value) ||
      !fechaVencimiento.validity.valid
    ) {
      return errorValidacion(
        fechaVencimiento,
        "La fecha de vencimiento debe tener el formato AAAA-MM-DD."
      );
    }

    const codigosMediosPago = Array.from(
      mediosPago.selectedOptions,
      (opcion) => opcion.value
    ).filter(Boolean);

    if (codigosMediosPago.length === 0) {
      return errorValidacion(
        mediosPago,
        "Selecciona al menos un medio de pago."
      );
    }

    if (!/^\d{3,13}$/.test(identificacionCliente)) {
      return errorValidacion(
        numeroIdentificacion,
        "La identificación del cliente debe contener entre 3 y 13 dígitos."
      );
    }

    if (razonSocial.length < 5 || razonSocial.length > 255) {
      return errorValidacion(
        nombreCliente,
        "El nombre o razón social debe contener entre 5 y 255 caracteres."
      );
    }

    if (codigoProducto.length === 0 || codigoProducto.length > 15) {
      return errorValidacion(
        codigoItem,
        "El código del producto o servicio debe contener máximo 15 caracteres."
      );
    }

    if (nombreProducto.length < 4 || nombreProducto.length > 1000) {
      return errorValidacion(
        nombreItem,
        "El nombre del producto o servicio debe contener entre 4 y 1000 caracteres."
      );
    }

    if (claseImpuesto.value !== CLASE_PORCENTUAL) {
      return errorValidacion(
        claseImpuesto,
        "La factura solo está disponible para impuestos porcentuales (PO)."
      );
    }

    const precioJson = leerNumeroParaJson(
      precioUnitario,
      "El precio base unitario",
      false,
      marcarErrores
    );

    if (!precioJson.valido) {
      return precioJson;
    }

    const cantidadJson = leerNumeroParaJson(
      cantidad,
      "La cantidad",
      true,
      marcarErrores
    );

    if (!cantidadJson.valido) {
      return cantidadJson;
    }

    const tarifaJson = leerNumeroParaJson(
      tarifaTributo,
      "La tarifa del tributo",
      false,
      marcarErrores
    );

    if (!tarifaJson.valido) {
      return tarifaJson;
    }

    if (
      (tipoImpuesto.value === "EXE" || tipoImpuesto.value === "EXC") &&
      tarifaJson.valor !== 0
    ) {
      return errorValidacion(
        tarifaTributo,
        "Los impuestos EXE y EXC deben utilizar clase PO y tarifa 0 según la guía de Clarisa."
      );
    }

    const totalCalculado = total.value.trim();

    if (
      subtotal.value.trim() === "" ||
      valorImpuesto.value.trim() === "" ||
      !/^\d+(?:\.\d+)?$/.test(totalCalculado) ||
      !Number.isFinite(Number(totalCalculado))
    ) {
      return errorValidacion(
        total,
        "No fue posible obtener un total calculado válido. Revisa los datos del producto y del impuesto."
      );
    }

    return {
      valido: true,
      factura: {
        nit,
        numeroResolucion: resolucion,
        consecutivoDcto: numeroConsecutivo,
        prefijoDcto: textoPrefijo,
        fechaVencimiento: fechaVencimiento.value,
        formaPago: formaPago.value,
        mediosPago: codigosMediosPago,
        total: totalCalculado,
        cliente: {
          nombreRazonSocial: razonSocial,
          tipoIdentificacion: tipoIdentificacion.value,
          numIdentificacion: identificacionCliente,
          naturaleza: naturalezaCliente.value
        },
        items: [
          {
            codigo: codigoProducto,
            nombreItem: nombreProducto,
            precioBaseUnitario: precioJson.valor,
            cantidad: cantidadJson.valor,
            unidad: unidadItem.value,
            impuestos: [
              {
                tipo: tipoImpuesto.value,
                claseImpuesto: claseImpuesto.value,
                tarifaTributo: tarifaJson.valor
              }
            ]
          }
        ]
      }
    };
  }

  function invalidarVistaPrevia() {
    vistaPrevia.hidden = true;
    contenidoVistaPrevia.textContent = "";
    estadoVistaPrevia.textContent = "";
    estadoVistaPrevia.classList.remove(
      "estado-json-error",
      "estado-json-correcto"
    );
  }

  function mostrarVistaPrevia() {
    const resultado = construirFacturaMinima();

    if (!resultado.valido) {
      vistaPrevia.hidden = true;
      contenidoVistaPrevia.textContent = "";
      estadoVistaPrevia.textContent = resultado.mensaje;
      estadoVistaPrevia.classList.remove("estado-json-correcto");
      estadoVistaPrevia.classList.add("estado-json-error");
      resultado.campo.focus();
      return;
    }

    contenidoVistaPrevia.textContent = JSON.stringify(
      resultado.factura,
      null,
      2
    );
    vistaPrevia.hidden = false;
    estadoVistaPrevia.textContent =
      "JSON mínimo generado localmente. No se realizó ninguna solicitud HTTP.";
    estadoVistaPrevia.classList.remove("estado-json-error");
    estadoVistaPrevia.classList.add("estado-json-correcto");
  }

  function mostrarEstadoEnvio(mensaje = "", tipo = null) {
    estadoEnvio.textContent = mensaje;
    estadoEnvio.classList.remove(
      "estado-envio-error",
      "estado-envio-correcto"
    );

    if (tipo) {
      estadoEnvio.classList.add(`estado-envio-${tipo}`);
    }
  }

  function sesionPantherActiva() {
    try {
      const tokenPanther = sessionStorage.getItem(CLAVE_TOKEN_PANTHER);

      return typeof tokenPanther === "string" && tokenPanther.trim() !== "";
    } catch (error) {
      return false;
    }
  }

  function obtenerTokenPanther() {
    try {
      const tokenPanther = sessionStorage.getItem(CLAVE_TOKEN_PANTHER);

      return typeof tokenPanther === "string" ? tokenPanther.trim() : "";
    } catch (error) {
      return "";
    }
  }

  function ocultarConfirmacionFactura() {
    confirmacionFactura.hidden = true;
    datosConfirmacionFactura.textContent = "";
  }

  function mensajeDeClarisa(contenido, alternativo) {
    const LIMITE_MENSAJES = 5;
    const LIMITE_CARACTERES_MENSAJE = 300;
    const LIMITE_CARACTERES_TOTAL = 1200;
    const payload = contenido?.data?.respuestaClarisa || contenido;
    const mensajesDetallados = [];
    const mensajesVistos = new Set();

    function normalizarMensaje(valor) {
      if (typeof valor !== "string") {
        return null;
      }

      const mensaje = valor
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!mensaje) {
        return null;
      }

      return mensaje.length > LIMITE_CARACTERES_MENSAJE
        ? `${mensaje.slice(0, LIMITE_CARACTERES_MENSAJE - 1)}…`
        : mensaje;
    }

    function agregarMensaje(valor) {
      const mensaje = normalizarMensaje(valor);

      if (!mensaje || mensajesDetallados.length >= LIMITE_MENSAJES) {
        return;
      }

      const clave = mensaje.toLocaleLowerCase();

      if (!mensajesVistos.has(clave)) {
        mensajesVistos.add(clave);
        mensajesDetallados.push(mensaje);
      }
    }

    function extraerErrores(valor) {
      if (valor == null || mensajesDetallados.length >= LIMITE_MENSAJES) {
        return;
      }

      if (typeof valor === "string") {
        agregarMensaje(valor);
        return;
      }

      if (Array.isArray(valor)) {
        valor.forEach(extraerErrores);
        return;
      }

      if (typeof valor !== "object") {
        return;
      }

      ["errorMessage", "message", "mensaje", "detalle"].forEach((clave) => {
        agregarMensaje(valor[clave]);
      });
      ["errores", "errors"].forEach((clave) => {
        extraerErrores(valor[clave]);
      });
    }

    const mensajeGeneral = [
      payload?.textResponse,
      payload?.errorMessage,
      payload?.message,
      payload?.mensaje,
      payload?.detalle,
      payload?.data?.textResponse,
      payload?.data?.message,
      payload?.data?.mensaje,
      payload?.data?.detalle,
      contenido?.data?.mensaje,
      typeof contenido?.data === "string" ? contenido.data : null
    ].map(normalizarMensaje).find(Boolean) || null;

    [
      payload?.data?.errores?.errores,
      payload?.data?.errores,
      payload?.data?.errors,
      payload?.errores?.errores,
      payload?.errores,
      payload?.errors
    ].forEach(extraerErrores);

    const detallesUnicos = mensajesDetallados.filter(
      (mensaje) => mensaje.toLocaleLowerCase() !== mensajeGeneral?.toLocaleLowerCase()
    );
    let mensaje = mensajeGeneral;

    if (mensajeGeneral && detallesUnicos.length > 0) {
      const separador = /[.!?]$/.test(mensajeGeneral) ? " " : ". ";
      mensaje = `${mensajeGeneral}${separador}Detalles: ${detallesUnicos.join("; ")}`;
    } else if (detallesUnicos.length > 0) {
      mensaje = detallesUnicos.join("; ");
    }

    if (!mensaje) {
      return alternativo;
    }

    return mensaje.length > LIMITE_CARACTERES_TOTAL
      ? `${mensaje.slice(0, LIMITE_CARACTERES_TOTAL - 1)}…`
      : mensaje;
  }

  function sanitizarConfirmacion(valor) {
    if (typeof valor === "string") {
      return valor
        .replace(/(Bearer\s+)[A-Za-z0-9._~+/=\-]{8,}/gi, "$1[dato protegido]")
        .replace(
          /((?:token|authorization|password|contrase(?:n|ñ)a|credential|secret|api[_ -]?key)\s*[:=]\s*["']?)[^\s,;"']+/gi,
          "$1[dato protegido]"
        );
    }

    if (Array.isArray(valor)) {
      return valor.map(sanitizarConfirmacion);
    }

    if (!valor || typeof valor !== "object") {
      return valor;
    }

    return Object.fromEntries(
      Object.entries(valor)
        .filter(
          ([clave]) =>
            !/(?:authorization|contrase(?:n|ñ)a|credential|password|secret|token|api[_ -]?key|stack|trace|exception|sql|query|ruta|path|server|servidor)/i.test(
              clave
            )
        )
        .map(([clave, dato]) => [clave, sanitizarConfirmacion(dato)])
    );
  }

  function extraerConfirmacion(payload) {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    return {
      state: typeof payload.state === "string" ? payload.state : null,
      code: Number.isInteger(Number(payload.code)) ? Number(payload.code) : null,
      data: sanitizarConfirmacion(payload.data ?? null)
    };
  }

  function mostrarConfirmacion(payload) {
    const confirmacion = extraerConfirmacion(payload);

    if (confirmacion === null) {
      ocultarConfirmacionFactura();
      return;
    }

    datosConfirmacionFactura.textContent = JSON.stringify(
      confirmacion,
      null,
      2
    );
    confirmacionFactura.hidden = false;
  }

  function actualizarDisponibilidadEnvio() {
    const resultado = construirFacturaMinima({ marcarErrores: false });
    const sesionActiva = sesionPantherActiva();

    botonEnviar.disabled =
      !resultado.valido || !sesionActiva || envioEnCurso || facturaConfirmada;
    botonEnviar.textContent = envioEnCurso ? "Emitiendo..." : "Emitir factura";

    if (envioEnCurso) {
      botonEnviar.title = "Panther está procesando la factura";
    } else if (facturaConfirmada) {
      botonEnviar.title = estadoUltimaFactura === "INCIERTA"
        ? "La factura está en validación y no debe reenviarse"
        : "La factura ya fue confirmada; modifica algún dato para preparar otra";
    } else if (!sesionActiva) {
      botonEnviar.title = "Inicia sesión en Panther para preparar la emisión";
    } else if (!resultado.valido) {
      botonEnviar.title = "Completa correctamente todos los datos de la factura";
    } else {
      botonEnviar.title = "Emitir la factura de forma segura mediante Panther";
    }
  }

  async function prepararEmision(evento) {
    evento.preventDefault();

    if (envioEnCurso || facturaConfirmada) {
      return;
    }

    const resultado = construirFacturaMinima();

    if (!resultado.valido) {
      mostrarEstadoEnvio(resultado.mensaje, "error");
      resultado.campo.focus();
      actualizarDisponibilidadEnvio();
      return;
    }

    if (!sesionPantherActiva()) {
      mostrarEstadoEnvio(
        "La sesión de Panther no está disponible. Inicia sesión nuevamente.",
        "error"
      );
      actualizarDisponibilidadEnvio();
      return;
    }

    const tokenPanther = obtenerTokenPanther();

    envioEnCurso = true;
    ocultarConfirmacionFactura();
    mostrarEstadoEnvio("Panther está procesando la factura...");
    actualizarDisponibilidadEnvio();

    try {
      const respuesta = await fetch(FACTURACION_ENDPOINT, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenPanther}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(resultado.factura)
      });

      let contenido;

      try {
        contenido = await respuesta.json();
      } catch (error) {
        throw new Error(
          "Panther devolvió una respuesta que no es JSON válido."
        );
      }

      const codigoPanther = Number(contenido && contenido.code);
      mostrarConfirmacion(contenido);

      if (!respuesta.ok || codigoPanther !== respuesta.status) {
        if (respuesta.status === 401 || codigoPanther === 401) {
          try {
            sessionStorage.removeItem(CLAVE_TOKEN_PANTHER);
          } catch (error) {
            // La sesión ya no puede reutilizarse aunque el navegador bloquee el almacenamiento.
          }
        }

        throw new Error(
          mensajeDeClarisa(
            contenido,
            `Panther rechazó la solicitud HTTP ${respuesta.status}.`
          )
        );
      }

      const estadoFactura = contenido && contenido.data
        ? contenido.data.estado
        : null;

      if (
        !contenido ||
        contenido.state !== "OK" ||
        codigoPanther !== 200 ||
        !contenido.data ||
        (estadoFactura !== "ACEPTADA" && estadoFactura !== "INCIERTA")
      ) {
        throw new Error(
          "Panther respondió sin confirmar el estado de la factura."
        );
      }

      facturaConfirmada = true;
      estadoUltimaFactura = estadoFactura;
      mostrarEstadoEnvio(
        mensajeDeClarisa(
          contenido,
          estadoFactura === "INCIERTA"
            ? "La factura está en proceso de validación y no se reenviará automáticamente."
            : "Panther confirmó el registro de la factura."
        ),
        estadoFactura === "ACEPTADA" ? "correcto" : null
      );
    } catch (error) {
      mostrarEstadoEnvio(
        error instanceof Error
          ? error.message
          : "No fue posible completar la solicitud de facturación.",
        "error"
      );
    } finally {
      envioEnCurso = false;
      actualizarDisponibilidadEnvio();
    }
  }

  function manejarCambioFormulario(evento) {
    evento.target.removeAttribute("aria-invalid");
    facturaConfirmada = false;
    estadoUltimaFactura = null;
    invalidarVistaPrevia();
    ocultarConfirmacionFactura();
    mostrarEstadoEnvio();
    actualizarDisponibilidadEnvio();
  }

  function ocultarSeccionesDelSistema() {
    IDENTIFICADORES_SECCIONES.forEach((identificador) => {
      const seccion = document.getElementById(identificador);

      if (seccion) {
        seccion.hidden = true;
      }
    });

    enlacesMenu.forEach((enlace) => enlace.classList.remove("activo"));
  }

  function mostrarFacturacion(evento) {
    evento.preventDefault();
    ocultarSeccionesDelSistema();
    seccionFacturacion.hidden = false;
    enlaceFacturacion.classList.add("activo");

    if (tituloTopbar) {
      tituloTopbar.textContent = "Facturación";
    }

    if (subtituloTopbar) {
      subtituloTopbar.textContent = "Preparación y vista previa de facturas";
    }

    actualizarDisponibilidadEnvio();
  }

  function limpiarAlCerrarSesion() {
    formulario.reset();
    envioEnCurso = false;
    facturaConfirmada = false;
    estadoUltimaFactura = null;
    seccionFacturacion.hidden = true;
    invalidarVistaPrevia();
    ocultarConfirmacionFactura();
    mostrarEstadoEnvio();
  }


  [precioUnitario, cantidad, tarifaTributo].forEach((campo) => {
    campo.addEventListener("input", actualizarCalculos);
  });

  [tipoImpuesto, claseImpuesto].forEach((campo) => {
    campo.addEventListener("change", actualizarCalculos);
  });

  botonVistaPrevia.addEventListener("click", mostrarVistaPrevia);

  formulario.addEventListener("input", manejarCambioFormulario);
  formulario.addEventListener("change", manejarCambioFormulario);

  formulario.addEventListener("submit", prepararEmision);
  enlaceFacturacion.addEventListener("click", mostrarFacturacion);

  enlacesMenu.forEach((enlace) => {
    if (enlace === enlaceFacturacion) {
      return;
    }

    enlace.addEventListener("click", () => {
      seccionFacturacion.hidden = true;
      enlaceFacturacion.classList.remove("activo");
    });
  });

  if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener("click", limpiarAlCerrarSesion);
  }

  formulario.addEventListener("reset", () => {
    envioEnCurso = false;
    facturaConfirmada = false;
    estadoUltimaFactura = null;
    invalidarVistaPrevia();
    ocultarConfirmacionFactura();
    mostrarEstadoEnvio();
    window.setTimeout(() => {
      actualizarCalculos();
      actualizarDisponibilidadEnvio();
    }, 0);
  });

  actualizarCalculos();
  actualizarDisponibilidadEnvio();
})();
