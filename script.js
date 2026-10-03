const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

document.addEventListener('DOMContentLoaded', function() {


   

const carro = document.querySelector(".hero__visual");

if (carro) {
  // Empieza invisible y MUY lejos por la derecha
  carro.style.opacity = "0";
  carro.style.transform = "translateX(800px)";

  // Más velocidad: 0.4 segundos en lugar de 1s
  carro.style.transition = "opacity 0.4s ease, transform 0.2s ease";

  setTimeout(function () {
    // Aparece y cruza casi hasta el otro lado
    carro.style.opacity = "1";
    carro.style.transform = "translateX(-150px)";
  }, 250);
}



    // Tarjeta beneficios
    const tarjetas = document.querySelectorAll('.benefit-card');
    if (tarjetas.length > 0) {
        tarjetas.forEach((tarjeta, indice) => {
            tarjeta.style.transition = `opacity 0.6s ease ${indice * 0.15}s, transform 0.6s ease ${indice * 0.15}s`;
        });

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.style.opacity = "1";
                    entrada.target.style.transform = "translateY(0)";
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: "0px 0px -50px 0px"
        });

        tarjetas.forEach(tarjeta => observador.observe(tarjeta));
    }

        //Aqui es el login
        // ===== LOGIN: selección de tipo de usuario =====
    const loginOpen = document.getElementById('loginOpen');
    const loginClose = document.getElementById('loginClose');
    const loginModal = document.getElementById('loginModal');

        //CRUD Administrador
          const PAGINAS = {
            administrador: 'crud_administrador/administradores.html',
            empleado: 'crud_empleados/empleados.html',
            cliente: 'crud_clientes/clientes_2.html'//<----- tiene error de sintasis en la ruta 
  };

           

    if (loginOpen && loginModal) {

        function abrirLogin() {
            loginModal.hidden = false;
            requestAnimationFrame(() => loginModal.classList.add('is-open'));
            document.body.style.overflow = 'hidden';
            const primero = loginModal.querySelector('.role-btn');
            if (primero) primero.focus();
        }

        function cerrarLogin() {
            loginModal.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => { loginModal.hidden = true; }, 200);
            loginOpen.focus();
        }

        loginOpen.addEventListener('click', abrirLogin);
        loginClose.addEventListener('click', cerrarLogin);

        // Cerrar al hacer clic fuera de la tarjeta
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) cerrarLogin();
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !loginModal.hidden) cerrarLogin();
        });

        
        // Clic en cada tipo de usuario: lleva a su página
        loginModal.querySelectorAll('.role-btn').forEach((boton) => {
      boton.addEventListener('click', () => {
        const rol = boton.dataset.role; // "cliente", "empleado" o "administrador"
        const destino = PAGINAS[rol];
        if (!destino) return;

        try { sessionStorage.setItem('tallerpro_rol', rol); } catch (e) { /* sin acceso */ }
        window.location.href = destino;

                
             });
        });    
     }            
});
    











    
