document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.querySelector(".formulario-login");
    const botonIngresar = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener("submit", async function(e) {
        e.preventDefault();

        const usuarioValor = document.getElementById("usuario").value.trim();
        const contraseniaValor = document.getElementById("contrasenia").value;
        botonIngresar.disabled = true;

        try {
            const respuesta = await fetch(
                "http://localhost/programacion%203/Taller_Mecanico/panther/backend_panther/panther/rest/useraction/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user: usuarioValor,
                        password: contraseniaValor
                    })
                }
            );

            const textoRespuesta = await respuesta.text();
            let resultado = {};

            if (textoRespuesta) {
                try {
                    resultado = JSON.parse(textoRespuesta);
                } catch (error) {
                    throw new Error(`Panther devolvió una respuesta inválida (HTTP ${respuesta.status}).`);
                }
            }

            if (!respuesta.ok || !resultado.data || !resultado.data.keyAPI) {
                const mensaje = typeof resultado.data === "string"
                    ? resultado.data
                    : `No se pudo iniciar sesión (HTTP ${respuesta.status}).`;
                throw new Error(mensaje);
            }

            sessionStorage.setItem("pantherApiToken", resultado.data.keyAPI);
            sessionStorage.setItem("pantherUser", resultado.data.user);
            localStorage.removeItem("clarisa_token");

            window.location.href = formulario.getAttribute("action") || "PanelControlFramework.html";
        } catch (error) {
            console.error("Error al iniciar sesión con Panther:", error);
            alert(`No se pudo iniciar sesión con Panther: ${error.message}`);
        } finally {
            botonIngresar.disabled = false;
        }
    });
});