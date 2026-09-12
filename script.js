const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
document.addEventListener('DOMContentLoaded', function() {

    
    const tituloHero = document.querySelector('#inicio h1');
    if (tituloHero) {
        const textoOriginal = tituloHero.textContent;
        tituloHero.textContent = "";

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

    //
    const tarjetas = document.querySelectorAll('.benefit-card');
    if (tarjetas.length > 0) {
        tarjetas.forEach((tarjeta, indice) => {
            tarjeta.style.transition = opacity 0.6s ease ${indice * 0.15}s, transform 0.6s ease ${indice * 0.15}s;
        });

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.style.opacity = "1";
                    entrada.target.style.transform = "translateY(0)";
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: "0px 0px -50px 0px"
        });

        tarjetas.forEach(tarjeta => observador.observe(tarjeta));
    }

});