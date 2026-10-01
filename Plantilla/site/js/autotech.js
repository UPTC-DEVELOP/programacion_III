// Reseña destacada: al elegir una tarjeta se actualiza la cita grande
document.addEventListener('DOMContentLoaded', function () {
    const tarjetas = document.querySelectorAll('#resenas .resena-card');
    const cita = document.querySelector('#resena-destacada p');
    const autor = document.querySelector('#resena-destacada cite');
    const avatar = document.querySelector('#resena-destacada .resena-avatar');

    if (!tarjetas.length || !cita || !autor) return;

    function destacar(tarjeta) {
        tarjetas.forEach(function (item) {
            const activa = item === tarjeta;
            item.classList.toggle('is-activa', activa);
            item.setAttribute('aria-pressed', activa ? 'true' : 'false');
        });

        const nombre = tarjeta.querySelector('.title').textContent;
        const rol = tarjeta.querySelector('.resena-rol').textContent;
        const texto = tarjeta.querySelector('.exeption').textContent;
        const foto = tarjeta.querySelector('.resena-avatar');

        cita.textContent = '“' + texto + '”';
        autor.textContent = nombre + ' · ' + rol;
        if (avatar && foto) avatar.src = foto.src;
    }

    tarjetas.forEach(function (tarjeta) {
        tarjeta.addEventListener('click', function () {
            destacar(tarjeta);
        });
        tarjeta.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                destacar(tarjeta);
            }
        });
    });
});

// Validación del formulario de contacto de AutoTech
document.addEventListener('DOMContentLoaded', function () {
    const formContacto = document.getElementById('form-contacto');

    if (formContacto) {
        formContacto.addEventListener('submit', function (e) {
            e.preventDefault();

            const nombreTaller = document.getElementById('nombre-taller').value.trim();
            const nombrePropietario = document.getElementById('nombre-propietario').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            // Una casilla no se consulta con .value sino con .checked
            const aceptoTerminos = document.getElementById('acepto-terminos').checked;

            if (!nombreTaller || !nombrePropietario || !correo || !telefono) {
                alert('Por favor, completa todos los campos del formulario.');
                return;
            }

            if (!aceptoTerminos) {
                alert('Debes aceptar los términos y condiciones para continuar.');
                return;
            }

            alert('¡Gracias por comunicarte! Un asesor de AutoTech te contactará pronto.');
            formContacto.reset();
        });
    }
});
