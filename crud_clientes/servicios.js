/* Servicios por cliente para crud_clientes (sin comillas invertidas).
   Agrega un botón "Servicios" en cada fila de #clientTableBody. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "$" + (+n || 0).toLocaleString("es-CO"); };
  var vivos = function (d) { return Array.isArray(d) ? d.filter(function (x) { return !x.dateDelete; }) : []; };
  var aviso = function (m) { return window.Swal ? Swal.fire({ icon: "error", title: "Error", text: m }) : alert(m); };

  var cliente = null;

  var HTML = [
    '<div class="modal fade" id="servModal" tabindex="-1" aria-hidden="true">',
    '<div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">',
    '<div class="modal-content border-0 shadow-lg rounded-4">',
    '<div class="modal-header border-0 pb-0">',
    '<h5 class="modal-title fw-bold" id="servTitulo">Servicios</h5>',
    '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>',
    '</div>',
    '<div class="modal-body">',
    '<div class="row g-2 mb-3">',
    '<div class="col-md-4"><label class="form-label fw-semibold" for="sFecha">Fecha</label><input type="date" class="form-control" id="sFecha"></div>',
    '<div class="col-md-4"><label class="form-label fw-semibold" for="sCosto">Costo</label><input type="number" min="0" step="1000" class="form-control" id="sCosto"></div>',
    '<div class="col-md-4"><label class="form-label fw-semibold" for="sEstado">Estado</label>',
    '<select class="form-select" id="sEstado"><option>Pendiente</option><option>En proceso</option><option>Terminado</option></select></div>',
    '<div class="col-md-12"><label class="form-label fw-semibold" for="sAuto">Vehículo</label><select class="form-select" id="sAuto"></select></div>',
    '<div class="col-12"><label class="form-label fw-semibold" for="sDesc">Descripción del servicio</label>',
    '<input type="text" class="form-control" id="sDesc" placeholder="Ej. Cambio de aceite y filtro"></div>',
    '<div class="col-12"><button type="button" class="btn btn-registrar" id="sGuardar">Agregar servicio</button></div>',
    '</div>',
    '<div id="sLista"></div>',
    '</div></div></div></div>'
  ].join("");

  function modal() {
    if (!$("#servModal")) {
      document.body.insertAdjacentHTML("beforeend", HTML);
      $("#sGuardar").onclick = guardar;
      $("#sLista").onclick = quitar;
    }
    return bootstrap.Modal.getOrCreateInstance($("#servModal"));
  }

  function cargar() {
    $("#sLista").innerHTML = '<p class="text-muted">Cargando...</p>';
    return Promise.all([
      Panther.listar("servicios").catch(function (e) { console.error("servicios:", e.message); return []; }),
      Panther.listar("autos").catch(function (e) { console.error("autos:", e.message); return []; })
    ]).then(function (r) {



      var misAutos = vivos(r[1]).filter(function (a) { return String(a.id_cliente) === String(cliente.id); });
      $("#sAuto").innerHTML = '<option value="">Sin vehículo</option>' + misAutos.map(function (a) {
        return '<option value="' + esc(a.id) + '">' + esc(a.placa) + ' · ' + esc(a.marca) + ' ' + esc(a.modelo) + '</option>';
      }).join("");
      var lista = vivos(r[0]).filter(function (s) { return String(s.id_cliente) === String(cliente.id); });
      var total = lista.reduce(function (t, s) { return t + (+s.costo || 0); }, 0);
      if (!lista.length) {
        $("#sLista").innerHTML = '<p class="text-muted">Este cliente aún no tiene servicios.</p>';
        return;
      }
      $("#sLista").innerHTML = lista.map(function (s) {
        var a = misAutos.filter(function (x) { return String(x.id) === String(s.id_auto); })[0];
        return '<div class="border rounded-3 p-3 mb-2 d-flex justify-content-between align-items-start gap-2">' +
          '<div><div class="fw-semibold">' + esc(s.descripcion) + '</div>' +
          '<small class="text-muted">' + esc(s.fecha) + ' · ' + money(s.costo) + (a ? ' · ' + esc(a.placa) : '') + '</small></div>' +
          '<div class="text-end"><span class="badge bg-secondary">' + esc(s.estado) + '</span><br>' +
          '<button class="btn btn-sm text-danger" data-del="' + esc(s.id) + '">Quitar</button></div></div>';
      }).join("") + '<div class="text-end fw-bold">Total: ' + money(total) + '</div>';
    }).catch(function (e) {
      $("#sLista").innerHTML = "";
      aviso(e.message);
    });
  }

  function guardar() {
    var desc = $("#sDesc").value.trim();
    if (!desc) return aviso("Escribe la descripción del servicio.");
    Panther.crear("servicios", {
      id_cliente: cliente.id,
      id_auto: $("#sAuto").value || null,
      fecha: $("#sFecha").value,
      descripcion: desc,
      costo: $("#sCosto").value || 0,
      estado: $("#sEstado").value
    }).then(function () {
      $("#sDesc").value = "";
      $("#sCosto").value = "";
      return cargar();
    }).catch(function (e) { aviso(e.message); });
  }

  function quitar(e) {
    var b = e.target.closest("[data-del]");
    if (!b) return;
    Panther.eliminar("servicios", b.dataset.del).then(cargar).catch(function (er) { aviso(er.message); });
  }

  function abrir(id, nombre) {
    cliente = { id: id, nombre: nombre };
    var m = modal();
    $("#servTitulo").textContent = "Servicios de " + nombre;
    $("#sFecha").value = new Date().toISOString().slice(0, 10);
    m.show();
    cargar();
  }

  function decorar() {
    document.querySelectorAll("#clientTableBody tr").forEach(function (tr) {
      if (tr.dataset.srv || tr.cells.length < 2) return;
      tr.dataset.srv = "1";
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-sm btn-outline-primary ms-1";
      b.textContent = "Servicios";
      b.onclick = function () { abrir(tr.cells[0].textContent.trim(), tr.cells[1].textContent.trim()); };
      tr.cells[tr.cells.length - 1].appendChild(b);
    });
  }

  var tbody = document.getElementById("clientTableBody");
  if (tbody) {
    new MutationObserver(decorar).observe(tbody, { childList: true });
    decorar();
  }
})();