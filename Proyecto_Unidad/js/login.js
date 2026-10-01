// Comportamiento de la pantalla de inicio de sesion.
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form-login');
    const correo = document.getElementById('correo');
    const contrasena = document.getElementById('contrasena');
    const recordarme = document.getElementById('recordarme');

    // Si el usuario pidio que lo recordaran, recuperamos su correo.
    const correoGuardado = localStorage.getItem('autotech-correo');
    if (correoGuardado) {
        correo.value = correoGuardado;
        recordarme.checked = true;
    }

    // Mostrar u ocultar la contrasena.
    document.getElementById('toggle-contrasena').addEventListener('click', function () {
        const visible = contrasena.type === 'text';
        contrasena.type = visible ? 'password' : 'text';
        this.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });

    document.getElementById('olvide-contrasena').addEventListener('click', function (e) {
        e.preventDefault();
        alert('Te enviaremos un enlace a tu correo para restablecer la contraseña.');
    });

    ['btn-google', 'btn-apple'].forEach(function (id) {
        document.getElementById(id).addEventListener('click', function () {
            alert('El inicio de sesión con ' + this.textContent.trim() + ' estará disponible pronto.');
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const valorCorreo = correo.value.trim();
        const valorContrasena = contrasena.value.trim();

        if (!valorCorreo || !valorContrasena) {
            alert('Ingresa tu correo y tu contraseña.');
            return;
        }

        // Validacion simple de formato: debe contener @ y un punto despues.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorCorreo)) {
            alert('El correo electrónico no tiene un formato válido.');
            return;
        }

        if (valorContrasena.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (recordarme.checked) {
            localStorage.setItem('autotech-correo', valorCorreo);
        } else {
            localStorage.removeItem('autotech-correo');
        }

        alert('Bienvenido a AutoTech. Inicio de sesión simulado correctamente.');
        form.reset();
        if (correoGuardado && recordarme.checked) {
            correo.value = valorCorreo;
        }
    });
});
