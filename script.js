const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
document.addEventListener('DOMContentLoaded', function() {


   

const carro = document.querySelector(".hero__visual");

if (carro) {
  // Empieza invisible y MUY lejos por la derecha
  carro.style.opacity = "0";
  carro.style.transform = "translateX(800px)";

  // Más velocidad: 0.4 segundos en lugar de 1s
  carro.style.transition = "opacity 0.4s ease, transform 0.2s ease";

  setTimeout(function () {
    // Aparece y cruza casi hasta el otro lado
    carro.style.opacity = "1";
    carro.style.transform = "translateX(-150px)";
  }, 250);
}



    //
    const tarjetas = document.querySelectorAll('.benefit-card');
    if (tarjetas.length > 0) {
        tarjetas.forEach((tarjeta, indice) => {
            tarjeta.style.transition = `opacity 0.6s ease ${indice * 0.15}s, transform 0.6s ease ${indice * 0.15}s`;
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