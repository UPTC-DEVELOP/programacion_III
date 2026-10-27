// CRUD DE FACTURAS

const FACTURAS_SEMILLA = [
    (function () {
        const orden = ORDENES_SEMILLA[0];
        const cuentas = calcularFactura(orden, 35000, 20000);
        return Object.assign({
            numero: 'FAC-001',
            ordenNumero: orden.numero,
            fecha: '2026-03-12',
            tarifaHora: 35000,
            clienteNombre: nombreCliente(orden.clienteDocumento),
            placa: orden.placa
        }, cuentas);
    })()
];

let facturas = leerLista(CLAVE_FACTURAS, FACTURAS_SEMILLA);
let editando = false;
let numeroEditando = null;

const tablaBody = document.getElementById('tabla-facturas-body');
const contador = document.getElementById('contador-facturas');
const buscador = document.getElementById('buscar-factura');
const formFactura = document.getElementById('form-factura');
const modalTitulo = document.getElementById('modal-titulo');

function pintarResumen(cuentas) {
    const resumen = cuentas || { repuestos: 0, manoObra: 0, utilidad: 0, subtotal: 0, iva: 0, total: 0 };
    document.getElementById('res-repuestos').textContent = formatoPesos(resumen.repuestos);
    document.getElementById('res-mano').textContent = formatoPesos(resumen.manoObra);
    document.getElementById('res-utilidad').textContent = formatoPesos(resumen.utilidad);
    document.getElementById('res-subtotal').textContent = formatoPesos(resumen.subtotal);
    document.getElementById('res-iva').textContent = formatoPesos(resumen.iva);
    document.getElementById('res-total').textContent = formatoPesos(resumen.total);
}

function cuentasActuales() {
    const orden = buscarOrden(document.getElementById('orden').value);
    if (!orden) return null;
    return calcularFactura(
        orden,
        document.getElementById('tarifa-hora').value,
        document.getElementById('utilidad').value
    );
}

function actualizarResumen() {
    pintarResumen(cuentasActuales());
}

function llenarOrdenes(valorInicial) {
    const select = document.getElementById('orden');
    const ocupadas = facturas
        .filter(function (factura) { return factura.numero !== numeroEditando; })
        .map(function (factura) { return factura.ordenNumero; });

    select.innerHTML = '<option value="">Selecciona...</option>' + obtenerOrdenes().map(function (orden) {
        if (ocupadas.indexOf(orden.numero) !== -1 && orden.numero !== valorInicial) return '';
        const texto = orden.numero + ' · ' + nombreCliente(orden.clienteDocumento) + ' · ' + orden.placa;
        return '<option value="' + escapar(orden.numero) + '">' + escapar(texto) + '</option>';
    }).join('');
    if (valorInicial) select.value = valorInicial;
}

function renderizarTabla(filtro) {
    const texto = (filtro || '').toLowerCase();
    tablaBody.innerHTML = '';

    const filtrados = facturas.filter(function (factura) {
        return factura.numero.toLowerCase().includes(texto) ||
            factura.clienteNombre.toLowerCase().includes(texto) ||
            factura.ordenNumero.toLowerCase().includes(texto) ||
            factura.placa.toLowerCase().includes(texto);
    });

    if (!filtrados.length) {
        tablaBody.innerHTML = '<tr><td colspan="8" class="sin-resultados">No se encontraron facturas</td></tr>';
    } else {
        filtrados.forEach(function (factura) {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${escapar(factura.numero)}</td>
                <td>${escapar(factura.fecha)}</td>
                <td>${escapar(factura.clienteNombre)}</td>
                <td>${escapar(factura.ordenNumero)}</td>
                <td>${escapar(formatoPesos(factura.subtotal))}</td>
                <td>${escapar(formatoPesos(factura.iva))}</td>
                <td>${escapar(formatoPesos(factura.total))}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="editarFactura('${escapar(factura.numero)}')">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarFactura('${escapar(factura.numero)}')">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(fila);
        });
    }

    contador.textContent = filtrados.length + ' registro(s)';
}

document.getElementById('btn-nueva-factura').addEventListener('click', function () {
    editando = false;
    numeroEditando = null;
    modalTitulo.textContent = 'Nueva factura';
    formFactura.reset();
    document.getElementById('tarifa-hora').value = 35000;
    document.getElementById('utilidad').value = 0;
    llenarOrdenes('');
    pintarResumen(null);
    abrirModal('modal-factura');
});

function editarFactura(numero) {
    const factura = facturas.find(function (item) { return item.numero === numero; });
    if (!factura) return;
    editando = true;
    numeroEditando = numero;
    modalTitulo.textContent = 'Editar factura';
    llenarOrdenes(factura.ordenNumero);
    document.getElementById('fecha').value = factura.fecha;
    document.getElementById('tarifa-hora').value = factura.tarifaHora;
    document.getElementById('utilidad').value = factura.utilidad;
    actualizarResumen();
    abrirModal('modal-factura');
}

['orden', 'tarifa-hora', 'utilidad'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', actualizarResumen);
});

formFactura.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const orden = buscarOrden(document.getElementById('orden').value);
    const fecha = document.getElementById('fecha').value;
    const tarifaHora = Number(document.getElementById('tarifa-hora').value);
    const utilidad = Number(document.getElementById('utilidad').value);

    if (!orden || !fecha) {
        mostrarNotificacion('Selecciona una orden y la fecha de emisión.', 'error');
        return;
    }
    if (!tarifaHora || tarifaHora <= 0) {
        mostrarNotificacion('La tarifa por hora debe ser mayor que cero.', 'error');
        return;
    }
    if (utilidad < 0 || Number.isNaN(utilidad)) {
        mostrarNotificacion('La utilidad estimada no puede ser negativa.', 'error');
        return;
    }

    const cuentas = calcularFactura(orden, tarifaHora, utilidad);
    const factura = Object.assign({
        numero: editando ? numeroEditando : siguienteNumero(facturas, 'FAC'),
        ordenNumero: orden.numero,
        fecha: fecha,
        tarifaHora: tarifaHora,
        clienteNombre: nombreCliente(orden.clienteDocumento),
        placa: orden.placa
    }, cuentas);

    if (editando) {
        const indice = facturas.findIndex(function (item) { return item.numero === numeroEditando; });
        if (indice !== -1) facturas[indice] = factura;
        mostrarNotificacion('Factura actualizada correctamente.', 'success');
    } else {
        facturas.push(factura);
        mostrarNotificacion('Factura registrada correctamente.', 'success');
    }

    guardarLista(CLAVE_FACTURAS, facturas);
    cerrarModal('modal-factura');
    renderizarTabla(buscador.value);
});

function eliminarFactura(numero) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    facturas = facturas.filter(function (factura) { return factura.numero !== numero; });
    guardarLista(CLAVE_FACTURAS, facturas);
    mostrarNotificacion('Factura eliminada correctamente.', 'success');
    renderizarTabla(buscador.value);
}

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

renderizarTabla();
