
document.addEventListener('DOMContentLoaded', () => {
    
   
    const btnReserva = document.getElementById('btn-reserva');
    
    if (btnReserva) {
        btnReserva.addEventListener('click', () => {
           
            alert('¡Gracias por tu interés! El sistema de reservas se abrirá en una nueva pestaña pronto.');
        });
    }


    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
           
            navLinks.forEach(nav => nav.classList.remove('active'));
           
            this.classList.add('active');
        });
    });
});