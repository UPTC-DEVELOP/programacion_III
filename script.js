const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".btn--primary, button");

    botones.forEach(boton => {
        boton.addEventListener("click", function(e) {
            // Efecto visual rápido de escala al hacer clic
            this.style.transform = "scale(0.95)";
            setTimeout(() => {
                this.style.transform = "translateY(-4px) scale(1.02)";
            }, 150);
        });
    });
});