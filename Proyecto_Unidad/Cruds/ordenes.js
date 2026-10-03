// CRUD DE ÓRDENES

let ordenes = obtenerOrdenes();
let editando = false;
let numeroEditando = null;

const tablaBody = document.getElementById('tabla-ordenes-body');
const contador = document.getElementById('contador-ordenes');
const buscador = document.getElementById('buscar-orden');
const formOrden = document.getElementById('form-orden');
const modalTitulo = document.getElementById('modal-titulo');
const listaRepuestos = document.getElementById('lista-repuestos');

function llenarSelect(select, opciones, valorInicial) {
    select.innerHTML = '<option value="">Selecciona...</option>' + opciones;
    if (valorInicial) select.value = valorInicial;
}

function opcionesClientes() {
    return CATALOGO.clientes.map(function (cliente) {
        return '<option value="' + escapar(cliente.documento) + '">' + escapar(cliente.nombre) + '</option>';
    }).join('');
}

function opcionesEmpleados() {
    return CATALOGO.empleados.map(function (empleado) {
        const nombre = empleado.nombres + ' ' + empleado.apellidos + ' · ' + empleado.rol;
        return '<option value="' + escapar(empleado.documento) + '">' + escapar(nombre) + '</option>';
    }).join('');
}

function opcionesVehiculos(documentoCliente, placaInicial) {
    const cliente = CATALOGO.clientes.find(function (item) { return item.documento === documentoCliente; });
    const lista = CATALOGO.vehiculos.filter(function (vehiculo) {
        return !cliente || vehiculo.propietario === cliente.nombre;
    });
    const visibles = lista.length ? lista : CATALOGO.vehiculos;
    const html = visibles.map(function (vehiculo) {
        const texto = vehiculo.placa + ' · ' + vehiculo.marca + ' ' + vehiculo.modelo + ' · ' + vehiculo.color;
        return '<option value="' + escapar(vehiculo.placa) + '">' + escapar(texto) + '</option>';
    }).join('');
    llenarSelect(document.getElementById('placa'), html, placaInicial);
}

function filaRepuesto(repuesto) {
    const datos = repuesto || { referencia: '', descripcion: '', marca: '', precio: '' };
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
            <label>Precio</label>
            <input type="number" class="rep-precio" min="1" step="1" value="${escapar(datos.precio)}" placeholder="85000" required>
        </div>
        <button type="button" class="btn-accion btn-eliminar quitar-repuesto">Quitar</button>
    `;
    return fila;
}

function agregarRepuesto(repuesto) {
    listaRepuestos.appendChild(filaRepuesto(repuesto));
}

function leerRepuestos() {
    return Array.from(listaRepuestos.querySelectorAll('.repuesto-fila')).map(function (fila) {
        return {
            referencia: fila.querySelector('.rep-referencia').value.trim(),
            descripcion: fila.querySelector('.rep-descripcion').value.trim(),
            marca: fila.querySelector('.rep-marca').value.trim(),
            precio: Number(fila.querySelector('.rep-precio').value)
        };
    }).filter(function (repuesto) {
        return repuesto.referencia || repuesto.descripcion || repuesto.marca || repuesto.precio;
    });
}

function renderizarTabla(filtro) {
    const texto = (filtro || '').toLowerCase();
    tablaBody.innerHTML = '';

    const filtrados = ordenes.filter(function (orden) {
        const cliente = nombreCliente(orden.clienteDocumento).toLowerCase();
        const empleado = nombreEmpleado(orden.empleadoDocumento).toLowerCase();
        return orden.numero.toLowerCase().includes(texto) ||
            cliente.includes(texto) ||
            orden.placa.toLowerCase().includes(texto) ||
            empleado.includes(texto);
    });

    if (!filtrados.length) {
        tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados">No se encontraron órdenes</td></tr>';
    } else {
        filtrados.forEach(function (orden) {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${escapar(orden.numero)}</td>
                <td>${escapar(nombreCliente(orden.clienteDocumento))}</td>
                <td>${escapar(orden.placa)}</td>
                <td>${escapar(nombreEmpleado(orden.empleadoDocumento))}</td>
                <td>${escapar(formatoIngreso(orden.ingreso))}</td>
                <td>${escapar(orden.horas)}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="editarOrden('${escapar(orden.numero)}')">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarOrden('${escapar(orden.numero)}')">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(fila);
        });
    }

    contador.textContent = filtrados.length + ' registro(s)';
}

function prepararFormulario(orden) {
    llenarSelect(document.getElementById('cliente'), opcionesClientes(), orden ? orden.clienteDocumento : '');
    opcionesVehiculos(orden ? orden.clienteDocumento : '', orden ? orden.placa : '');
    llenarSelect(document.getElementById('empleado'), opcionesEmpleados(), orden ? orden.empleadoDocumento : '');
    document.getElementById('ingreso').value = orden ? orden.ingreso : '';
    document.getElementById('horas').value = orden ? orden.horas : '';
    listaRepuestos.innerHTML = '';
    if (orden && orden.repuestos.length) {
        orden.repuestos.forEach(agregarRepuesto);
    } else {
        agregarRepuesto();
    }
}

document.getElementById('cliente').addEventListener('change', function () {
    opcionesVehiculos(this.value, '');
});

document.getElementById('btn-agregar-repuesto').addEventListener('click', function () {
    agregarRepuesto();
});

listaRepuestos.addEventListener('click', function (evento) {
    if (!evento.target.classList.contains('quitar-repuesto')) return;
    const filas = listaRepuestos.querySelectorAll('.repuesto-fila');
    if (filas.length === 1) {
        mostrarNotificacion('La orden debe incluir al menos un repuesto.', 'error');
        return;
    }
    evento.target.closest('.repuesto-fila').remove();
});

document.getElementById('btn-nueva-orden').addEventListener('click', function () {
    editando = false;
    numeroEditando = null;
    modalTitulo.textContent = 'Nueva orden';
    formOrden.reset();
    prepararFormulario(null);
    abrirModal('modal-orden');
});

function editarOrden(numero) {
    const orden = ordenes.find(function (item) { return item.numero === numero; });
    if (!orden) return;
    editando = true;
    numeroEditando = numero;
    modalTitulo.textContent = 'Editar orden';
    prepararFormulario(orden);
    abrirModal('modal-orden');
}

formOrden.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const orden = {
        numero: editando ? numeroEditando : siguienteNumero(ordenes, 'ORD'),
        clienteDocumento: document.getElementById('cliente').value,
        placa: document.getElementById('placa').value,
        empleadoDocumento: document.getElementById('empleado').value,
        ingreso: document.getElementById('ingreso').value,
        horas: Number(document.getElementById('horas').value),
        repuestos: leerRepuestos()
    };

    if (!orden.clienteDocumento || !orden.placa || !orden.empleadoDocumento || !orden.ingreso) {
        mostrarNotificacion('Completa cliente, vehículo, empleado y fecha de ingreso.', 'error');
        return;
    }
    if (!orden.horas || orden.horas <= 0) {
        mostrarNotificacion('Las horas empleadas deben ser mayores que cero.', 'error');
        return;
    }
    const repuestoIncompleto = !orden.repuestos.length || orden.repuestos.some(function (repuesto) {
        return !repuesto.referencia || !repuesto.descripcion || !repuesto.marca || !(repuesto.precio > 0);
    });
    if (repuestoIncompleto) {
        mostrarNotificacion('Cada repuesto necesita referencia, descripción, marca y precio.', 'error');
        return;
    }

    if (editando) {
        const indice = ordenes.findIndex(function (item) { return item.numero === numeroEditando; });
        if (indice !== -1) ordenes[indice] = orden;
        mostrarNotificacion('Orden actualizada correctamente.', 'success');
    } else {
        ordenes.push(orden);
        mostrarNotificacion('Orden registrada correctamente.', 'success');
    }

    guardarOrdenes(ordenes);
    cerrarModal('modal-orden');
    renderizarTabla(buscador.value);
});

function eliminarOrden(numero) {
    const facturas = leerLista(CLAVE_FACTURAS, []);
    if (facturas.some(function (factura) { return factura.ordenNumero === numero; })) {
        mostrarNotificacion('No se puede eliminar: esta orden ya tiene una factura.', 'error');
        return;
    }
    if (!confirm('¿Estás seguro de que deseas eliminar esta orden?')) return;
    ordenes = ordenes.filter(function (orden) { return orden.numero !== numero; });
    guardarOrdenes(ordenes);
    mostrarNotificacion('Orden eliminada correctamente.', 'success');
    renderizarTabla(buscador.value);
}

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

renderizarTabla();
