(function () {
  "use strict";

  var IVA = 0.19;
  var VALOR_HORA_DEFAULT = 25000;
  var UTILIDAD_DEFAULT = 10;
  var API = "facturas";

  var ordenActual = null;
  var listaFacturas = [];

  function $(id) {
    return document.getElementById(id);
  }

  function money(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(Number(n) || 0);
  }

  function toast(msg, tipo) {
    var el = $("facToast");
    if (!el) return;
    el.textContent = msg;
    el.className = "fac-toast fac-toast-" + (tipo || "ok");
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 3200);
  }

  function obtenerToken() {
    var sesion = typeof window.obtenerSesion === "function" ? window.obtenerSesion() : null;
    return (sesion && sesion.keyAPI) || sessionStorage.getItem("olimac_panther_token") || "";
  }

  async function apiFacturas(ruta, opciones) {
    var opts = opciones || {};
    var headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    var token = obtenerToken();
    if (token) {
      headers.Authorization = token;
      headers.keyAPI = token;
    }
    var resultado = await pantherFetch(ruta, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body !== undefined ? opts.body : undefined
    });
    if (!resultado.respuesta.ok) {
      var detalle =
        (resultado.json && typeof resultado.json.data === "string" && resultado.json.data) ||
        "La operación de facturación no se pudo completar.";
      var err = new Error(detalle);
      err.status = resultado.respuesta.status;
      err.payload = resultado.json;
      throw err;
    }
    return resultado.json;
  }

  function sumarRepuestos(items) {
    return (items || []).reduce(function (acc, r) {
      var sub = Number(r.subtotal);
      if (isNaN(sub)) {
        sub = (Number(r.cantidad) || 0) * (Number(r.precio_unitario) || 0);
      }
      return acc + sub;
    }, 0);
  }

  function calcular(repuestos, horas, valorHora, utilidadPct) {
    var subRep = Number(repuestos) || 0;
    var hrs = Number(horas) || 0;
    var vh = Number(valorHora) || 0;
    var util = Number(utilidadPct) || 0;
    var mano = Math.round(hrs * vh * 100) / 100;
    var utilidad = Math.round((subRep + mano) * (util / 100) * 100) / 100;
    var base = Math.round((subRep + mano + utilidad) * 100) / 100;
    var iva = Math.round(base * IVA * 100) / 100;
    var total = Math.round((base + iva) * 100) / 100;
    return {
      subtotal_repuestos: subRep,
      mano_obra: mano,
      utilidad: utilidad,
      subtotal: base,
      iva: iva,
      total: total
    };
  }

  function pintarLiquidacion(liq) {
    $("facSubRepuestos").textContent = money(liq.subtotal_repuestos);
    $("facManoObra").textContent = money(liq.mano_obra);
    $("facUtilidad").textContent = money(liq.utilidad);
    $("facBase").textContent = money(liq.subtotal);
    $("facIva").textContent = money(liq.iva);
    $("facTotal").textContent = money(liq.total);
  }

  function pintarRepuestos(items) {
    var tbody = $("facRepuestosBody");
    if (!tbody) return;
    if (!items || !items.length) {
      tbody.innerHTML =
        '<tr><td colspan="6">Sin repuestos en esta orden.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(function (r) {
        var cant = Number(r.cantidad) || 0;
        var precio = Number(r.precio_unitario) || 0;
        var sub = Number(r.subtotal);
        if (isNaN(sub)) sub = cant * precio;
        return (
          "<tr>" +
          "<td>" +
          (r.referencia || "—") +
          "</td>" +
          "<td>" +
          (r.descripcion || "—") +
          "</td>" +
          "<td>" +
          (r.marca || "—") +
          "</td>" +
          "<td>" +
          cant +
          "</td>" +
          "<td>" +
          money(precio) +
          "</td>" +
          "<td>" +
          money(sub) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function actualizarCalculo() {
    if (!ordenActual) {
      pintarLiquidacion({
        subtotal_repuestos: 0,
        mano_obra: 0,
        utilidad: 0,
        subtotal: 0,
        iva: 0,
        total: 0
      });
      return;
    }
    var liq = calcular(
      ordenActual.subtotal_repuestos,
      ordenActual.horas,
      $("facValorHora").value,
      $("facUtilidadPct").value
    );
    pintarLiquidacion(liq);
  }

  function setBotonesFactura(habilitado) {
    var off = !habilitado;
    if ($("facBtnGuardar")) $("facBtnGuardar").disabled = off;
    if ($("facBtnEmitirClarisa")) $("facBtnEmitirClarisa").disabled = off;
  }

  function pintarEstadoClarisa(auth) {
    var caja = $("facClarisaEstado");
    var msg = $("facClarisaMensaje");
    if (!caja || !msg) return;
    var ok = Boolean(auth && auth.ok);
    caja.classList.toggle("is-ok", ok);
    caja.classList.toggle("is-error", !ok);
    msg.textContent =
      (auth && auth.mensaje) ||
      (ok
        ? "Conectado a Clarisa."
        : "Sin conexión con Clarisa. Puedes seguir usando el taller.");
  }

  function leerClarisaLocal() {
    if (typeof window.obtenerClarisaAuth === "function") {
      return window.obtenerClarisaAuth();
    }
    try {
      return JSON.parse(sessionStorage.getItem("olimac_clarisa_auth") || "null");
    } catch (e) {
      return null;
    }
  }

  async function refrescarEstadoClarisa() {
    pintarEstadoClarisa(leerClarisaLocal());
    try {
      var res = await apiFacturas(API + "/clarisa-estado");
      var data = res.data || {};
      if (data.clarisaAuth && typeof window.guardarClarisaAuth === "function") {
        window.guardarClarisaAuth({
          clarisaAuth: data.clarisaAuth,
          clarisaToken:
            typeof window.obtenerClarisaToken === "function"
              ? window.obtenerClarisaToken()
              : sessionStorage.getItem("olimac_clarisa_token")
        });
      }
      pintarEstadoClarisa(data.clarisaAuth || leerClarisaLocal());
    } catch (err) {
      /* ignore */
    }
  }

  async function reintentarClarisa() {
    var btn = $("facBtnReintentarClarisa");
    if (btn) btn.disabled = true;
    try {
      var res = await apiFacturas(API + "/clarisa-auth", {
        method: "POST",
        body: JSON.stringify({})
      });
      var data = res.data || {};
      if (typeof window.guardarClarisaAuth === "function") {
        window.guardarClarisaAuth(data);
      }
      pintarEstadoClarisa(data.clarisaAuth || null);
      toast(
        (data.clarisaAuth && data.clarisaAuth.mensaje) ||
          "Reintento Clarisa finalizado",
        data.clarisaAuth && data.clarisaAuth.ok ? "ok" : "aviso"
      );
    } catch (err) {
      toast(err.message || "No se pudo reautenticar Clarisa", "error");
      pintarEstadoClarisa({
        ok: false,
        mensaje: err.message || "No se pudo reconectar con Clarisa."
      });
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function limpiarOrden() {
    ordenActual = null;
    $("facResumenOrden").hidden = true;
    $("facRepuestosWrap").hidden = true;
    setBotonesFactura(false);
    actualizarCalculo();
  }

  function inferirTipoId(cedula) {
    var digitos = String(cedula || "").replace(/\D+/g, "");
    if (digitos.length >= 9 && digitos.length <= 10) {
      /* NIT colombiano típico sin DV ~9; cédulas suelen ser 6-10 */
    }
    if (digitos.length === 9) return "NI";
    return "CC";
  }

  function prellenarCamposClarisa(data) {
    if ($("facTipoId")) {
      $("facTipoId").value = inferirTipoId(data.cliente_cedula);
    }
    if ($("facNaturaleza")) {
      $("facNaturaleza").value =
        inferirTipoId(data.cliente_cedula) === "NI" ? "JURIDICA" : "NATURAL";
    }
    if ($("facRespFiscales") && !$("facRespFiscales").value) {
      $("facRespFiscales").value = "NOA";
    }
    if ($("facRespTributarias") && !$("facRespTributarias").value) {
      $("facRespTributarias").value = "IVA";
    }
    if ($("facFormaPago") && !$("facFormaPago").value) {
      $("facFormaPago").value = "1";
    }
    if ($("facPrefijo") && !$("facPrefijo").value) {
      $("facPrefijo").value = "SETP";
    }
  }

  function construirPayloadLocal() {
    return {
      orden_id: Number(ordenActual.id),
      valor_hora: Number($("facValorHora").value),
      porcentaje_utilidad: Number($("facUtilidadPct").value),
      estado_pago: $("facEstadoPago").value || "PENDIENTE",
      medio_pago: $("facMetodoPago").value || "EFECTIVO",
      forma_pago: $("facFormaPago") && $("facFormaPago").value === "2" ? "CREDITO" : "CONTADO",
      forma_pago_codigo: ($("facFormaPago") && $("facFormaPago").value) || "1",
      medio_pago_codigo: $("facMetodoPago").value || "EFECTIVO",
      prefijo: (($("facPrefijo") && $("facPrefijo").value) || "SETP").trim().toUpperCase(),
      observacion: $("facObservaciones").value || "",
      tipo_identificacion: ($("facTipoId") && $("facTipoId").value) || "CC",
      naturaleza: ($("facNaturaleza") && $("facNaturaleza").value) || "NATURAL",
      resp_fiscales: ($("facRespFiscales") && $("facRespFiscales").value) || "NOA",
      resp_tributarias: ($("facRespTributarias") && $("facRespTributarias").value) || "IVA",
      ciudad: ($("facCiudadDane") && $("facCiudadDane").value) || "",
      email_cliente:
        (ordenActual.raw && ordenActual.raw.cliente_correo) || "",
      num_identificacion:
        (ordenActual.raw && ordenActual.raw.cliente_cedula) || "",
      nombre_razon_social:
        (ordenActual.raw && ordenActual.raw.cliente_nombre) || "",
      direccion_cliente:
        (ordenActual.raw && ordenActual.raw.cliente_direccion) || "",
      telefono_cliente:
        (ordenActual.raw && ordenActual.raw.cliente_telefono) || "",
      clarisa_token:
        typeof window.obtenerClarisaToken === "function"
          ? window.obtenerClarisaToken()
          : sessionStorage.getItem("olimac_clarisa_token") || ""
    };
  }

  function mostrarRespuestaClarisa(bloque) {
    var caja = $("facClarisaRespuesta");
    if (!caja) return;
    var c = bloque || {};
    $("facClarisaResEstado").textContent = c.estado || (c.ok ? "OK" : "ERROR");
    $("facClarisaResHttp").textContent = c.httpCode != null ? String(c.httpCode) : "—";
    $("facClarisaResCufe").textContent = c.cufe || "Aún no reportado";
    $("facClarisaResMensaje").textContent = c.mensaje || "";
    $("facClarisaResJson").textContent = JSON.stringify(
      c.respuesta != null ? c.respuesta : c,
      null,
      2
    );
    caja.hidden = false;
  }

  function cerrarRespuestaClarisa() {
    var caja = $("facClarisaRespuesta");
    if (caja) caja.hidden = true;
  }

  async function cargarOrdenesFacturables() {
    var select = $("facOrdenSelect");
    select.innerHTML = '<option value="">Cargando órdenes…</option>';
    try {
      var res = await apiFacturas(API + "/ordenes-facturables");
      var rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) {
        select.innerHTML =
          '<option value="">No hay órdenes pendientes de facturar</option>';
        limpiarOrden();
        return;
      }
      select.innerHTML =
        '<option value="">Seleccione una orden…</option>' +
        rows
          .map(function (o) {
            var label =
              (o.codigo_orden || "#" + o.id) +
              " · " +
              (o.placa || "S/P") +
              " · " +
              (o.cliente_nombre || "Cliente") +
              " · " +
              (o.estado || "");
            return '<option value="' + o.id + '">' + label + "</option>";
          })
          .join("");
    } catch (err) {
      select.innerHTML = '<option value="">Error al cargar órdenes</option>';
      toast(err.message || "No se pudieron cargar las órdenes", "error");
    }
  }

  async function onOrdenChange() {
    var id = $("facOrdenSelect").value;
    if (!id) {
      limpiarOrden();
      return;
    }
    try {
      var res = await apiFacturas(API + "/preview-orden/" + id);
      var data = res.data || {};
      var preview = data.preview || {};
      ordenActual = {
        id: data.id,
        horas: Number(data.horas) || 0,
        subtotal_repuestos:
          preview.subtotal_repuestos != null
            ? Number(preview.subtotal_repuestos)
            : sumarRepuestos(data.repuestos),
        repuestos: data.repuestos || [],
        raw: data
      };

      $("facClienteNombre").textContent = data.cliente_nombre || "—";
      $("facClienteDoc").textContent = data.cliente_cedula || "—";
      $("facClienteTel").textContent = data.cliente_telefono || "—";
      $("facClienteCorreo").textContent = data.cliente_correo || "—";
      $("facClienteDir").textContent = data.cliente_direccion || "—";
      $("facVehiculoPlaca").textContent = data.placa || "—";
      $("facVehiculoInfo").textContent =
        [data.vehiculo_marca, data.vehiculo_modelo, data.vehiculo_color]
          .filter(Boolean)
          .join(" · ") || "—";
      $("facMecanico").textContent = data.empleado_nombre || "Sin asignar";
      $("facHoras").textContent = Number(data.horas || 0);
      $("facIngreso").textContent = data.fecha_ingreso || "—";
      $("facValorHora").value =
        preview.valor_hora != null ? preview.valor_hora : VALOR_HORA_DEFAULT;
      $("facUtilidadPct").value =
        preview.porcentaje_utilidad != null
          ? preview.porcentaje_utilidad
          : UTILIDAD_DEFAULT;

      pintarRepuestos(data.repuestos || []);
      prellenarCamposClarisa(data);
      $("facResumenOrden").hidden = false;
      $("facRepuestosWrap").hidden = false;
      setBotonesFactura(true);
      actualizarCalculo();
    } catch (err) {
      limpiarOrden();
      toast(err.message || "No se pudo cargar la orden", "error");
    }
  }

  async function guardarFactura() {
    if (!ordenActual) return;
    var payload = construirPayloadLocal();
    setBotonesFactura(false);
    try {
      var res = await apiFacturas(API, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      var num = (res.data && res.data.numero_documento) || "";
      toast("Factura " + num + " guardada en el taller (sin Clarisa)", "ok");
      $("facOrdenSelect").value = "";
      $("facObservaciones").value = "";
      limpiarOrden();
      await Promise.all([
        cargarOrdenesFacturables(),
        cargarFacturas(),
        cargarKpis()
      ]);
    } catch (err) {
      toast(err.message || "No se pudo guardar la factura", "error");
      setBotonesFactura(true);
    }
  }

  async function emitirFacturaClarisa(facturaIdOpcional) {
    var payload;
    if (facturaIdOpcional) {
      payload = {
        factura_id: Number(facturaIdOpcional),
        tipo_identificacion: ($("facTipoId") && $("facTipoId").value) || "CC",
        naturaleza: ($("facNaturaleza") && $("facNaturaleza").value) || "NATURAL",
        resp_fiscales: ($("facRespFiscales") && $("facRespFiscales").value) || "NOA",
        resp_tributarias:
          ($("facRespTributarias") && $("facRespTributarias").value) || "IVA",
        ciudad: ($("facCiudadDane") && $("facCiudadDane").value) || "",
        forma_pago_codigo: ($("facFormaPago") && $("facFormaPago").value) || "1",
        medio_pago_codigo: ($("facMetodoPago") && $("facMetodoPago").value) || "EFECTIVO",
        clarisa_token:
          typeof window.obtenerClarisaToken === "function"
            ? window.obtenerClarisaToken()
            : sessionStorage.getItem("olimac_clarisa_token") || ""
      };
    } else {
      if (!ordenActual) return;
      payload = construirPayloadLocal();
    }

    setBotonesFactura(false);
    try {
      var res = await apiFacturas(API + "/emitir-clarisa", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      var data = res.data || {};
      var clarisa = data.clarisa || {};
      mostrarRespuestaClarisa(clarisa);
      var num =
        (data.factura && data.factura.numero_documento) ||
        (facturaIdOpcional ? "#" + facturaIdOpcional : "");
      if (clarisa.ok) {
        toast(
          "Factura " + num + " enviada a Clarisa" +
            (clarisa.cufe ? " · CUFE: " + clarisa.cufe : ""),
          "ok"
        );
      } else {
        toast(
          clarisa.mensaje || "Clarisa no aceptó la factura. Revisa el detalle.",
          "aviso"
        );
      }
      if (!facturaIdOpcional) {
        $("facOrdenSelect").value = "";
        $("facObservaciones").value = "";
        limpiarOrden();
      } else {
        setBotonesFactura(Boolean(ordenActual));
      }
      await Promise.all([
        cargarOrdenesFacturables(),
        cargarFacturas(),
        cargarKpis(),
        refrescarEstadoClarisa()
      ]);
    } catch (err) {
      toast(err.message || "No se pudo enviar a Clarisa", "error");
      if (err.payload && err.payload.data && err.payload.data.clarisa) {
        mostrarRespuestaClarisa(err.payload.data.clarisa);
      } else if (err.payload) {
        mostrarRespuestaClarisa({
          ok: false,
          mensaje: err.message,
          respuesta: err.payload
        });
      }
      setBotonesFactura(Boolean(ordenActual) || Boolean(facturaIdOpcional));
    }
  }

  function badgeEstado(estado) {
    var e = String(estado || "PENDIENTE").toUpperCase();
    var cls = "fac-badge fac-badge-pendiente";
    if (e === "PAGADA") cls = "fac-badge fac-badge-pagada";
    if (e === "ANULADA") cls = "fac-badge fac-badge-anulada";
    return '<span class="' + cls + '">' + e + "</span>";
  }

  function filtrarLocal() {
    var q = ($("facBuscar").value || "").trim().toLowerCase();
    var est = ($("facFiltroEstado").value || "").toUpperCase();
    return listaFacturas.filter(function (f) {
      if (est && String(f.estado_pago || "").toUpperCase() !== est) {
        return false;
      }
      if (!q) return true;
      var blob = [
        f.numero_documento,
        f.placa,
        f.cliente_nombre,
        f.cliente_cedula
      ]
        .join(" ")
        .toLowerCase();
      return blob.indexOf(q) !== -1;
    });
  }

  function pintarTabla() {
    var tbody = $("facTablaBody");
    var rows = filtrarLocal();
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="7">No hay facturas para mostrar.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (f) {
        var estado = String(f.estado_pago || "").toUpperCase();
        return (
          "<tr>" +
          "<td>" +
          (f.numero_documento || "—") +
          "</td>" +
          "<td>" +
          (f.fecha_emision || "—") +
          "</td>" +
          "<td>" +
          (f.cliente_nombre || "—") +
          "</td>" +
          "<td>" +
          (f.placa || "—") +
          "</td>" +
          "<td>" +
          money(f.total) +
          "</td>" +
          "<td>" +
          badgeEstado(estado) +
          "</td>" +
          "<td>" +
          '<div class="fac-acciones" style="margin:0;justify-content:flex-start">' +
          '<button type="button" class="rep-boton rep-boton-editar" data-ver="' +
          f.id +
          '">Ver / Imprimir</button>' +
          (estado !== "ANULADA" && !f.cufe
            ? '<button type="button" class="rep-boton rep-boton-principal" data-emitir-clarisa="' +
              f.id +
              '">Enviar a Clarisa</button>'
            : "") +
          (estado !== "PAGADA" && estado !== "ANULADA"
            ? '<button type="button" class="rep-boton rep-boton-principal" data-pagar="' +
              f.id +
              '">Marcar pagada</button>'
            : "") +
          (estado !== "ANULADA"
            ? '<button type="button" class="rep-boton rep-boton-eliminar" data-anular="' +
              f.id +
              '">Anular</button>'
            : "") +
          "</div>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function cargarFacturas() {
    try {
      var res = await apiFacturas(API);
      listaFacturas = Array.isArray(res.data) ? res.data : [];
      pintarTabla();
    } catch (err) {
      $("facTablaBody").innerHTML =
        '<tr><td colspan="7">Error al cargar facturas.</td></tr>';
      toast(err.message || "Error al listar facturas", "error");
    }
  }

  async function cargarKpis() {
    try {
      var res = await apiFacturas(API + "/resumen");
      var d = res.data || {};
      $("kpiTotalFacturado").textContent = money(d.total_facturado);
      $("kpiPagadas").textContent = d.facturas_pagadas || 0;
      $("kpiPendientes").textContent = d.facturas_pendientes || 0;
      $("kpiIva").textContent = money(d.iva_recaudado);
    } catch (err) {
      /* KPIs no bloquean el módulo */
    }
  }

  function cerrarPrint() {
    $("facPrint").hidden = true;
    $("facComprobante").innerHTML = "";
  }

  function ivaDeFactura(f) {
    if (f.liquidacion && f.liquidacion.iva != null) return f.liquidacion.iva;
    return f.impuestos;
  }

  function renderComprobante(f) {
    var items = f.repuestos || [];
    var filas = items.length
      ? items
          .map(function (r) {
            return (
              "<tr><td>" +
              (r.referencia || "") +
              "</td><td>" +
              (r.descripcion || "") +
              "</td><td>" +
              (r.marca || "") +
              "</td><td>" +
              (r.cantidad || 0) +
              "</td><td>" +
              money(r.precio_unitario) +
              "</td><td>" +
              money(r.subtotal) +
              "</td></tr>"
            );
          })
          .join("")
      : '<tr><td colspan="6">Sin repuestos</td></tr>';

    return (
      '<div class="fac-comprobante">' +
      "<h1>Olimac Riders Store</h1>" +
      "<p>Taller mecánico · Factura de servicio</p>" +
      '<div class="fac-comprobante-meta">' +
      "<div><strong>Factura:</strong> " +
      (f.numero_documento || "") +
      "</div>" +
      "<div><strong>Fecha emisión:</strong> " +
      (f.fecha_emision || "") +
      "</div>" +
      "<div><strong>Orden:</strong> " +
      (f.codigo_orden || "#" + (f.orden_id || "")) +
      "</div>" +
      "<div><strong>Estado:</strong> " +
      (f.estado_pago || "") +
      "</div>" +
      "</div>" +
      '<div class="fac-comprobante-grid">' +
      "<div><h3>Cliente</h3>" +
      "<p>" +
      (f.cliente_nombre || "—") +
      "<br>Doc: " +
      (f.cliente_cedula || "—") +
      "<br>Tel: " +
      (f.cliente_telefono || "—") +
      "<br>" +
      (f.cliente_correo || "") +
      "<br>" +
      (f.cliente_direccion || "") +
      "</p></div>" +
      "<div><h3>Vehículo</h3>" +
      "<p>Placa: " +
      (f.placa || "—") +
      "<br>" +
      [f.vehiculo_marca, f.vehiculo_modelo, f.vehiculo_color]
        .filter(Boolean)
        .join(" · ") +
      "<br>Ingreso: " +
      (f.fecha_ingreso || "—") +
      "<br>Mecánico: " +
      (f.empleado_nombre || "—") +
      "<br>Horas: " +
      (f.horas || 0) +
      "</p></div>" +
      "</div>" +
      "<h3>Repuestos utilizados</h3>" +
      "<table><thead><tr>" +
      "<th>Ref.</th><th>Descripción</th><th>Marca</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th>" +
      "</tr></thead><tbody>" +
      filas +
      "</tbody></table>" +
      "<p><strong>Subtotal repuestos:</strong> " +
      money(f.subtotal_repuestos) +
      "</p>" +
      "<p><strong>Mano de obra (" +
      (f.horas || 0) +
      " h × " +
      money(f.valor_hora) +
      "):</strong> " +
      money(f.mano_obra) +
      "</p>" +
      "<p><strong>Utilidad (" +
      (f.porcentaje_utilidad || 0) +
      "%):</strong> " +
      money(f.utilidad) +
      "</p>" +
      "<p><strong>Base gravable:</strong> " +
      money(f.subtotal) +
      "</p>" +
      "<p><strong>IVA (19%):</strong> " +
      money(ivaDeFactura(f)) +
      "</p>" +
      "<p><strong>Total a pagar:</strong> " +
      money(f.total) +
      "</p>" +
      (f.medio_pago
        ? "<p><strong>Medio de pago:</strong> " + f.medio_pago + "</p>"
        : "") +
      (f.observacion
        ? "<p><strong>Observaciones:</strong> " + f.observacion + "</p>"
        : "") +
      "</div>"
    );
  }

  async function verFactura(id) {
    try {
      var res = await apiFacturas(API + "/" + id);
      $("facComprobante").innerHTML = renderComprobante(res.data || {});
      $("facPrint").hidden = false;
    } catch (err) {
      toast(err.message || "No se pudo abrir la factura", "error");
    }
  }

  async function marcarPagada(id) {
    try {
      await apiFacturas(API + "/" + id, {
        method: "PUT",
        body: JSON.stringify({ estado_pago: "PAGADA" })
      });
      toast("Factura marcada como PAGADA", "ok");
      await Promise.all([cargarFacturas(), cargarKpis()]);
    } catch (err) {
      toast(err.message || "No se pudo actualizar", "error");
    }
  }

  async function anularFactura(id) {
    if (!window.confirm("¿Anular esta factura? Esta acción es irreversible.")) {
      return;
    }
    try {
      await apiFacturas(API + "/" + id, { method: "DELETE" });
      toast("Factura anulada", "aviso");
      await Promise.all([
        cargarFacturas(),
        cargarKpis(),
        cargarOrdenesFacturables()
      ]);
    } catch (err) {
      toast(err.message || "No se pudo anular", "error");
    }
  }

  function bindEvents() {
    $("facOrdenSelect").addEventListener("change", onOrdenChange);
    $("facValorHora").addEventListener("input", actualizarCalculo);
    $("facUtilidadPct").addEventListener("input", actualizarCalculo);
    $("facBtnGuardar").addEventListener("click", guardarFactura);
    if ($("facBtnEmitirClarisa")) {
      $("facBtnEmitirClarisa").addEventListener("click", function () {
        emitirFacturaClarisa(null);
      });
    }
    if ($("facBtnReintentarClarisa")) {
      $("facBtnReintentarClarisa").addEventListener("click", reintentarClarisa);
    }
    if ($("facBtnCerrarClarisaResp")) {
      $("facBtnCerrarClarisaResp").addEventListener("click", cerrarRespuestaClarisa);
    }
    $("facBuscar").addEventListener("input", pintarTabla);
    $("facFiltroEstado").addEventListener("change", pintarTabla);
    $("facBtnRefrescar").addEventListener("click", function () {
      Promise.all([
        cargarOrdenesFacturables(),
        cargarFacturas(),
        cargarKpis(),
        refrescarEstadoClarisa()
      ]);
    });
    $("facTablaBody").addEventListener("click", function (ev) {
      var btn = ev.target.closest("button");
      if (!btn) return;
      if (btn.dataset.ver) verFactura(btn.dataset.ver);
      if (btn.dataset.pagar) marcarPagada(btn.dataset.pagar);
      if (btn.dataset.anular) anularFactura(btn.dataset.anular);
      if (btn.dataset.emitirClarisa) emitirFacturaClarisa(btn.dataset.emitirClarisa);
    });
    $("facBtnCerrarPrint").addEventListener("click", cerrarPrint);
    $("facBtnImprimir").addEventListener("click", function () {
      window.print();
    });
    $("facPrint").addEventListener("click", function (ev) {
      if (ev.target === $("facPrint")) cerrarPrint();
    });
  }

  function iniciarModulo() {
    if (typeof window.protegerAccesoModulo === "function") {
      if (
        !window.protegerAccesoModulo("Facturación", {
          login: "login.html",
          panel: "panel-control.html"
        })
      ) {
        return;
      }
    } else if (
      typeof window.obtenerSesion === "function" &&
      !window.obtenerSesion()
    ) {
      window.location.replace("login.html");
      return;
    }

    var pagina = $("page-wrapper");
    if (pagina) {
      pagina.hidden = false;
      pagina.removeAttribute("hidden");
    }

    if (typeof window.montarNavbarApp === "function" && $("orsNavLinks")) {
      window.montarNavbarApp({
        incluirInicio: true,
        incluirPanel: true,
        destinoLogout: "index.html"
      });
    }

    bindEvents();
    limpiarOrden();
    pintarEstadoClarisa(leerClarisaLocal());
    Promise.all([
      cargarOrdenesFacturables(),
      cargarFacturas(),
      cargarKpis(),
      refrescarEstadoClarisa()
    ]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarModulo);
  } else {
    iniciarModulo();
  }
})();
