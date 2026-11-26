(function (global) {
    "use strict";

    async function solicitarLogin(recurso, datos) {
        const respuesta = await fetch(`${global.PANTHER_API_URL}/${recurso}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        return respuesta.ok && resultado.state === "OK" ? resultado : null;
    }

    async function autenticar(username, password) {
        try {
            const resultado = await solicitarLogin("useraction/login", {
                user: username,
                password
            });

            if (resultado) {
                return {
                    proveedor: "panther",
                    username: resultado.data?.user || username,
                    tokenPanther: resultado.data?.keyAPI || "",
                    tokenClarisa: "",
                    roles: Number(
                        resultado.data?.roles ??
                        resultado.data?.rol ??
                        resultado.data?.role ??
                        resultado.data?.id_rol ??
                        0
                    ) || 0
                };
            }
        } catch (error) {
            console.warn("Panther no respondió", error);
        }

        try {
            const resultado = await solicitarLogin("useraction/clarisa-login", {
                usuario: username,
                contrasenia: password
            });

            if (resultado) {
                return {
                    proveedor: "clarisa",
                    username:
                        resultado.data?.usuario?.userName ||
                        resultado.data?.usuario ||
                        username,
                    tokenPanther: "",
                    tokenClarisa: resultado.data?.token || resultado.token || "",
                    roles: Number(
                        resultado.data?.roles ??
                        resultado.data?.usuario?.roles ??
                        resultado.data?.rol ??
                        0
                    ) || 0
                };
            }
        } catch (error) {
            console.warn("Clarisa no respondió", error);
        }

        return null;
    }

    global.LoginAPI = Object.freeze({ autenticar });
})(window);
