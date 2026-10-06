//menu


const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

// Cerrar el menú al seleccionar un enlace

const links = document.querySelectorAll(".nav-links a");

links.forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});