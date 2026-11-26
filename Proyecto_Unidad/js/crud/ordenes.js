/**
 * CRUD de Órdenes de Servicio — persistencia real vía Panther REST (MariaDB).
 * Reemplaza localStorage por PantherApi (GET/POST/PUT/DELETE /ordenes).
 */

let ordenes = [];
let editando = false;
let idEditando = null;
let numeroEditando = null;
let cargando = false;

const tablaBody = document.getElementById('tabla-ordenes-body');
const contador = document.getElementById('contador-ordenes');
const buscador = document.getElementById('buscar-orden');
const formOrden = document.getElementById('form-orden');
const modalTitulo = document.getElementById('modal-titulo');
const listaRepuestos = document.getElementById('lista-repuestos');
const btnGuardar = document.getElementById('btn-guardar-orden');
const api = typeof pantherApi !== 'undefined' ? pantherApi : new PantherApi();

/** Extrae el cuerpo útil de la respuesta ContentBody de Panther. */
function cuerpoPanther(respuesta) {
    if (!respuesta || respuesta.data == null) return null;
    const cuerpo = respuesta.data;
    if (cuerpo && typeof cuerpo === 'object' && Object.prototype.hasOwnProperty.call(cuerpo, 'data')) {
        return cuerpo.data;
    }
    return cuerpo;
}

function parsearRepuestos(orden) {
    if (!orden) return [];
    if (Array.isArray(orden.repuestos)) return orden.repuestos;
    const raw = orden.repuestos_json;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }
    return [];
}

function normalizarOrden(fila) {
    const repuestos = parsearRepuestos(fila).map((rep) => ({
        referencia: rep.referencia || '',
        descripcion: rep.descripcion || '',
        marca: rep.marca || '',
        precio: Number(rep.precio) || 0,
        cantidad: Number(rep.cantidad) > 0 ? Number(rep.cantidad) : 1
    }));

    return {
        id: Number(fila.id),
        numero_orden: fila.numero_orden || '',
        cliente_documento: fila.cliente_documento || '',
        cliente_nombre: fila.cliente_nombre || '',
        cliente_telefono: fila.cliente_telefono || '',
        cliente_direccion: fila.cliente_direccion || '',
        cliente_email: fila.cliente_email || '',
        vehiculo_placa: fila.vehiculo_placa || '',
        vehiculo_modelo: fila.vehiculo_modelo || '',
        vehiculo_color: fila.vehiculo_color || '',
        fecha_ingreso: fila.fecha_ingreso || '',
        empleado_documento: fila.empleado_documento || '',
        empleado_nombre: fila.empleado_nombre || '',
        horas_empleadas: Number(fila.horas_empleadas) || 0,
        valor_hora: Number(fila.valor_hora) || VALOR_HORA_DEFAULT,
        utilidad_estimada: Number(fila.utilidad_estimada) || 0,
        repuestos,
        subtotal: Number(fila.subtotal) || 0,
        iva: Number(fila.iva) || 0,
        total: Number(fila.total) || 0,
        estado: fila.estado || 'ABIERTA'
    };
}

function calcularTotales({ horas, valorHora, utilidad, repuestos }) {
    const subtotalRepuestos = (repuestos || []).reduce((acc, rep) => {
        return acc + (Number(rep.precio) || 0) * (Number(rep.cantidad) > 0 ? Number(rep.cantidad) : 1);
    }, 0);
    const manoObra = (Number(horas) || 0) * (Number(valorHora) || 0) + (Number(utilidad) || 0);
    const baseGravable = subtotalRepuestos + manoObra;
    const iva = Math.round(baseGravable * IVA_ORDEN * 100) / 100;
    const total = Math.round((baseGravable + iva) * 100) / 100;
    return { subtotalRepuestos, manoObra, baseGravable, iva, total };
}

function siguienteNumeroOrden(lista) {
    const maximo = (lista || []).reduce((mayor, item) => {
        const numero = parseInt(String(item.numero_orden || '').split('-')[1], 10);
        return Number.isFinite(numero) && numero > mayor ? numero : mayor;
    }, 0);
    return `ORD-${String(maximo + 1).padStart(3, '0')}`;
}

function setCargando(activo, textoBoton) {
    cargando = activo;
    if (!btnGuardar) return;
    btnGuardar.disabled = activo;
    btnGuardar.textContent = textoBoton || (activo ? 'Guardando...' : 'Guardar');
}

function actualizarResumen() {
    const totales = calcularTotales({
        horas: document.getElementById('horas-empleadas').value,
        valorHora: document.getElementById('valor-hora').value,
        utilidad: document.getElementById('utilidad-estimada').value,
        repuestos: leerRepuestos(false)
    });

    document.getElementById('res-subtotal-repuestos').textContent = formatoPesos(totales.subtotalRepuestos);
    document.getElementById('res-mano-obra').textContent = formatoPesos(totales.manoObra);
    document.getElementById('res-base').textContent = formatoPesos(totales.baseGravable);
    document.getElementById('res-iva').textContent = formatoPesos(totales.iva);
    document.getElementById('res-total').textContent = formatoPesos(totales.total);
}

function llenarCatalogos() {
    const selCliente = document.getElementById('cliente-catalogo');
    selCliente.innerHTML = '<option value="">Selecciona o escribe los datos...</option>' +
        CATALOGO.clientes.map((c) =>
            `<option value="${escapar(c.documento)}">${escapar(c.nombre)} · ${escapar(c.documento)}</option>`
        ).join('');

    const selVehiculo = document.getElementById('vehiculo-catalogo');
    selVehiculo.innerHTML = '<option value="">Selecciona o escribe los datos...</option>' +
        CATALOGO.vehiculos.map((v) =>
            `<option value="${escapar(v.placa)}">${escapar(v.placa)} · ${escapar(v.marca)} ${escapar(v.modelo)} · ${escapar(v.color)}</option>`
        ).join('');

    const selEmpleado = document.getElementById('empleado-catalogo');
    selEmpleado.innerHTML = '<option value="">Selecciona...</option>' +
        CATALOGO.empleados.map((e) => {
            const nombre = `${e.nombres} ${e.apellidos}`;
            return `<option value="${escapar(e.documento)}" data-nombre="${escapar(nombre)}">${escapar(nombre)} · ${escapar(e.rol)}</option>`;
        }).join('');
}

function aplicarClienteCatalogo(documento) {
    const cliente = CATALOGO.clientes.find((c) => c.documento === documento);
    if (!cliente) return;
    document.getElementById('cliente-documento').value = cliente.documento;
    document.getElementById('cliente-nombre').value = cliente.nombre;
    document.getElementById('cliente-telefono').value = cliente.telefono;
    document.getElementById('cliente-direccion').value = cliente.direccion;
    document.getElementById('cliente-email').value = cliente.email || '';
}

function aplicarVehiculoCatalogo(placa) {
    const vehiculo = CATALOGO.vehiculos.find((v) => v.placa === placa);
    if (!vehiculo) return;
    document.getElementById('vehiculo-placa').value = vehiculo.placa;
    document.getElementById('vehiculo-modelo').value = `${vehiculo.marca} ${vehiculo.modelo}`.trim();
    document.getElementById('vehiculo-color').value = vehiculo.color;
}

function sincronizarEmpleado() {
    const select = document.getElementById('empleado-catalogo');
    const opcion = select.options[select.selectedIndex];
    document.getElementById('empleado-documento').value = select.value || '';
    document.getElementById('empleado-nombre').value = opcion && opcion.dataset.nombre
        ? opcion.dataset.nombre
        : '';
}

function filaRepuesto(repuesto) {
    const datos = repuesto || { referencia: '', descripcion: '', marca: '', precio: '', cantidad: 1 };
    const fila = document.createElement('div');
    fila.className = 'repuesto-fila';
    fila.innerHTML = `
        <div>
            <label>Referencia</label>
            <input type="text" class="rep-referencia" value="${escapar(datos.referencia)}" placeholder="FR-220" required>
        </div>
        <div>
            <label>Descripción</label>
            <input type="text" class="rep-descripcion" value="${escapar(datos.descripcion)}" placeholder="Pastillas de freno" required>
        </div>
        <div>
            <label>Marca</label>
            <input type="text" class="rep-marca" value="${escapar(datos.marca)}" placeholder="Bosch" required>
        </div>
        <div>
            <label>Precio unitario ($)</label>
            <input type="number" class="rep-precio" min="1" step="1" value="${escapar(datos.precio)}" placeholder="85000" required>
        </div>
        <div>
            <label>Cantidad</label>
            <input type="number" class="rep-cantidad" min="1" step="1" value="${escapar(datos.cantidad || 1)}" required>
        </div>
        <button type="button" class="btn-accion btn-eliminar quitar-repuesto">Quitar</button>
    `;
    fila.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', actualizarResumen);
    });
    return fila;
}

function agregarRepuesto(repuesto) {
    listaRepuestos.appendChild(filaRepuesto(repuesto));
    actualizarResumen();
}

function leerRepuestos(soloCompletos = true) {
    const lista = Array.from(listaRepuestos.querySelectorAll('.repuesto-fila')).map((fila) => ({
        referencia: fila.querySelector('.rep-referencia').value.trim(),
        descripcion: fila.querySelector('.rep-descripcion').value.trim(),
        marca: fila.querySelector('.rep-marca').value.trim(),
        precio: Number(fila.querySelector('.rep-precio').value),
        cantidad: Number(fila.querySelector('.rep-cantidad').value) || 1
    }));

    if (!soloCompletos) {
        return lista.filter((r) => r.referencia || r.descripcion || r.marca || r.precio || r.cantidad);
    }

    return lista.filter((r) => r.referencia || r.descripcion || r.marca || r.precio);
}

function renderizarTabla(filtro) {
    const texto = (filtro || '').toLowerCase().trim();
    tablaBody.innerHTML = '';

    const filtrados = ordenes.filter((orden) => {
        const haystack = [
            orden.numero_orden,
            orden.cliente_nombre,
            orden.cliente_documento,
            orden.vehiculo_placa,
            orden.empleado_nombre,
            orden.estado,
            String(orden.total)
        ].join(' ').toLowerCase();
        return !texto || haystack.includes(texto);
    });

    if (!filtrados.length) {
        tablaBody.innerHTML = '<tr><td colspan="8" class="sin-resultados">No se encontraron órdenes</td></tr>';
    } else {
        filtrados.forEach((orden) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${escapar(orden.numero_orden)}</td>
                <td>${escapar(orden.cliente_nombre)}</td>
                <td>${escapar(orden.vehiculo_placa)}</td>
                <td>${escapar(orden.empleado_nombre)}</td>
                <td>${escapar(formatoIngreso(orden.fecha_ingreso))}</td>
                <td>${escapar(orden.horas_empleadas)}</td>
                <td>${escapar(formatoPesos(orden.total))}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" type="button" data-accion="editar" data-id="${orden.id}">Editar</button>
                        <button class="btn-accion btn-facturar" type="button" data-accion="facturar" data-id="${orden.id}">Facturar</button>
                        <button class="btn-accion btn-eliminar" type="button" data-accion="eliminar" data-id="${orden.id}">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(fila);
        });
    }

    contador.textContent = `${filtrados.length} registro(s)`;
}

function prepararFormulario(orden) {
    llenarCatalogos();
    formOrden.reset();
    document.getElementById('valor-hora').value = VALOR_HORA_DEFAULT;
    document.getElementById('utilidad-estimada').value = 0;

    if (orden) {
        document.getElementById('cliente-catalogo').value = orden.cliente_documento;
        document.getElementById('cliente-documento').value = orden.cliente_documento;
        document.getElementById('cliente-nombre').value = orden.cliente_nombre;
        document.getElementById('cliente-telefono').value = orden.cliente_telefono;
        document.getElementById('cliente-direccion').value = orden.cliente_direccion;
        document.getElementById('cliente-email').value = orden.cliente_email || '';

        document.getElementById('vehiculo-catalogo').value = orden.vehiculo_placa;
        document.getElementById('vehiculo-placa').value = orden.vehiculo_placa;
        document.getElementById('vehiculo-modelo').value = orden.vehiculo_modelo;
        document.getElementById('vehiculo-color').value = orden.vehiculo_color;
        document.getElementById('fecha-ingreso').value = aDatetimeLocal(orden.fecha_ingreso);

        document.getElementById('empleado-catalogo').value = orden.empleado_documento;
        document.getElementById('empleado-documento').value = orden.empleado_documento;
        document.getElementById('empleado-nombre').value = orden.empleado_nombre;
        document.getElementById('horas-empleadas').value = orden.horas_empleadas;
        document.getElementById('valor-hora').value = orden.valor_hora;
        document.getElementById('utilidad-estimada').value = orden.utilidad_estimada;
    }

    sincronizarEmpleado();
    listaRepuestos.innerHTML = '';
    if (orden && orden.repuestos.length) {
        orden.repuestos.forEach(agregarRepuesto);
    } else {
        agregarRepuesto();
    }
    actualizarResumen();
}

function leerFormularioOrden() {
    sincronizarEmpleado();
    const repuestos = leerRepuestos(true);
    const horas = Number(document.getElementById('horas-empleadas').value);
    const valorHora = Number(document.getElementById('valor-hora').value);
    const utilidad = Number(document.getElementById('utilidad-estimada').value);
    const totales = calcularTotales({ horas, valorHora, utilidad, repuestos });

    return {
        numero_orden: editando ? numeroEditando : siguienteNumeroOrden(ordenes),
        cliente_documento: document.getElementById('cliente-documento').value.trim(),
        cliente_nombre: document.getElementById('cliente-nombre').value.trim(),
        cliente_telefono: document.getElementById('cliente-telefono').value.trim(),
        cliente_direccion: document.getElementById('cliente-direccion').value.trim(),
        cliente_email: document.getElementById('cliente-email').value.trim() || null,
        vehiculo_placa: document.getElementById('vehiculo-placa').value.trim().toUpperCase(),
        vehiculo_modelo: document.getElementById('vehiculo-modelo').value.trim(),
        vehiculo_color: document.getElementById('vehiculo-color').value.trim(),
        fecha_ingreso: aDatetimeMysql(document.getElementById('fecha-ingreso').value),
        empleado_documento: document.getElementById('empleado-documento').value.trim(),
        empleado_nombre: document.getElementById('empleado-nombre').value.trim(),
        horas_empleadas: horas,
        valor_hora: valorHora,
        utilidad_estimada: utilidad,
        repuestos,
        subtotal: totales.baseGravable,
        iva: totales.iva,
        total: totales.total,
        estado: 'ABIERTA'
    };
}

function validarOrden(orden) {
    if (!orden.cliente_documento || !orden.cliente_nombre || !orden.cliente_telefono || !orden.cliente_direccion) {
        return 'Completa los datos del cliente (documento, nombre, teléfono y dirección).';
    }
    if (!orden.vehiculo_placa || !orden.vehiculo_modelo || !orden.vehiculo_color || !orden.fecha_ingreso) {
        return 'Completa placa, modelo, color y fecha de ingreso del vehículo.';
    }
    if (!orden.empleado_documento || !orden.empleado_nombre) {
        return 'Selecciona el empleado responsable.';
    }
    if (!orden.horas_empleadas || orden.horas_empleadas <= 0) {
        return 'Las horas empleadas deben ser mayores que cero.';
    }
    if (!(orden.valor_hora >= 0) || !(orden.utilidad_estimada >= 0)) {
        return 'Valor por hora y utilidad estimada deben ser números válidos.';
    }
    if (!orden.repuestos.length) {
        return 'Agrega al menos un repuesto.';
    }
    const incompleto = orden.repuestos.some((r) =>
        !r.referencia || !r.descripcion || !r.marca || !(r.precio > 0) || !(r.cantidad > 0)
    );
    if (incompleto) {
        return 'Cada repuesto necesita referencia, descripción, marca, precio y cantidad.';
    }
    return null;
}

async function cargarOrdenes() {
    contador.textContent = 'Cargando...';
    const respuesta = await api.get('ordenes');
    const cuerpo = cuerpoPanther(respuesta);

    if (respuesta.status === 204 || (respuesta.ok && (!cuerpo || (Array.isArray(cuerpo) && !cuerpo.length)))) {
        ordenes = [];
        renderizarTabla(buscador.value);
        return;
    }

    if (!respuesta.ok || !Array.isArray(cuerpo)) {
        ordenes = [];
        renderizarTabla(buscador.value);
        mostrarNotificacion(
            respuesta.mensaje || 'No se pudieron cargar las órdenes desde Panther.',
            'error'
        );
        return;
    }

    ordenes = cuerpo.map(normalizarOrden);
    renderizarTabla(buscador.value);
}

async function guardarOrden(evento) {
    evento.preventDefault();
    if (cargando) return;

    const payload = leerFormularioOrden();
    const error = validarOrden(payload);
    if (error) {
        mostrarNotificacion(error, 'error');
        return;
    }

    setCargando(true, editando ? 'Actualizando...' : 'Guardando...');

    try {
        const respuesta = editando
            ? await api.put('ordenes', idEditando, payload)
            : await api.post('ordenes', payload);

        if (!respuesta.ok) {
            mostrarNotificacion(respuesta.mensaje || 'No se pudo guardar la orden.', 'error');
            return;
        }

        mostrarNotificacion(
            editando ? 'Orden actualizada correctamente.' : 'Orden registrada en MariaDB.',
            'success'
        );
        cerrarModal('modal-orden');
        await cargarOrdenes();
    } catch (err) {
        mostrarNotificacion(err.message || 'Error de red al guardar la orden.', 'error');
    } finally {
        setCargando(false);
    }
}

async function eliminarOrden(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta orden?')) return;

    const respuesta = await api.delete('ordenes', id);
    if (!respuesta.ok) {
        mostrarNotificacion(respuesta.mensaje || 'No se pudo eliminar la orden.', 'error');
        return;
    }

    mostrarNotificacion('Orden eliminada correctamente.', 'success');
    await cargarOrdenes();
}

function editarOrden(id) {
    const orden = ordenes.find((item) => Number(item.id) === Number(id));
    if (!orden) return;
    editando = true;
    idEditando = orden.id;
    numeroEditando = orden.numero_orden;
    modalTitulo.textContent = `Editar orden ${orden.numero_orden}`;
    prepararFormulario(orden);
    abrirModal('modal-orden');
}

function facturarOrden(id) {
    window.location.href = `factura.html?ordenId=${encodeURIComponent(id)}`;
}

// --- Eventos ---
document.getElementById('cliente-catalogo').addEventListener('change', function () {
    if (this.value) aplicarClienteCatalogo(this.value);
});

document.getElementById('vehiculo-catalogo').addEventListener('change', function () {
    if (this.value) aplicarVehiculoCatalogo(this.value);
});

document.getElementById('empleado-catalogo').addEventListener('change', sincronizarEmpleado);

['horas-empleadas', 'valor-hora', 'utilidad-estimada'].forEach((id) => {
    document.getElementById(id).addEventListener('input', actualizarResumen);
});

document.getElementById('btn-agregar-repuesto').addEventListener('click', () => agregarRepuesto());

listaRepuestos.addEventListener('click', (evento) => {
    if (!evento.target.classList.contains('quitar-repuesto')) return;
    const filas = listaRepuestos.querySelectorAll('.repuesto-fila');
    if (filas.length === 1) {
        mostrarNotificacion('La orden debe incluir al menos un repuesto.', 'error');
        return;
    }
    evento.target.closest('.repuesto-fila').remove();
    actualizarResumen();
});

document.getElementById('btn-nueva-orden').addEventListener('click', () => {
    editando = false;
    idEditando = null;
    numeroEditando = null;
    modalTitulo.textContent = 'Nueva orden';
    prepararFormulario(null);
    abrirModal('modal-orden');
});

formOrden.addEventListener('submit', guardarOrden);

tablaBody.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;
    const id = boton.dataset.id;
    const accion = boton.dataset.accion;
    if (accion === 'editar') editarOrden(id);
    if (accion === 'eliminar') eliminarOrden(id);
    if (accion === 'facturar') facturarOrden(id);
});

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

cargarOrdenes();
