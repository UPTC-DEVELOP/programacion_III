console.log("Sistema AutoFix inicializado por Grupo 3");

document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btnLogin");
    const btnRegister = document.getElementById("btnRegister");

    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            alert("El inicio de sesión está en desarrollo.");
        });
    }

    if (btnRegister) {
        btnRegister.addEventListener("click", () => {
            alert("El registro está en desarrollo.");
        });
    }

    const formContacto = document.getElementById('form-contacto');
    const mensajeRespuesta = document.getElementById('mensaje-respuesta');

    if (formContacto) {
        formContacto.addEventListener('submit', function(evento) {
            evento.preventDefault();

            const nombreTaller = document.getElementById('nombreTaller').value.trim();
            const propietario = document.getElementById('propietario').value.trim();
            const email = document.getElementById('email').value.trim();
            const telefono = document.getElementById('telefono').value.trim();

           
            const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Validación campos vacios
            if (!nombreTaller || !propietario || !email || !telefono) {
                mostrarMensaje('Por favor, completa todos los campos requeridos.', 'alerta-error');
                return;
            }

            // Validación correo valido
            if (!regexCorreo.test(email)) {
                mostrarMensaje('El formato del correo electrónico no es válido.', 'alerta-error');
                return;
            }

            // Inserción dinámica en el DOM 
            mostrarMensaje(`¡Gracias ${propietario}! Hemos registrado tu solicitud para el taller ${nombreTaller}. Te contactaremos pronto.`, 'alerta-exito');
            
           
            formContacto.reset();
        });
    }

    // Función auxiliar para inyectar la respuesta visual
    function mostrarMensaje(texto, tipoClase) {
        mensajeRespuesta.textContent = texto;
        mensajeRespuesta.className = `mensaje-visible ${tipoClase}`;
    }
});