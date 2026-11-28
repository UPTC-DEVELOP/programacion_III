(function () {
	const TOKEN_KEY = "olimac_panther_token";
	const USER_KEY = "olimac_panther_user";
	const ROLE_KEY = "olimac_panther_role";

	const token = sessionStorage.getItem(TOKEN_KEY);
	const usuario = sessionStorage.getItem(USER_KEY) || "Usuario";
	const rol = (sessionStorage.getItem(ROLE_KEY) || "empleado").trim().toLowerCase();
	const esAdmin = (rol === "admin" || rol === "administrador");

	// 1. Si no ha iniciado sesión, redirige inmediatamente a acceso.html
	if (!token) {
		window.location.replace("acceso.html");
		return;
	}

	// Módulos permitidos para cada rol (según los archivos del menú <nav>)
	const paginasEmpleado = [
		"index.html",
		"no-sidebar.html",    // Clientes
		"left-sidebar.html",  // Vehículos
		"orden-servicio.html",// Servicios
		"repuestos.html",     // Repuestos
		"factura.html"        // Facturación
	];

	const paginaActual = window.location.pathname.split("/").pop().toLowerCase() || "index.html";

	// 2. Bloquea el acceso directo por URL si es Empleado y entra a un módulo exclusivo de Admin
	if (!esAdmin && !paginasEmpleado.includes(paginaActual)) {
		window.location.replace("orden-servicio.html");
		return;
	}

	// 3. Ajusta el menú de navegación y agrega la barra de usuario/cerrar sesión
	document.addEventListener("DOMContentLoaded", function () {
		const navUl = document.querySelector("#nav ul");
		if (navUl) {
			// Si es empleado, oculta Proveedores, Empleados e Inventario
			if (!esAdmin) {
				navUl.querySelectorAll("li a").forEach(function (enlace) {
					const href = (enlace.getAttribute("href") || "").toLowerCase();
					if (!paginasEmpleado.includes(href)) {
						enlace.parentElement.style.display = "none";
					}
				});
			}

			// Agrega indicador de usuario/rol y botón de Cerrar Sesión en el menú
			const liSesion = document.createElement("li");
			liSesion.innerHTML = `<a href="#" id="btnSalirGlobal" style="color: #fbbf24; font-weight: bold;">Salir (${usuario} - ${esAdmin ? "Admin" : "Empleado"})</a>`;
			navUl.appendChild(liSesion);

			const btnSalir = document.getElementById("btnSalirGlobal");
			if (btnSalir) {
				btnSalir.addEventListener("click", function (e) {
					e.preventDefault();
					sessionStorage.removeItem(TOKEN_KEY);
					sessionStorage.removeItem(USER_KEY);
					sessionStorage.removeItem(ROLE_KEY);
					sessionStorage.removeItem("olimac_sesion");
					window.location.replace("acceso.html");
				});
			}
		}

		// Oculta los mini-formularios de login repetidos dentro de Clientes/Repuestos si ya inició sesión
		const formLocal = document.getElementById("formSesionPanther");
		if (formLocal) {
			formLocal.hidden = true;
		}
	});
})();