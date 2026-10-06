//menu movil


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

// formulario

const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!name || !email) {
        formMessage.textContent = "Por favor completa todos los campos.";
        formMessage.style.color = "#dc2626";
        return;
    }

    formMessage.textContent = "¡Gracias! Hemos recibido tus datos.";
    formMessage.style.color = "#16a34a";

    contactForm.reset();
});

// año del footer 

const year = document.getElementById("year");

year.textContent = new Date().getFullYear();