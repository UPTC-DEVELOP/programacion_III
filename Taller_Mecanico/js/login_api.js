document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.querySelector(".formulario-login");

    formulario.addEventListener("submit", async function(e) {
        e.preventDefault(); 

    
        const usuarioValor = document.getElementById("usuario").value;
        const contraseniaValor = document.getElementById("contrasenia").value;

        try {
            
            const respuesta = await fetch("https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario: usuarioValor,       
                    contrasenia: contraseniaValor 
                })
            });

            const resultado = await respuesta.json();


            if (resultado.success === true) {
               
                localStorage.setItem("clarisa_token", resultado.data.token);
                
          
                alert(resultado.textResponse);

                window.location.href = formulario.getAttribute("action") || "PanelControlFramework.html";
            } else {
      
                alert(resultado.textResponse || "Error al iniciar sesión");
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo establecer conexión con el servidor de Clarisa.");
        }
    });
});