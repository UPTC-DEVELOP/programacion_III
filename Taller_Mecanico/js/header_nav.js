document.addEventListener("DOMContentLoaded", () => {
  // 1. CARGAR SIDEBAR MENÚ LATERAL
  const sidebarContainer = document.getElementById("sidebar-component");
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <aside class="sidebar">
        <div>
          <!-- Marca y Logo -->
          <div class="sidebar-header">
            <a href="index.html" class="sidebar-brand">
              <img src="assets/imagenes/LOGO.png" alt="LJA Logo" onerror="this.style.display='none'">
              <div>
                <span class="sidebar-brand-title d-block">LJA MOTORS</span>
                <span class="sidebar-brand-subtitle">Gestión de Taller</span>
              </div>
            </a>
          </div>

          <!-- Menu de Navegación Principal -->
          <nav class="sidebar-nav">
            <div class="sidebar-section-title">MENÚ PRINCIPAL</div>
            <a href="PanelControlFramework.html" class="nav-item-link" id="nav-inicio">
              <i class="bi bi-house-door-fill text-primary"></i>
              <span>Inicio</span>
            </a>
            <a href="Cliente.html" class="nav-item-link" id="nav-clientes">
              <i class="bi bi-people-fill text-purple"></i>
              <span>Clientes</span>
            </a>
            <a href="ui-forms.html" class="nav-item-link" id="nav-vehiculos">
              <i class="bi bi-car-front-fill text-danger"></i>
              <span>Vehículos</span>
            </a>
            <a href="ui-buttons.html" class="nav-item-link" id="nav-servicios">
              <i class="bi bi-wrench-adjustable text-secondary"></i>
              <span>Servicios</span>
            </a>
            <a href="page-blank.html" class="nav-item-link" id="nav-repuestos">
              <i class="bi bi-gear-fill"></i>
              <span>Repuestos</span>
            </a>
            <a href="page-blank.html" class="nav-item-link" id="nav-catalogo">
              <i class="bi bi-tags-fill text-info"></i>
              <span>Catálogo y Promociones</span>
            </a>
            <a href="page-404.html" class="nav-item-link" id="nav-empleados">
              <i class="bi bi-person-badge-fill text-primary"></i>
              <span>Empleados</span>
            </a>
            <a href="page-404.html" class="nav-item-link" id="nav-facturacion">
              <i class="bi bi-receipt-cutoff text-success"></i>
              <span>Facturación</span>
            </a>
          </nav>
        </div>

        <!-- Pie del Menú -->
        <div class="sidebar-footer">
          <a href="page-blank.html" class="nav-item-link" id="nav-config">
            <i class="bi bi-gear"></i>
            <span>Configuración</span>
          </a>
          <a href="login.html" class="nav-item-link text-danger">
            <i class="bi bi-box-arrow-left"></i>
            <span>Cerrar sesión</span>
          </a>
        </div>
      </aside>
    `;

    // Script para resaltar la página activa automáticamente
    highlightActiveLink();
  }

  // 2. CARGAR HEADER / TOPBAR SUPERIOR
  const headerContainer = document.getElementById("header-component");
  if (headerContainer) {
    headerContainer.innerHTML = `
      <header class="top-navbar">
        <div class="page-title-group">
          <span class="page-subtitle">Buenas noches 👋</span>
          <h1 id="dynamic-page-title">Panel de control</h1>
        </div>

        <div class="d-flex align-items-center gap-3">
          <!-- Botón Unificado con Cascada Operativa -->
          <div class="dropdown">
            <button class="btn btn-lja-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" id="navbarActionDropdown">
              <i class="bi bi-plus-lg"></i>
              <span>Nuevo servicio</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-quick dropdown-menu-end shadow-sm py-2" aria-labelledby="navbarActionDropdown">
              <li class="dropdown-header">OPERACIONES RÁPIDAS</li>
              <li><a class="dropdown-item" href="ui-forms.html"><i class="bi bi-wrench text-primary"></i> Ingresar Orden de Trabajo</a></li>
              <li><a class="dropdown-item" href="ui-forms.html"><i class="bi bi-car-front text-danger"></i> Registrar Vehículo</a></li>
              <li><a class="dropdown-item" href="Cliente.html"><i class="bi bi-person-plus text-purple"></i> Registrar Cliente</a></li>
              <li><hr class="dropdown-divider my-1"></li>
              <li class="dropdown-header">ADMINISTRACIÓN</li>
              <li><a class="dropdown-item" href="page-404.html"><i class="bi bi-receipt text-success"></i> Generar Factura</a></li>
              <li><a class="dropdown-item" href="page-blank.html"><i class="bi bi-box-seam text-warning"></i> Ajuste de Inventario</a></li>
            </ul>
          </div>

          <!-- Notificaciones -->
          <button class="btn btn-light rounded-circle p-2" type="button" title="Notificaciones">
            <i class="bi bi-bell text-secondary fs-5"></i>
          </button>

          <!-- Perfil Usuario -->
          <div class="d-flex align-items-center gap-2 ps-2 border-start">
            <div class="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style="width: 36px; height: 36px;">
              A
            </div>
            <div class="d-none d-md-block text-start">
              <div class="fw-bold small text-dark" style="line-height: 1.1;">Administrador</div>
              <div class="text-muted" style="font-size: 0.72rem;">LJA Taller</div>
            </div>
          </div>
        </div>
      </header>
    `;
    
    // Ajustar el título del Header según el documento actual
    updateHeaderTitle();
  }
});

// Función auxiliar para activar la pestaña visual del menú según la URL
function highlightActiveLink() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".sidebar-nav .nav-item-link");
  
  links.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Función para sincronizar el título H1 del Header con la etiqueta <title> del HTML
function updateHeaderTitle() {
  const pageTitle = document.title.split("-").pop().trim();
  const h1Title = document.getElementById("dynamic-page-title");
  if (h1Title && pageTitle) {
    h1Title.textContent = pageTitle;
  }
}
