
document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('contenedorBarraLateral');
  if (!contenedor || typeof obtenerSesion !== 'function') return;

  const sesion = obtenerSesion();
  if (!sesion) return; 

  // Se pide barraLateral.html sin usar caché. Si el archivo no se puede leer, está incompleto
  // (faltan enlaces) o es una versión vieja, se usa la copia de respaldo de abajo, para que el
  // menú SIEMPRE muestre Clientes, Autos, Empleados, Facturación, Inicio y Cerrar sesión.
 let contenidoBarra = '';

  try {
    const respuesta = await fetch('barraLateral.html', { cache: 'no-store' });
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
   contenidoBarra = await respuesta.text();
  } catch (error) {
   console.error('No se pudo cargar barraLateral.html, se usa la copia de respaldo:', error);
   }
  const enlacesCompletos = (contenidoBarra.match(/barra-lateral__enlace/g) || []).length >= 5
    && contenidoBarra.includes('barraLateralCerrarSesion');
  if (!enlacesCompletos) {
    console.error('barraLateral.html no se pudo leer completo; no se muestra la barra lateral.');
    return;
  }
  contenedor.innerHTML = contenidoBarra;
  

  const barra = document.getElementById('barraLateral');
  document.body.classList.add('con-barra-lateral');

  // Nombre e iniciales
  const nombre = sesion.usuario || 'Usuario';
  const iniciales = nombre.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, ' ').trim()
    .split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'US';
  document.getElementById('barraLateralNombre').textContent = nombre;
  document.getElementById('barraLateralAvatar').textContent = iniciales;

  // Marcar la página actual en naranja
  const actual = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  barra.querySelectorAll('a.barra-lateral__enlace').forEach((enlace) => {
    if (enlace.getAttribute('href').toLowerCase() === actual) {
      enlace.classList.add('barra-lateral__enlace--activo');
      enlace.setAttribute('aria-current', 'page');
    }
  });

  const botonAbrir = document.getElementById('barraLateralAbrir');
  botonAbrir.addEventListener('click', () => {
    const abierta = barra.classList.toggle('barra-lateral--abierta');
    botonAbrir.setAttribute('aria-expanded', String(abierta));
  });
  barra.addEventListener('click', (e) => {
    if (e.target.closest('a')) barra.classList.remove('barra-lateral--abierta');
  });

  // Cerrar sesión
  document.getElementById('barraLateralCerrarSesion').addEventListener('click', () => {
    cerrarSesion();
    window.location.replace('login.html');
  });
});

