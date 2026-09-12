document.addEventListener("DOMContentLoaded", () => {
    
    /* ==========================================================================
       1. FILTRO DINÁMICO DE MÓDULOS ERP
       ========================================================================== */
    const selectorModulos = document.getElementById("controlModulos");
    const tarjetasModulos = document.querySelectorAll(".modulo-item");

    if (selectorModulos) {
        selectorModulos.addEventListener("change", (e) => {
            const valorSeleccionado = e.target.value;

            tarjetasModulos.forEach((tarjeta) => {
                const categoriaModulo = tarjeta.getAttribute("data-modulo");

                if (valorSeleccionado === "todos" || categoriaModulo === valorSeleccionado) {
                    tarjeta.classList.remove("oculto");
                } else {
                    tarjeta.classList.add("oculto");
                }
            });
        });
    }

    /* ==========================================================================
       2. ANIMACIONES AL HACER SCROLL (INTERSECTION OBSERVER)
       ========================================================================== */
    const elementosAnimados = document.querySelectorAll(".paso, .tarjeta-modulo-detalle, fieldset");

    const observadorScroll = new IntersectionObserver((entradas, observador) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visible");
                observador.unobserve(entrada.target); // Animar solo una vez
            }
        });
    }, {
        threshold: 0.15
    });

    elementosAnimados.forEach((elemento) => {
        observadorScroll.observe(elemento);
    });

    /* ==========================================================================
       3. FORMULARIO DE CONTACTO Y COTIZACIÓN
       ========================================================================== */
    const formularioContacto = document.getElementById("contactoForm");
    const mensajeConfirmacion = document.getElementById("mensajeConfirmacion");

    if (formularioContacto) {
        formularioContacto.addEventListener("submit", (e) => {
            e.preventDefault();

            // Obtener valores de los campos principales
            const nombre = document.getElementById("nombre").value;
            const vehiculo = document.getElementById("vehiculo").value;

            // Simulación de respuesta exitosa
            mensajeConfirmacion.textContent = `¡Gracias, ${nombre}! Hemos recibido tu solicitud para el vehículo (${vehiculo}). Te contactaremos muy pronto.`;
            mensajeConfirmacion.style.color = "#28a745"; // Verde éxito

            // Limpiar el formulario
            formularioContacto.reset();

            // Ocultar mensaje después de 6 segundos
            setTimeout(() => {
                mensajeConfirmacion.textContent = "";
            }, 6000);
        });
    }

    /* ==========================================================================
       4. NAVEGACIÓN Y DESPLAZAMIENTO SUAVE (SMOOTH SCROLL)
       ========================================================================== */
    const enlacesNavegacion = document.querySelectorAll('a[href^="#"]');

    enlacesNavegacion.forEach((enlace) => {
        enlace.addEventListener("click", function (e) {
            const destinoId = this.getAttribute("href");

            if (destinoId !== "#" && destinoId !== "") {
                const elementoDestino = document.querySelector(destinoId);

                if (elementoDestino) {
                    e.preventDefault();
                    elementoDestino.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }
        });
    });

});