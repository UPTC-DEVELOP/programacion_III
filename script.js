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



    //
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
    const loginOpen = document.getElementById('loginOpen');
    const loginClose = document.getElementById('loginClose');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPass = document.getElementById('loginPass');
    const loginShowPass = document.getElementById('loginShowPass');
    const loginError = document.getElementById('loginError');

    if (loginOpen && loginModal) {

        function abrirLogin() {
            loginModal.hidden = false;

            // Aqui se agrega un frame para la aopacidad 
            requestAnimationFrame(() => loginModal.classList.add('is-open'));
            document.body.style.overflow = 'hidden';
            loginEmail.focus();
        }

        function cerrarLogin() {
            loginModal.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => { loginModal.hidden = true; }, 200);
            loginOpen.focus();
        }

        function mostrarError(mensaje) {
            loginError.textContent = mensaje;
            loginError.hidden = false;
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

        // Mostrar / ocultar contraseña
        loginShowPass.addEventListener('click', () => {
            const visible = loginPass.type === 'text';
            loginPass.type = visible ? 'password' : 'text';
            loginShowPass.textContent = visible ? 'Mostrar' : 'Ocultar';
            loginShowPass.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        });

        // respuesta login
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginError.hidden = true;

            const email = loginEmail.value.trim();
            const pass = loginPass.value;

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                mostrarError('Escribe un correo válido, por ejemplo tucorreo@TALLERPRO.COM.');
                loginEmail.focus();
                return;
            }
            if (pass.length < 6) {
                mostrarError('La contraseña debe tener al menos 6 caracteres.');
                loginPass.focus();
                return;
            }

            // Esto es para conectar un servidor 
            console.log('Login listo para enviar al servidor:', email);
        });
    }











    
});