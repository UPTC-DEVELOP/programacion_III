(function (global) {
    "use strict";

    /* Operaciones de configuración del sistema y cambio de contraseña. */
    async function listar() {
        return global.solicitarPanther("configuraciones");
    }

    async function guardar(id, configuracion) {
        const recurso = id ? `configuraciones/${id}` : "configuraciones";
        return global.solicitarPanther(recurso, {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(configuracion)
        });
    }

    async function cambiarPassword(currentPassword, newPassword) {
        return global.solicitarPanther("users/change-password", {
            method: "PUT",
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
    }

    global.ConfiguracionAPI = Object.freeze({
        listar,
        guardar,
        cambiarPassword
    });
})(window);
