document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. DESPLAZAMIENTO SUAVE PARA EL MENÚ Y BOTONES
    // ==========================================
    const enlacesNavegacion = document.querySelectorAll('a[href^="#"]');

    enlacesNavegacion.forEach((enlace) => {
        enlace.addEventListener("click", function (e) {
            const destinoId = this.getAttribute("href");

            if (destinoId && destinoId !== "#") {
                const seccionDestino = document.querySelector(destinoId);

                if (seccionDestino) {
                    e.preventDefault();
                    seccionDestino.scrollIntoView({
                        behavior: "smooth"
                    });
                }
            }
        });
    });


    // ==========================================
    // 2. FILTRO DESPLEGABLE DE MÓDULOS
    // ==========================================
    const controlModulos = document.getElementById("controlModulos");
    const modulos = document.querySelectorAll(".modulo-item");

    if (controlModulos) {
        controlModulos.addEventListener("change", function () {
            const seleccionado = this.value;

            modulos.forEach((modulo) => {
                if (seleccionado === "todos" || modulo.dataset.modulo === seleccionado) {
                    modulo.classList.remove("oculto");
                    // Re-aplica animación suave
                    setTimeout(() => modulo.classList.add("visible"), 50);
                } else {
                    modulo.classList.add("oculto");
                    modulo.classList.remove("visible");
                }
            });
        });
    }


    // ==========================================
    // 3. ANIMACIÓN EN SCROLL (INTERSECTION OBSERVER)
    // ==========================================
    // Hace aparecer suavemente pasos, tarjetas de módulos, formularios y tablas
    const elementosAnimables = document.querySelectorAll(
        ".paso, .tarjeta-modulo-detalle, fieldset, .tabla-contenedor tbody tr"
    );

    const observerOpciones = {
        root: null, // Pantalla entera (viewport)
        threshold: 0.15 // Se activa cuando el 15% del elemento es visible
    };

    const observadorScroll = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visible");
            }
        });
    }, observerOpciones);

    elementosAnimables.forEach((elemento) => {
        observadorScroll.observe(elemento);
    });


    // ==========================================
    // 4. FORMULARIO DE CONTACTO / SOLICITUD DE COTIZACIÓN
    // ==========================================
    const contactoForm = document.getElementById("contactoForm");
    const mensajeConfirmacion = document.getElementById("mensajeConfirmacion");

    if (contactoForm) {
        contactoForm.addEventListener("submit", function (e) {
            e.preventDefault();

            // Captura de inputs del formulario de contacto
            const nombre = document.getElementById("nombre")?.value.trim();
            const correo = document.getElementById("correo")?.value.trim();
            const telefono = document.getElementById("telefono")?.value.trim();
            const vehiculo = document.getElementById("vehiculo")?.value.trim();

            if (nombre.length < 3) {
                alert("Por favor ingresa un nombre válido (mínimo 3 caracteres).");
                return;
            }

            // Muestra mensaje de éxito en pantalla
            if (mensajeConfirmacion) {
                mensajeConfirmacion.style.color = "#28a745"; // Verde éxito
                mensajeConfirmacion.textContent = `¡Gracias, ${nombre}! Hemos recibido tu solicitud para el vehículo (${vehiculo}). Te contactaremos pronto al ${telefono}.`;
            } else {
                alert(`¡Cotización solicitada con éxito!\n\nGracias ${nombre}, te contactaremos al teléfono ${telefono}.`);
            }

            // Limpiar los campos del formulario
            contactoForm.reset();
        });
    }


    // ==========================================
    // 5. FORMULARIO DE ORDEN DE SERVICIO (TALLER)
    // ==========================================
    const formTaller = document.getElementById("form-taller");

    if (formTaller) {
        formTaller.addEventListener("submit", function (e) {
            e.preventDefault();

            // Captura de datos
            const cedula = document.getElementById("cedula")?.value.trim();
            const nombre = document.getElementById("nombre-cliente")?.value.trim();
            const placa = document.getElementById("placa")?.value.trim();

            if (nombre && nombre.length < 3) {
                alert("El nombre del cliente debe tener al menos 3 caracteres.");
                return;
            }

            // Mensaje de confirmación
            alert(
                `¡Orden de Servicio registrada con éxito!\n\n` +
                `• Cliente: ${nombre || 'N/A'} (C.C. ${cedula || 'N/A'})\n` +
                `• Vehículo Placa: ${placa ? placa.toUpperCase() : 'N/A'}\n` +
                `• Estado: Asignado a técnico y listo para facturación.`
            );

            // Limpiar formulario
            formTaller.reset();
        });
    }

});