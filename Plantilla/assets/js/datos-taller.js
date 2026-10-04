// Datos compartidos entre Repuestos, Inventario y Orden de servicio
function leerListaTaller(clave) {
  const raw = localStorage.getItem(clave);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function guardarListaTaller(clave, lista) {
  localStorage.setItem(clave, JSON.stringify(lista));
}

function obtenerRepuestos() {
  return leerListaTaller("olimac_repuestos");
}

function guardarRepuestos(lista) {
  guardarListaTaller("olimac_repuestos", lista);
}

function obtenerInventario() {
  return leerListaTaller("olimac_inventario");
}

function guardarInventario(lista) {
  guardarListaTaller("olimac_inventario", lista);
}

function obtenerOrdenes() {
  return leerListaTaller("olimac_ordenes");
}

function guardarOrdenes(lista) {
  guardarListaTaller("olimac_ordenes", lista);
}

function idOrden(orden) {
  return orden.id || orden.idServicio;
}

function siguienteIdOrden() {
  const nums = obtenerOrdenes().map(o => Number(String(idOrden(o) || "").replace(/\D/g, "")) || 0);
  const max = nums.length ? Math.max.apply(null, nums) : 0;
  return "SRV-" + String(max + 1).padStart(3, "0");
}

function buscarRepuesto(referencia) {
  return obtenerRepuestos().find(r => r.referencia === referencia);
}

function buscarInventario(referencia) {
  return obtenerInventario().find(i => i.referencia === referencia);
}

function ajustarStockTaller(lineas, signo) {
  const inventario = obtenerInventario();
  lineas.forEach(linea => {
    const item = inventario.find(i => i.referencia === linea.referencia);
    if (item) {
      item.stock = item.stock + (signo * Number(linea.cantidad));
      if (item.stock < 0) {
        item.stock = 0;
      }
    }
  });
  guardarInventario(inventario);
}
function ajustarStockTaller(lineas, signo) {
  const inventario = obtenerInventario();
  lineas.forEach(linea => {
    const item = inventario.find(i => i.referencia === linea.referencia);
    if (item) {
      item.stock = item.stock + (signo * Number(linea.cantidad));
      if (item.stock < 0) {
        item.stock = 0;
      }
    }
    // DATOS DE VEHÍCULOS
    function obtenerVehiculos() {
      return leerListaTaller("olimac_vehiculos");
    }

    function guardarVehiculos(lista) {
      guardarListaTaller("olimac_vehiculos", lista);
    }
  });
  guardarInventario(inventario);
}
