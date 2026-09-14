document.addEventListener('DOMContentLoaded', function() { 
    
    // Efecto de escritura para el título del hero

    const tituloHero = document.querySelector('#hero h2');
    if (tituloHero) {
        const textoOriginal = tituloHero.textContent;
        tituloHero.textContent = '';
        
        let i = 0;
        const velocidad = 50;
        
        function escribirLetra() {
            if (i < textoOriginal.length) {
                tituloHero.textContent += textoOriginal.charAt(i);
                i++;
                setTimeout(escribirLetra, velocidad);
            }
        }
        
        setTimeout(escribirLetra, 500);
    }
    // Scroll

       const cards = document.querySelectorAll('.servicio-card');
    
    if (cards.length > 0) {
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(40px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { 
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });

        cards.forEach(card => observer.observe(card));
    }
    });

// Lógica para el formulario de contacto
document.addEventListener('DOMContentLoaded', () => {
    const formContacto = document.getElementById('form-contacto');
    
    if (formContacto) {
        formContacto.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevenir el envío por defecto
            
            // Obtener los valores de los campos
            const nombreTaller = document.getElementById('nombre-taller').value.trim();
            const nombrePropietario = document.getElementById('nombre-propietario').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            
            // Validación básica
            if (!nombreTaller || !nombrePropietario || !correo || !telefono) {
                alert('Por favor, completa todos los campos del formulario.');
                return;
            }
            
            // Simular envío exitoso
            alert('¡Gracias por comunicarte! Un asesor de AutoTech te contactará pronto.');
            
            // Limpiar el formulario
            formContacto.reset();
        });
    }
});
