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
    // 1. Inicializar iconos (Lucide)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Efecto de linterna azul (Corregido para detectar el movimiento en TODO el footer)
    const footerElement = document.querySelector(".lja-footer-pro"); 
    const svgElement = document.getElementById("text-hover-svg");
    const revealMask = document.getElementById("revealMask");
    const coloredText = document.getElementById("hover-colored-text");

    if (footerElement && svgElement && revealMask && coloredText) {
        let isHovered = false;

        // Escuchamos el mouse sobre todo el footer, evitando el "escudo invisible"
        footerElement.addEventListener("mousemove", (e) => {
            if (!isHovered) return;
            
            requestAnimationFrame(() => {
                const svgRect = svgElement.getBoundingClientRect();
                const cxPercentage = ((e.clientX - svgRect.left) / svgRect.width) * 100;
                const cyPercentage = ((e.clientY - svgRect.top) / svgRect.height) * 100;
                
                revealMask.setAttribute("cx", `${cxPercentage}%`);
                revealMask.setAttribute("cy", `${cyPercentage}%`);
            });
        });

        footerElement.addEventListener("mouseenter", () => {
            isHovered = true;
            coloredText.style.opacity = "1";
        });

        footerElement.addEventListener("mouseleave", () => {
            isHovered = false;
            coloredText.style.opacity = "0";
            
            setTimeout(() => {
                if (!isHovered) {
                    revealMask.setAttribute("cx", "50%");
                    revealMask.setAttribute("cy", "50%");
                }
            }, 800); 
        });
    }
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

// Footer 

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar iconos (Lucide)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Efecto de linterna azul siguiendo el cursor sobre el texto gigante
    const svgElement = document.getElementById("text-hover-svg");
    const revealMask = document.getElementById("revealMask");
    const coloredText = document.getElementById("hover-colored-text");

    if (svgElement && revealMask && coloredText) {
        svgElement.addEventListener("mousemove", (e) => {
            const svgRect = svgElement.getBoundingClientRect();
            const cxPercentage = ((e.clientX - svgRect.left) / svgRect.width) * 100;
            const cyPercentage = ((e.clientY - svgRect.top) / svgRect.height) * 100;
            
            revealMask.setAttribute("cx", `${cxPercentage}%`);
            revealMask.setAttribute("cy", `${cyPercentage}%`);
        });

        svgElement.addEventListener("mouseenter", () => {
            coloredText.style.opacity = "1";
        });

        svgElement.addEventListener("mouseleave", () => {
            coloredText.style.opacity = "0";
            revealMask.setAttribute("cx", "50%");
            revealMask.setAttribute("cy", "50%");
        });
    }
});
