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
