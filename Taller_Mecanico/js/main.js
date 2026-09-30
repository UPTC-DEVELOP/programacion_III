document.addEventListener("DOMContentLoaded", () => {
    // 1. Navegación fluida (Smooth Scrolling)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 2. Feedback visual en el formulario de contacto
    const form = document.querySelector('form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita la recarga de la página
            const btn = form.querySelector('button[type="submit"]');
            const textoOriginal = btn.textContent;
            
            btn.textContent = "Mensaje Enviado ✓";
            btn.style.backgroundColor = "#16a34a"; // Verde éxito
            
            // Restablece el formulario después de 3 segundos
            setTimeout(() => {
                form.reset();
                btn.textContent = textoOriginal;
                btn.style.backgroundColor = ""; 
            }, 3000);
        });
    }
});

// Archivo JS o etiqueta <script>
document.addEventListener("DOMContentLoaded", () => {
    const elementos = document.querySelectorAll(".product, .catalog-section, .cta-final");

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    elementos.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        observer.observe(el);
    });
});

function mostrarNotificacion(mensaje) {
    const toast = document.createElement("div");
    toast.textContent = mensaje;
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "25px",
        right: "25px",
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        padding: "12px 24px",
        borderRadius: "8px",
        border: "1px solid rgba(59, 130, 246, 0.4)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
        zIndex: "1000",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        fontWeight: "600",
        opacity: "0",
        transition: "opacity 0.3s ease"
    });

    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = "1", 10);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Ejemplo de uso vinculado a los botones de consulta del catálogo:
document.querySelectorAll(".consult-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        mostrarNotificacion("¡Consulta enviada al taller! Nos comunicaremos contigo.");
    });
});