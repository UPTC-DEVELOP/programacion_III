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