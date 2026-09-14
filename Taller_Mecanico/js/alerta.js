document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Validar Nombre
        if (form.nombre.value.trim().length < 3) {
            alert("Escribe un nombre válido (mínimo 3 letras).");
            form.nombre.focus();
            return;
        }

        // 2. Validar Teléfono
        if (form.telefono.value.trim().length < 7) {
            alert(" El teléfono debe tener al menos 7 dígitos.");
            form.telefono.focus();
            return;
        }

        // 3. Validar Correo
        if (!form.email.value.includes('@') || !form.email.value.includes('.')) {
            alert(" Ingresa un correo válido (debe incluir '@' y '.').");
            form.email.focus();
            return;
        }

        // 4. Validar Servicio
        if (!form.servicio.value) {
            alert(" Por favor selecciona un servicio.");
            form.servicio.focus();
            return;
        }

        // 5. Validar Mensaje
        if (form.mensaje.value.trim() === "") {
            alert(" Por favor escribe un mensaje.");
            form.mensaje.focus();
            return;
        }

        // Si pasa todas las validaciones
        alert(" ¡Mensaje enviado con éxito!");
        form.reset();
    });
});