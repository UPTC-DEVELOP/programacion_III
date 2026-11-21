
document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('contenedorBarraLateral');
  if (!contenedor || typeof obtenerSesion !== 'function') return;

  const sesion = obtenerSesion();
  if (!sesion) return; 

  try {
    const respuesta = await fetch('barraLateral.html');
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
    contenedor.innerHTML = await respuesta.text();
  } catch (error) {
    console.error('No se pudo cargar la barra lateral:', error);
    return;
  }

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