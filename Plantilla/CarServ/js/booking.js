document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-reserva");
    const dateField = document.getElementById("fecha");

    if (!form || !dateField) {
        return;
    }

    const today = new Date();
    dateField.min = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const feedback = document.getElementById("notificacion-reserva");

        if (!form.reportValidity()) {
            feedback.textContent = "Por favor, completa correctamente los campos obligatorios.";
            feedback.classList.remove("empty");
            feedback.style.backgroundColor = "#FFEBEE";
            feedback.style.color = "#B71C1C";
            feedback.style.border = "1px solid #E21B23";
            return;
        }

        const data = {
            nombre: form.elements.nombre.value.trim(),
            correo: form.elements.email.value.trim(),
            telefono: form.elements.telefono.value.trim(),
            servicio: form.elements.servicio.value,
            fecha: form.elements.fecha.value,
            vehiculo: form.elements.vehiculo.value.trim(),
            mensaje: form.elements.mensaje.value.trim(),
            fechaRegistro: new Date().toISOString()
        };
        localStorage.setItem("ultimaSolicitudServiAuto", JSON.stringify(data));

        feedback.textContent =
            `¡Reserva enviada correctamente, ${data.nombre}!\n\n` +
            `Servicio: ${data.servicio}\n\n` +
            `Fecha solicitada: ${data.fecha}\n\n` +
            `Nos comunicaremos contigo al correo ${data.correo} o al teléfono ${data.telefono}.`;
        feedback.classList.remove("empty");
        feedback.style.backgroundColor = "#E8F5E9";
        feedback.style.color = "#1B5E20";
        feedback.style.border = "1px solid #4CAF50";

        form.reset();
        dateField.min = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
    });
});
