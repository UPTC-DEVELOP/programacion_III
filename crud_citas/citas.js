
// ===== GESTIÓN DE CITAS TALLERPRO =====

document.addEventListener('DOMContentLoaded', function () {

    Panther.paginaLogin = '../Login/LoginPanther.html';

    if (!Panther.exigirSesion()) return;

    let citas = [];
    let guardando = false;
    let temporizador;

    const $ = id => document.getElementById(id);

    const tabla = $('tablaCitas');
    const modal = $('modalCita');
    const formulario = $('formCita');

    const servicios = {
        mantenimiento: 'Mantenimiento preventivo',
        diagnostico: 'Diagnóstico computarizado',
        reparacion: 'Reparación de motor',
        alineacion: 'Alineación y balanceo'
    };

    // ===== MENSAJES DEL SISTEMA =====

    function mostrarMensaje(mensaje) {

        const toast = $('toast');

        clearTimeout(temporizador);

        toast.textContent = mensaje;
        toast.hidden = false;
        toast.classList.add('is-open');

        temporizador = setTimeout(() => {
            toast.classList.remove('is-open');
            toast.hidden = true;
        }, 4000);
    }

    // ===== CONSULTAR CITAS =====

    async function cargarCitas() {

        $('btnActualizar').disabled = true;

        try {

            const datos = await Panther.listar('citas');

            if (!Array.isArray(datos)) {
                throw new Error('Respuesta de citas no válida.');
            }

            citas = datos;

            actualizarIndicadores();
            renderizarCitas();

        } catch (error) {

            citas = [];
            actualizarIndicadores();
            renderizarCitas();

            $('sinDatos').textContent =
                'No fue posible consultar las citas.';

            $('sinDatos').hidden = false;

            mostrarMensaje(error.message);

        } finally {

            $('btnActualizar').disabled = false;

        }
    }

    // ===== CONTADORES =====

    function actualizarIndicadores() {

        $('totalCitas').textContent = citas.length;

        $('totalPendientes').textContent =
            citas.filter(c => c.estado === 'Pendiente').length;

        $('totalConfirmadas').textContent =
            citas.filter(c => c.estado === 'Confirmada').length;

        $('totalAtendidas').textContent =
            citas.filter(c => c.estado === 'Atendida').length;

        $('totalCanceladas').textContent =
            citas.filter(c => c.estado === 'Cancelada').length;
    }

    // ===== MOSTRAR TABLA =====

    function renderizarCitas() {

        const busqueda = $('buscarCita').value.toLowerCase().trim();
        const estado = $('filtroEstado').value;

        const resultado = citas.filter(cita => {

            const texto = [
                cita.nombre,
                cita.correo,
                cita.telefono
            ].join(' ').toLowerCase();

            return texto.includes(busqueda) &&
                (!estado || cita.estado === estado);
        });

        tabla.replaceChildren();

        $('sinDatos').textContent = 'No hay citas para mostrar.';
        $('sinDatos').hidden = resultado.length !== 0;

        resultado.forEach(cita => {

            const fila = document.createElement('tr');

            const valores = [
                cita.id_cita,
                cita.nombre,
                cita.correo,
                cita.telefono,
                servicios[cita.servicio] || cita.servicio,
                cita.mensaje,
                cita.fecha_cita,
                String(cita.hora_cita).slice(0, 5)
            ];

            valores.forEach(valor => {

                const celda = document.createElement('td');

                celda.textContent = valor ?? '';

                fila.appendChild(celda);
            });

            // Estado de la cita

            const celdaEstado = document.createElement('td');
            const etiqueta = document.createElement('span');

            etiqueta.className = 'cita-estado';

            const clases = {
                Pendiente: 'estado-pendiente',
                Confirmada: 'estado-confirmada',
                Atendida: 'estado-atendida',
                Cancelada: 'estado-cancelada'
            };

            if (clases[cita.estado]) {
                etiqueta.classList.add(clases[cita.estado]);
            }

            etiqueta.textContent = cita.estado;

            celdaEstado.appendChild(etiqueta);
            fila.appendChild(celdaEstado);

            // Botón gestionar

            const celdaAcciones = document.createElement('td');
            const boton = document.createElement('button');

            boton.type = 'button';
            boton.className = 'ca-btn ca-btn--primary';
            boton.textContent = 'Gestionar';

            boton.addEventListener('click', () => {
                abrirModal(cita);
            });

            celdaAcciones.appendChild(boton);
            fila.appendChild(celdaAcciones);

            tabla.appendChild(fila);
        });
    }

    // ===== ABRIR MODAL =====

    function abrirModal(cita) {

        $('citaId').value = cita.id_cita;

        $('detalleCliente').textContent =
            'Cita N.º ' + cita.id_cita + ' - ' + cita.nombre;

        $('fFecha').value = cita.fecha_cita;
        $('fHora').value = String(cita.hora_cita).slice(0, 5);
        $('fEstado').value = cita.estado;

        modal.hidden = false;
        modal.classList.add('is-open');

        $('fFecha').focus();
    }

    // ===== CERRAR MODAL =====

    function cerrarModal() {

        if (guardando) return;

        modal.classList.remove('is-open');
        modal.hidden = true;

        formulario.reset();
    }

    // ===== ACTUALIZAR CITA =====

    formulario.addEventListener('submit', async function (e) {

        e.preventDefault();

        if (guardando || !formulario.reportValidity()) return;

        const id = $('citaId').value;

        const datos = {
            fecha_cita: $('fFecha').value,
            hora_cita: $('fHora').value,
            estado: $('fEstado').value
        };

        guardando = true;

        $('btnGuardar').disabled = true;
        $('btnGuardar').textContent = 'Guardando...';

        try {

            await Panther.actualizar('citas', id, datos);

            guardando = false;

            cerrarModal();

            await cargarCitas();

            mostrarMensaje('Cita actualizada correctamente.');

        } catch (error) {

            mostrarMensaje(error.message);

        } finally {

            guardando = false;

            $('btnGuardar').disabled = false;
            $('btnGuardar').textContent = 'Guardar cambios';
        }
    });

    // ===== EVENTOS =====

    $('btnActualizar').addEventListener('click', cargarCitas);

    $('buscarCita').addEventListener('input', renderizarCitas);

    $('filtroEstado').addEventListener('change', renderizarCitas);

    $('cerrarModal').addEventListener('click', cerrarModal);

    $('cancelarModal').addEventListener('click', cerrarModal);

    modal.addEventListener('click', function (e) {

        if (e.target === modal) cerrarModal();

    });

    document.addEventListener('keydown', function (e) {

        if (e.key === 'Escape' && !modal.hidden) {
            cerrarModal();
        }
    });

    // ===== CERRAR SESIÓN =====

    $('cerrarSesion').addEventListener('click', function (e) {

        e.preventDefault();

        Panther.cerrarSesion();

        sessionStorage.removeItem('tallerpro_rol');

        window.location.href = '../index.html';
    });

    // ===== CARGA INICIAL =====

    cargarCitas();

});
