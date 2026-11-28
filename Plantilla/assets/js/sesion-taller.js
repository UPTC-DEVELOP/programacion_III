var CLAVE_SESION_TALLER = "olimac_sesion";
var HORAS_TOKEN_CLARISA = 12;

function guardarSesionTaller(datos) {
  const sesion = {
    token: datos.token,
    userName: datos.userName || "",
    permisos: datos.permisos || [],
    createdAt: Date.now()
  };
  sessionStorage.setItem(CLAVE_SESION_TALLER, JSON.stringify(sesion));
}

function obtenerSesionTaller() {
  const raw = sessionStorage.getItem(CLAVE_SESION_TALLER);
  if (!raw) {
    return null;
  }
  try {
    const sesion = JSON.parse(raw);
    const limite = HORAS_TOKEN_CLARISA * 60 * 60 * 1000;
    if (!sesion.token || Date.now() - Number(sesion.createdAt || 0) > limite) {
      cerrarSesionTaller();
      return null;
    }
    return sesion;
  } catch (e) {
    cerrarSesionTaller();
    return null;
  }
}

function obtenerTokenTaller() {
  const sesion = obtenerSesionTaller();
  return sesion ? sesion.token : "";
}

function haySesionTaller() {
  return Boolean(obtenerTokenTaller());
}

function cerrarSesionTaller() {
  sessionStorage.removeItem(CLAVE_SESION_TALLER);
}

function protegerRutaFactura() {
  if (!haySesionTaller()) {
    window.location.replace("acceso.html");
  }
}

function redirigirSiHaySesion() {
  if (haySesionTaller()) {
    window.location.replace("factura.html");
  }
}