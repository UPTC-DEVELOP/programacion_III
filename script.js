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

});