// Facturacion electronica

// Configuracion y variables
const TOKEN_FALLBACK = '750e8b43e5ed564462c90ef0d382db26';
const BASE_URL_FACTURAS = pantherUrl('facturas');
const BASE_URL_ORDENES = pantherUrl('ordenes');
const CLARISA_USUARIO_FIJO = 'demo_api';

function tokenPanther() {
    if (typeof SesionTaller !== 'undefined' && SesionTaller.tokenPanther) {
        return SesionTaller.tokenPanther(TOKEN_FALLBACK);
    }
    return sessionStorage.getItem('pantherKeyAPI') || TOKEN_FALLBACK;
}

function headersPanther(json) {
    const h = { authorization: tokenPanther() };
    if (json) h['Content-Type'] = 'application/json';
    return h;
}

function filasPanther(data) {
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    if (data.data != null) return Array.isArray(data.data) ? data.data : [];
    return [];
}

const PAGINA_LOGIN = '../login.html';
const SEGUNDOS_ENTRE_CONSULTAS = 5;
const SEGUNDOS_ENTRE_ENVIOS = 3;
const TARIFA_IVA = 19;
const FACTOR_IVA = 0.19;
const UNIDAD = '94';
const CODIGO_SERVICIO = 'SRV-TALLER';
const CONSECUTIVO_INICIAL = 990000001;
const CLAVE_CONSECUTIVO = 'autotech-ultimo-consecutivo';
const FORMAS_PAGO = ['1', '2'];
const MEDIOS_PAGO = ['10', '47', '48', '49'];
const TIPOS_ID = ['CC', 'NI', 'CE', 'PA'];
const ESTADOS_REENVIABLES = ['PENDIENTE_ENVIO', 'RECHAZADA'];
const ESTADOS_CONSULTA = ['VERIFICANDO', 'PENDIENTE'];
const ROLES_FACTURACION = [1, 3];

function rolActual() {
    if (typeof SesionTaller !== 'undefined' && typeof SesionTaller.rol === 'function') {
        return SesionTaller.rol();
    }
    const r = parseInt(sessionStorage.getItem('userRole'), 10);
    return Number.isFinite(r) ? r : 0;
}

function puedeFacturar() {
    return ROLES_FACTURACION.includes(rolActual());
}

function sesionFacturaActiva() {
    const panther = typeof SesionTaller !== 'undefined'
        ? SesionTaller.pantherActiva()
        : Boolean(sessionStorage.getItem('pantherKeyAPI'));
    return Boolean(panther && puedeFacturar());
}

if (!sesionFacturaActiva()) {
    if (typeof SesionTaller !== 'undefined' && SesionTaller.pantherActiva() && !puedeFacturar()) {
        window.location.replace('panel-principal.html');
    } else {
        window.location.replace(PAGINA_LOGIN);
    }
}

const redondear = (valor) => Math.round(((Number(valor) || 0) + Number.EPSILON) * 100) / 100;
const sumar = (lista, campo) => redondear(lista.reduce((suma, item) => suma + campo(item), 0));

const formatoPesos = (valor) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2
}).format(Number(valor) || 0);

const dosDigitos = (n) => String(n).padStart(2, '0');
const escapar = (texto) => String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function fechaISO(fecha) {
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

function fechaMasDias(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return fechaISO(fecha);
}

function fechaHoraLocalActual() {
    const ahora = new Date();
    return `${fechaISO(ahora)}T${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`;
}

function aDatetimeLocal(valor) {
    if (!valor) return '';
    const texto = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(texto)) return texto.slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(texto)) return texto.replace(' ', 'T').slice(0, 16);
    return texto.slice(0, 16);
}

function parseJson(valor, fallback) {
    if (valor == null || valor === '') return fallback;
    if (typeof valor === 'object') return valor;
    try {
        return JSON.parse(valor);
    } catch (_) {
        return fallback;
    }
}

function mensajePantherHttp(status, data) {
    if (status === 0) return 'No se pudo conectar con Panther. Verifica Apache/MariaDB y la URL del REST.';
    if (status === 401 || status === 403) {
        return 'Panther rechazó la clave API. Revisa Authorization del usuario admin.';
    }
    if (data && (data.data || data.message || data.mensaje)) {
        const msg = data.data || data.message || data.mensaje;
        return typeof msg === 'string' ? msg : `Panther respondió HTTP ${status}.`;
    }
    return `Panther respondió HTTP ${status}.`;
}

function mensajeClarisaBackend(clarisa) {
    if (!clarisa) return 'Sin respuesta de Clarisa.';
    if (clarisa.mensaje) return clarisa.mensaje;
    if (clarisa.ok) return `Clarisa Sandbox: ${clarisa.estado_dian || 'OK'}`;
    return `Clarisa rechazó la operación (HTTP ${clarisa.http_status || 'sin código'}).`;
}

function resultadoPanther(data) {
    if (!data) return null;
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return data.data;
    }
    return data;
}

// Items y payload Clarisa
function impuestoIva() {
    return { tipo: 'IVA', claseImpuesto: 'PO', tarifaTributo: TARIFA_IVA };
}

function agregarImpuesto(item, impuesto) {
    if (item.impuestos.some((existente) => existente.tipo === impuesto.tipo)) {
        throw new Error(`El ítem ${item.codigo} ya tiene un impuesto de tipo ${impuesto.tipo}.`);
    }
    item.impuestos.push(impuesto);
    return item;
}

function crearItem({ codigo, nombreItem, observacion, cantidad, precioBaseUnitario, valorDescuento = 0 }) {
    const base = redondear((precioBaseUnitario - valorDescuento) * cantidad);
    const item = {
        codigo,
        nombreItem,
        precioBaseUnitario: redondear(precioBaseUnitario),
        cantidad,
        unidad: UNIDAD,
        valorDescuento: redondear(valorDescuento),
        observacion: String(observacion || '').slice(0, 1000),
        impuestos: [],
        base,
        iva: redondear(base * FACTOR_IVA)
    };
    return agregarImpuesto(item, impuestoIva());
}

function construirItems(datos) {
    const items = datos.repuestos.map((rep) => crearItem({
        codigo: rep.referencia,
        nombreItem: `${rep.descripcion} ${rep.marca}`,
        observacion: `Repuesto marca ${rep.marca} - Placa ${datos.placa}`,
        cantidad: rep.cantidad,
        precioBaseUnitario: rep.precio,
        valorDescuento: rep.descuento
    }));

    items.push(crearItem({
        codigo: CODIGO_SERVICIO,
        nombreItem: `Mano de obra taller: ${datos.horas} h x ${formatoPesos(datos.valorHora)} + utilidad ${formatoPesos(datos.utilidad)}`,
        observacion: `Mecánico: ${datos.mecanico} - Vehículo: ${datos.placa} ${datos.modelo} ${datos.color}`,
        cantidad: 1,
        precioBaseUnitario: redondear(datos.horas * datos.valorHora + datos.utilidad)
    }));
    return items;
}

function totalizar(items) {
    const repuestos = items.filter((item) => item.codigo !== CODIGO_SERVICIO);
    const servicio = items.find((item) => item.codigo === CODIGO_SERVICIO);
    const baseGravable = sumar(items, (i) => i.base);
    const iva = sumar(items, (i) => i.iva);
    return {
        subtotalRepuestos: sumar(repuestos, (i) => i.precioBaseUnitario * i.cantidad),
        subtotalServicio: servicio ? servicio.base : 0,
        totalDescuentos: sumar(items, (i) => i.valorDescuento * i.cantidad),
        baseGravable,
        iva,
        total: redondear(baseGravable + iva)
    };
}

function itemParaClarisa({ codigo, nombreItem, precioBaseUnitario, cantidad, unidad, valorDescuento, observacion, impuestos }) {
    const item = { codigo, nombreItem, precioBaseUnitario, cantidad, unidad, observacion, impuestos };
    if (valorDescuento > 0) item.valorDescuento = valorDescuento;
    return item;
}

function construirPayloadClarisa(datos, items, totales) {
    const payload = {
        nit: datos.nit,
        numeroResolucion: datos.resolucion,
        consecutivoDcto: datos.consecutivo,
        fechaVencimiento: datos.vencimiento,
        formaPago: datos.formaPago,
        mediosPago: [datos.medioPago],
        total: totales.total,
        observacion: (`Orden de servicio taller - Placa: ${datos.placa} | Modelo: ${datos.modelo} | Color: ${datos.color}` +
            ` | Fecha de ingreso: ${String(datos.ingreso).replace('T', ' ')} | Mecánico asignado: ${datos.mecanico}`).slice(0, 1000),
        cliente: {
            nombreRazonSocial: datos.nombre,
            tipoIdentificacion: datos.tipoId,
            numIdentificacion: datos.documento,
            naturaleza: datos.naturaleza,
            email: datos.email,
            respFiscales: datos.respFiscales,
            respTributarias: datos.respTributarias,
            direccion: datos.direccion,
            ciudad: datos.ciudad,
            telefono: datos.telefono
        },
        items: items.map(itemParaClarisa)
    };
    if (datos.prefijo) payload.prefijoDcto = datos.prefijo;
    return payload;
}

function etiquetaEstado(estado) {
    const mapa = {
        PENDIENTE_ENVIO: 'Pendiente de envío',
        VERIFICANDO: 'En validación',
        APROBADA: 'Aprobada',
        RECHAZADA: 'Rechazada',
        PENDIENTE: 'Pendiente DIAN'
    };
    return mapa[estado] || estado || '—';
}

// UI del dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!sesionFacturaActiva()) return;

    const form = document.getElementById('form-factura');
    const panelFormulario = document.getElementById('panel-formulario');
    const repuestosBody = document.getElementById('repuestos-body');
    const btnGuardar = document.getElementById('btn-guardar-factura');
    const btnGenerar = document.getElementById('btn-generar-factura');
    const btnEnviar = document.getElementById('btn-enviar-facturador');
    const btnConsultar = document.getElementById('btn-consultar-dian');
    const notificacion = document.getElementById('notificacion-factura');
    const tablaBody = document.getElementById('tabla-facturas-body');
    const modal = document.getElementById('modal-detalle-factura');
    const modalClave = document.getElementById('modal-clarisa-clave');
    const formClave = document.getElementById('form-clarisa-clave');
    const campo = (id) => document.getElementById(id);
    const valor = (id) => campo(id).value.trim();

    let facturas = [];
    let ordenes = [];
    let facturaAbierta = null;
    let editandoId = null;
    let guardando = false;
    let enviandoClarisa = false;
    let ultimoEnvioClarisa = 0;
    let resolverClaveClarisa = null;

    if (typeof SesionTaller !== 'undefined' && SesionTaller.aplicarUI) {
        SesionTaller.aplicarUI();
    } else {
        campo('usuario-activo').textContent = sessionStorage.getItem('userName') || 'usuario';
    }

    const etiquetaUsuarioApi = campo('clarisa-usuario-fijo');
    if (etiquetaUsuarioApi) etiquetaUsuarioApi.textContent = CLARISA_USUARIO_FIJO;
    const inputUsuarioApi = campo('clarisa-usuario');
    if (inputUsuarioApi) inputUsuarioApi.value = CLARISA_USUARIO_FIJO;

    let temporizadorNotificacion;
    function mostrarNotificacion(mensaje, tipo) {
        clearTimeout(temporizadorNotificacion);
        notificacion.className = 'crud-notificacion ' + tipo;
        notificacion.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
        notificacion.textContent = mensaje;
        if (tipo === 'success' || tipo === 'warning') {
            temporizadorNotificacion = setTimeout(() => {
                notificacion.className = 'crud-notificacion';
                notificacion.textContent = '';
            }, 8000);
        }
    }

    function siguienteConsecutivo() {
        const guardado = Number(localStorage.getItem(CLAVE_CONSECUTIVO));
        const maximoBd = facturas.reduce((mayor, factura) => {
            const numero = Number(factura.consecutivo);
            return Number.isFinite(numero) && numero > mayor ? numero : mayor;
        }, 0);
        const base = Math.max(guardado || 0, maximoBd);
        return String(base > 0 ? base + 1 : CONSECUTIVO_INICIAL);
    }

    function valoresPorDefecto() {
        campo('factura-id').value = '';
        campo('orden-id').value = '';
        campo('doc-consecutivo').value = siguienteConsecutivo();
        campo('doc-vencimiento').value = fechaMasDias(0);
        campo('veh-ingreso').value = fechaHoraLocalActual();
        campo('valor-hora').value = 35000;
        campo('utilidad').value = 0;
        campo('horas').value = '';
        campo('select-orden-cargar').value = '';
    }

    function agregarRepuesto(datos) {
        const rep = datos || {};
        const fila = document.createElement('tr');
        fila.className = 'repuesto-fila';
        fila.innerHTML = `
            <td data-label="Referencia"><input type="text" class="rep-referencia" maxlength="15" placeholder="FR-220" value="${escapar(rep.referencia || '')}" aria-label="Referencia"></td>
            <td data-label="Descripción"><input type="text" class="rep-descripcion" placeholder="Pastillas de freno" value="${escapar(rep.descripcion || '')}" aria-label="Descripción"></td>
            <td data-label="Marca"><input type="text" class="rep-marca" placeholder="Bosch" value="${escapar(rep.marca || '')}" aria-label="Marca"></td>
            <td data-label="Cantidad"><input type="number" class="rep-cantidad" min="1" step="1" value="${escapar(rep.cantidad || 1)}" aria-label="Cantidad"></td>
            <td data-label="Precio unitario"><input type="number" class="rep-precio" min="1" step="1" placeholder="85000" value="${rep.precio ? escapar(rep.precio) : ''}" aria-label="Precio unitario"></td>
            <td data-label="Desc. unitario"><input type="number" class="rep-descuento" min="0" step="1" value="${escapar(rep.descuento || 0)}" aria-label="Descuento por unidad"></td>
            <td data-label="Base ítem" class="rep-subtotal">${formatoPesos(0)}</td>
            <td class="rep-acciones"><button type="button" class="btn-accion btn-eliminar quitar-repuesto">Quitar</button></td>
        `;
        repuestosBody.appendChild(fila);
        return fila;
    }

    function limpiarRepuestos(lista) {
        repuestosBody.innerHTML = '';
        if (lista && lista.length) lista.forEach((rep) => agregarRepuesto(rep));
        else agregarRepuesto();
    }

    function leerRepuestos() {
        return Array.from(repuestosBody.querySelectorAll('.repuesto-fila')).map((fila) => ({
            fila,
            referencia: fila.querySelector('.rep-referencia').value.trim(),
            descripcion: fila.querySelector('.rep-descripcion').value.trim(),
            marca: fila.querySelector('.rep-marca').value.trim(),
            cantidad: Number(fila.querySelector('.rep-cantidad').value) || 0,
            precio: Number(fila.querySelector('.rep-precio').value) || 0,
            descuento: Number(fila.querySelector('.rep-descuento').value) || 0
        }));
    }

    const filaVacia = (rep) => !rep.referencia && !rep.descripcion && !rep.marca && !rep.precio;

    function leerFormulario() {
        return {
            id: campo('factura-id').value ? Number(campo('factura-id').value) : null,
            ordenId: campo('orden-id').value ? Number(campo('orden-id').value) : null,
            nit: valor('doc-nit'),
            resolucion: valor('doc-resolucion'),
            prefijo: valor('doc-prefijo').toUpperCase(),
            consecutivo: valor('doc-consecutivo'),
            vencimiento: campo('doc-vencimiento').value,
            formaPago: campo('doc-forma-pago').value,
            medioPago: campo('doc-medio-pago').value,
            tipoId: campo('cli-tipo-id').value,
            naturaleza: campo('cli-naturaleza').value,
            documento: valor('cli-documento'),
            nombre: valor('cli-nombre'),
            email: valor('cli-email'),
            telefono: valor('cli-telefono'),
            direccion: valor('cli-direccion'),
            ciudad: campo('cli-municipio').value,
            respFiscales: campo('cli-resp-fiscales').value,
            respTributarias: campo('cli-resp-tributarias').value,
            placa: valor('veh-placa').toUpperCase(),
            modelo: valor('veh-modelo'),
            color: valor('veh-color'),
            ingreso: campo('veh-ingreso').value,
            mecanico: valor('mecanico'),
            horas: Number(campo('horas').value) || 0,
            valorHora: Number(campo('valor-hora').value) || 0,
            utilidad: Number(campo('utilidad').value) || 0,
            utilidadTexto: campo('utilidad').value,
            repuestos: leerRepuestos().filter((rep) => !filaVacia(rep))
        };
    }

    function validar(datos) {
        if (!/^\d{3,13}$/.test(datos.nit)) return 'El NIT del emisor debe tener entre 3 y 13 dígitos, sin dígito de verificación.';
        if (!/^\d{1,14}$/.test(datos.resolucion)) return 'El número de resolución debe ser numérico (máximo 14 dígitos).';
        if (!/^[A-Z0-9]{0,4}$/.test(datos.prefijo)) return 'El prefijo admite máximo 4 caracteres alfanuméricos (ej. SETP).';
        if (!/^\d{1,9}$/.test(datos.consecutivo)) return 'El consecutivo es obligatorio y debe ser numérico (máximo 9 dígitos).';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.vencimiento) || datos.vencimiento < fechaMasDias(0)) {
            return 'La fecha de vencimiento es obligatoria y no puede ser anterior a hoy.';
        }
        if (!FORMAS_PAGO.includes(datos.formaPago) || !MEDIOS_PAGO.includes(datos.medioPago)) return 'Selecciona una forma y un medio de pago válidos.';
        if (!TIPOS_ID.includes(datos.tipoId)) return 'Selecciona un tipo de identificación válido.';
        if (!datos.documento || !datos.nombre || !datos.email || !datos.telefono || !datos.direccion || !datos.ciudad) {
            return 'Completa identificación, nombre, correo, teléfono, dirección y ciudad del cliente.';
        }
        if (!/^\d{3,13}$/.test(datos.documento)) return 'El número de identificación del cliente debe tener entre 3 y 13 dígitos (NIT sin dígito de verificación).';
        if (datos.nombre.length < 5) return 'El nombre o razón social del cliente debe tener al menos 5 caracteres.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) return 'El correo electrónico del cliente no tiene un formato válido.';
        if (!/^\d{7,15}$/.test(datos.telefono)) return 'El teléfono del cliente debe contener solo números (7 a 15 dígitos).';
        if (datos.direccion.length > 100) return 'La dirección del cliente admite máximo 100 caracteres.';
        if (!datos.placa || !datos.modelo || !datos.color || !datos.ingreso || !datos.mecanico) {
            return 'Completa placa, modelo, color, fecha de ingreso y mecánico responsable.';
        }
        const incompleto = datos.repuestos.some((rep) =>
            !rep.referencia || !rep.descripcion || !rep.marca || !(rep.precio > 0) || !Number.isInteger(rep.cantidad) || rep.cantidad < 1
        );
        if (!datos.repuestos.length || incompleto) {
            return 'Cada repuesto necesita referencia, descripción, marca, precio mayor que cero y cantidad entera mayor que cero.';
        }
        const nombreCorto = datos.repuestos.find((rep) => `${rep.descripcion} ${rep.marca}`.length < 4);
        if (nombreCorto) return `La descripción del repuesto ${nombreCorto.referencia} es demasiado corta (mínimo 4 caracteres con la marca).`;
        const descuentoInvalido = datos.repuestos.find((rep) => rep.descuento < 0 || rep.descuento > rep.precio);
        if (descuentoInvalido) {
            return `El descuento unitario del repuesto ${descuentoInvalido.referencia} no puede ser negativo ni superar su precio (${formatoPesos(descuentoInvalido.precio)}).`;
        }
        if (!(datos.horas > 0)) return 'Las horas empleadas deben ser mayores que cero.';
        if (!(datos.valorHora > 0)) return 'El valor por hora debe ser mayor que cero.';
        if (datos.utilidadTexto === '' || datos.utilidad < 0) return 'La utilidad estimada no puede estar vacía ni ser negativa.';
        return null;
    }

    function actualizarResumen() {
        leerRepuestos().forEach((rep) => {
            rep.fila.querySelector('.rep-subtotal').textContent = formatoPesos((rep.precio - rep.descuento) * rep.cantidad);
        });
        const datos = leerFormulario();
        let totales = { subtotalRepuestos: 0, subtotalServicio: 0, totalDescuentos: 0, baseGravable: 0, iva: 0, total: 0 };
        try {
            if (datos.repuestos.length || datos.horas) totales = totalizar(construirItems(datos));
        } catch (_) {
            totales = totalizar([]);
        }
        campo('res-repuestos').textContent = formatoPesos(totales.subtotalRepuestos);
        campo('res-mano').textContent = formatoPesos(totales.subtotalServicio);
        campo('res-descuentos').textContent = '- ' + formatoPesos(totales.totalDescuentos);
        campo('res-base').textContent = formatoPesos(totales.baseGravable);
        campo('res-iva').textContent = formatoPesos(totales.iva);
        campo('res-total').textContent = formatoPesos(totales.total);
        return totales;
    }

    function normalizarFactura(fila) {
        const items = parseJson(fila.items_json, []);
        return {
            id: Number(fila.id),
            orden_id: fila.orden_id ? Number(fila.orden_id) : null,
            nit: fila.nit || '',
            numero_resolucion: fila.numero_resolucion || '',
            prefijo: fila.prefijo || 'SETP',
            consecutivo: fila.consecutivo || '',
            fecha_vencimiento: String(fila.fecha_vencimiento || '').slice(0, 10),
            forma_pago: String(fila.forma_pago || '1'),
            medio_pago: String(fila.medio_pago || '10'),
            cliente_tipo_id: fila.cliente_tipo_id || 'CC',
            cliente_naturaleza: fila.cliente_naturaleza || 'NATURAL',
            cliente_documento: fila.cliente_documento || '',
            cliente_nombre: fila.cliente_nombre || '',
            cliente_email: fila.cliente_email || '',
            cliente_telefono: fila.cliente_telefono || '',
            cliente_direccion: fila.cliente_direccion || '',
            cliente_municipio: fila.cliente_municipio || '15001',
            resp_fiscales: fila.resp_fiscales || 'NOA',
            resp_tributarias: fila.resp_tributarias || 'NOA',
            vehiculo_placa: fila.vehiculo_placa || '',
            vehiculo_modelo: fila.vehiculo_modelo || '',
            vehiculo_color: fila.vehiculo_color || '',
            vehiculo_ingreso: fila.vehiculo_ingreso || '',
            mecanico: fila.mecanico || '',
            horas: Number(fila.horas) || 0,
            valor_hora: Number(fila.valor_hora) || 0,
            utilidad: Number(fila.utilidad) || 0,
            items: Array.isArray(items) ? items : [],
            subtotal: Number(fila.subtotal) || 0,
            descuentos: Number(fila.descuentos) || 0,
            iva: Number(fila.iva) || 0,
            total: Number(fila.total) || 0,
            cufe: fila.cufe || '',
            estado_dian: fila.estado_dian || 'PENDIENTE_ENVIO',
            payload_clarisa: parseJson(fila.payload_clarisa, null),
            respuesta_clarisa: parseJson(fila.respuesta_clarisa, null)
        };
    }

    function facturaAPayload(factura) {
        return {
            orden_id: factura.orden_id,
            nit: factura.nit,
            numero_resolucion: factura.numero_resolucion,
            prefijo: factura.prefijo,
            consecutivo: factura.consecutivo,
            fecha_vencimiento: factura.fecha_vencimiento,
            forma_pago: factura.forma_pago,
            medio_pago: factura.medio_pago,
            cliente_tipo_id: factura.cliente_tipo_id,
            cliente_naturaleza: factura.cliente_naturaleza,
            cliente_documento: factura.cliente_documento,
            cliente_nombre: factura.cliente_nombre,
            cliente_email: factura.cliente_email,
            cliente_telefono: factura.cliente_telefono,
            cliente_direccion: factura.cliente_direccion,
            cliente_municipio: factura.cliente_municipio,
            resp_fiscales: factura.resp_fiscales,
            resp_tributarias: factura.resp_tributarias,
            vehiculo_placa: factura.vehiculo_placa,
            vehiculo_modelo: factura.vehiculo_modelo,
            vehiculo_color: factura.vehiculo_color,
            vehiculo_ingreso: factura.vehiculo_ingreso,
            mecanico: factura.mecanico,
            horas: factura.horas,
            valor_hora: factura.valor_hora,
            utilidad: factura.utilidad,
            items: factura.items,
            subtotal: factura.subtotal,
            descuentos: factura.descuentos,
            iva: factura.iva,
            total: factura.total,
            cufe: factura.cufe || '',
            estado_dian: factura.estado_dian || 'PENDIENTE_ENVIO',
            payload_clarisa: factura.payload_clarisa,
            respuesta_clarisa: factura.respuesta_clarisa
        };
    }

    function armarFacturaDesdeFormulario(datos, items, totales, payload) {
        return {
            id: datos.id,
            orden_id: datos.ordenId,
            nit: datos.nit,
            numero_resolucion: datos.resolucion,
            prefijo: datos.prefijo || 'SETP',
            consecutivo: datos.consecutivo,
            fecha_vencimiento: datos.vencimiento,
            forma_pago: datos.formaPago,
            medio_pago: datos.medioPago,
            cliente_tipo_id: datos.tipoId,
            cliente_naturaleza: datos.naturaleza,
            cliente_documento: datos.documento,
            cliente_nombre: datos.nombre,
            cliente_email: datos.email,
            cliente_telefono: datos.telefono,
            cliente_direccion: datos.direccion,
            cliente_municipio: datos.ciudad,
            resp_fiscales: datos.respFiscales,
            resp_tributarias: datos.respTributarias,
            vehiculo_placa: datos.placa,
            vehiculo_modelo: datos.modelo,
            vehiculo_color: datos.color,
            vehiculo_ingreso: datos.ingreso,
            mecanico: datos.mecanico,
            horas: datos.horas,
            valor_hora: datos.valorHora,
            utilidad: datos.utilidad,
            items,
            subtotal: totales.baseGravable,
            descuentos: totales.totalDescuentos,
            iva: totales.iva,
            total: totales.total,
            cufe: '',
            estado_dian: 'PENDIENTE_ENVIO',
            payload_clarisa: payload,
            respuesta_clarisa: null
        };
    }

    async function listarRecurso(url) {
        const response = await fetch(url, { method: 'GET', headers: headersPanther(true) });
        if (response.status === 204) return [];
        if (!response.ok) {
            let data = null;
            try { data = await response.json(); } catch (_) { /* ignore */ }
            const error = new Error(mensajePantherHttp(response.status, data));
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        if (data.state && data.state !== 'OK' && data.state !== 'GET') return [];
        return filasPanther(data);
    }

    function pintarKpis() {
        const pendientes = facturas.filter((f) => f.estado_dian === 'PENDIENTE_ENVIO').length;
        const verificando = facturas.filter((f) => f.estado_dian === 'VERIFICANDO').length;
        const aprobadas = facturas.filter((f) => f.estado_dian === 'APROBADA').length;
        const monto = facturas.reduce((suma, f) => suma + (Number(f.total) || 0), 0);
        campo('kpi-total').textContent = String(facturas.length);
        campo('kpi-pendientes').textContent = String(pendientes);
        campo('kpi-dian').textContent = String(verificando + aprobadas);
        campo('kpi-dian-detalle').textContent = `${verificando} verificando · ${aprobadas} aprobadas`;
        campo('kpi-monto').textContent = formatoPesos(monto);
    }

    function renderizarTabla() {
        const texto = valor('buscar-factura').toLowerCase();
        const estado = campo('filtro-estado').value;
        const filtradas = facturas.filter((factura) => {
            if (estado && factura.estado_dian !== estado) return false;
            const orden = ordenes.find((item) => item.id === factura.orden_id);
            const bolsa = [
                factura.consecutivo,
                factura.prefijo,
                factura.cliente_nombre,
                factura.cliente_documento,
                factura.nit,
                factura.vehiculo_placa,
                orden ? orden.numero_orden : '',
                String(factura.id)
            ].join(' ').toLowerCase();
            return !texto || bolsa.includes(texto);
        });

        tablaBody.innerHTML = '';
        if (!filtradas.length) {
            tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados">No hay facturas para mostrar</td></tr>';
        } else {
            filtradas.forEach((factura) => {
                const orden = ordenes.find((item) => Number(item.id) === Number(factura.orden_id));
                const cufe = factura.cufe || '';
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td><strong>${escapar(factura.prefijo)}${escapar(factura.consecutivo)}</strong><br><small>#${escapar(factura.id)}</small></td>
                    <td>${escapar(factura.cliente_nombre)}<br><small>${escapar(factura.cliente_documento)}</small></td>
                    <td>${escapar(factura.vehiculo_placa)} · ${escapar(factura.vehiculo_modelo)}<br><small>${orden ? escapar(orden.numero_orden) : (factura.orden_id ? 'Orden #' + factura.orden_id : 'Sin orden')}</small></td>
                    <td>${escapar(formatoPesos(factura.total))}</td>
                    <td><span class="badge-estado badge-${escapar(factura.estado_dian)}">${escapar(etiquetaEstado(factura.estado_dian))}</span></td>
                    <td class="cufe-celda" title="${escapar(cufe)}">${cufe ? escapar(cufe.slice(0, 18)) + '…' : '—'}</td>
                    <td>
                        <div class="crud-acciones-tabla">
                            <button type="button" class="btn-accion btn-enviar-tabla" data-accion="ver" data-id="${factura.id}">Ver / Enviar</button>
                            <button type="button" class="btn-accion btn-editar" data-accion="editar" data-id="${factura.id}">Editar</button>
                            <button type="button" class="btn-accion btn-eliminar" data-accion="eliminar" data-id="${factura.id}">Eliminar</button>
                        </div>
                    </td>
                `;
                tablaBody.appendChild(fila);
            });
        }
        campo('contador-facturas').textContent = `${filtradas.length} registro(s)`;
        pintarKpis();
    }

    async function cargarDashboardFacturas() {
        campo('contador-facturas').textContent = 'Cargando...';
        try {
            const filas = await listarRecurso(BASE_URL_FACTURAS);
            facturas = filas.map(normalizarFactura);
            renderizarTabla();
        } catch (error) {
            facturas = [];
            renderizarTabla();
            mostrarNotificacion(error.message || 'No se pudieron cargar las facturas.', 'error');
        }
    }

    function normalizarOrden(fila) {
        const repuestos = parseJson(fila.repuestos_json, []);
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
            empleado_nombre: fila.empleado_nombre || '',
            horas_empleadas: Number(fila.horas_empleadas) || 0,
            valor_hora: Number(fila.valor_hora) || 35000,
            utilidad_estimada: Number(fila.utilidad_estimada) || 0,
            repuestos: Array.isArray(repuestos) ? repuestos : []
        };
    }

    async function cargarOrdenesDisponibles() {
        const select = campo('select-orden-cargar');
        try {
            const filas = await listarRecurso(BASE_URL_ORDENES);
            ordenes = filas.map(normalizarOrden);
            select.innerHTML = '<option value="">Selecciona una orden para rellenar el formulario...</option>' +
                ordenes.map((orden) =>
                    `<option value="${orden.id}">${escapar(orden.numero_orden)} · ${escapar(orden.cliente_nombre)} · ${escapar(orden.vehiculo_placa)}</option>`
                ).join('');
            renderizarTabla();
        } catch (error) {
            ordenes = [];
            select.innerHTML = '<option value="">No se pudieron cargar las órdenes</option>';
            mostrarNotificacion(error.message || 'No se pudieron cargar las órdenes de Panther.', 'error');
        }
    }

    function aplicarOrden(orden) {
        campo('orden-id').value = orden.id;
        campo('cli-documento').value = orden.cliente_documento;
        campo('cli-nombre').value = orden.cliente_nombre;
        campo('cli-telefono').value = orden.cliente_telefono;
        campo('cli-direccion').value = orden.cliente_direccion;
        campo('cli-email').value = orden.cliente_email || '';
        campo('cli-tipo-id').value = orden.cliente_documento.length > 9 ? 'NI' : 'CC';
        campo('cli-naturaleza').value = campo('cli-tipo-id').value === 'NI' ? 'JURIDICA' : 'NATURAL';
        campo('veh-placa').value = orden.vehiculo_placa;
        campo('veh-modelo').value = orden.vehiculo_modelo;
        campo('veh-color').value = orden.vehiculo_color;
        campo('veh-ingreso').value = aDatetimeLocal(orden.fecha_ingreso);
        campo('mecanico').value = orden.empleado_nombre;
        campo('horas').value = orden.horas_empleadas;
        campo('valor-hora').value = orden.valor_hora;
        campo('utilidad').value = orden.utilidad_estimada;
        limpiarRepuestos(orden.repuestos.map((rep) => ({
            referencia: rep.referencia,
            descripcion: rep.descripcion,
            marca: rep.marca,
            cantidad: rep.cantidad || 1,
            precio: rep.precio,
            descuento: rep.descuento || 0
        })));
        actualizarResumen();
    }

    function mostrarFormulario(titulo) {
        campo('form-titulo').textContent = titulo;
        panelFormulario.hidden = false;
        panelFormulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function ocultarFormulario() {
        panelFormulario.hidden = true;
        editandoId = null;
    }

    function nuevaFactura() {
        editandoId = null;
        form.reset();
        valoresPorDefecto();
        limpiarRepuestos();
        actualizarResumen();
        mostrarFormulario('Nueva factura');
    }

    function editarFactura(id) {
        const factura = facturas.find((item) => item.id === Number(id));
        if (!factura) return;
        if (factura.estado_dian === 'APROBADA') {
            mostrarNotificacion('Esta factura ya fue aprobada por la DIAN. Puedes verla, pero no reeditar el documento.', 'warning');
            abrirPopUpFactura(id);
            return;
        }
        editandoId = factura.id;
        campo('factura-id').value = factura.id;
        campo('orden-id').value = factura.orden_id || '';
        campo('select-orden-cargar').value = factura.orden_id || '';
        campo('doc-nit').value = factura.nit;
        campo('doc-resolucion').value = factura.numero_resolucion;
        campo('doc-prefijo').value = factura.prefijo;
        campo('doc-consecutivo').value = factura.consecutivo;
        campo('doc-vencimiento').value = factura.fecha_vencimiento;
        campo('doc-forma-pago').value = factura.forma_pago;
        campo('doc-medio-pago').value = factura.medio_pago;
        campo('cli-tipo-id').value = factura.cliente_tipo_id;
        campo('cli-naturaleza').value = factura.cliente_naturaleza;
        campo('cli-documento').value = factura.cliente_documento;
        campo('cli-nombre').value = factura.cliente_nombre;
        campo('cli-email').value = factura.cliente_email;
        campo('cli-telefono').value = factura.cliente_telefono;
        campo('cli-direccion').value = factura.cliente_direccion;
        campo('cli-municipio').value = factura.cliente_municipio;
        campo('cli-resp-fiscales').value = factura.resp_fiscales;
        campo('cli-resp-tributarias').value = factura.resp_tributarias;
        campo('veh-placa').value = factura.vehiculo_placa;
        campo('veh-modelo').value = factura.vehiculo_modelo;
        campo('veh-color').value = factura.vehiculo_color;
        campo('veh-ingreso').value = aDatetimeLocal(factura.vehiculo_ingreso);
        campo('mecanico').value = factura.mecanico;
        campo('horas').value = factura.horas;
        campo('valor-hora').value = factura.valor_hora;
        campo('utilidad').value = factura.utilidad;

        const repuestos = factura.items
            .filter((item) => item.codigo !== CODIGO_SERVICIO)
            .map((item) => {
                const partes = String(item.nombreItem || '').split(' ');
                return {
                    referencia: item.codigo,
                    descripcion: partes.slice(0, -1).join(' ') || item.nombreItem,
                    marca: partes.slice(-1).join(' ') || '',
                    cantidad: item.cantidad,
                    precio: item.precioBaseUnitario,
                    descuento: item.valorDescuento || 0
                };
            });
        limpiarRepuestos(repuestos);
        actualizarResumen();
        mostrarFormulario(`Editar factura ${factura.prefijo}${factura.consecutivo}`);
    }

    // Guardar factura
    function cerrarModalClave(resultado) {
        if (!modalClave) return;
        modalClave.classList.remove('active');
        document.body.style.overflow = modal.classList.contains('active') ? 'hidden' : '';
        const resolver = resolverClaveClarisa;
        resolverClaveClarisa = null;
        if (resolver) resolver(resultado);
    }

    function solicitarClaveClarisa() {
        return new Promise((resolve) => {
            if (!puedeFacturar()) {
                mostrarNotificacion('Tu rol no está autorizado para emitir facturas electrónicas.', 'error');
                resolve(null);
                return;
            }
            resolverClaveClarisa = resolve;
            campo('clarisa-clave').value = '';
            modalClave.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => campo('clarisa-clave').focus(), 50);
        });
    }

    function prepararCuerpoFactura() {
        const datos = leerFormulario();
        const error = validar(datos);
        if (error) {
            mostrarNotificacion(error, 'error');
            return null;
        }
        try {
            const items = construirItems(datos);
            const totales = totalizar(items);
            const payload = construirPayloadClarisa(datos, items, totales);
            const factura = armarFacturaDesdeFormulario(datos, items, totales, payload);
            return { datos, cuerpo: facturaAPayload(factura) };
        } catch (err) {
            mostrarNotificacion(err.message, 'error');
            return null;
        }
    }

    async function persistirFacturaEnPanther(cuerpo, { emitir = false, clarisaClave = '' } = {}) {
        const payload = { ...cuerpo };
        if (emitir) {
            payload.emitir_clarisa = true;
            payload.clarisa_clave = clarisaClave;
        }
        const url = editandoId ? `${BASE_URL_FACTURAS}/${editandoId}` : BASE_URL_FACTURAS;
        const response = await fetch(url, {
            method: editandoId ? 'PUT' : 'POST',
            headers: headersPanther(true),
            body: JSON.stringify(payload)
        });
        let data = null;
        try { data = await response.json(); } catch (_) { /* ignore */ }
        if (!response.ok) {
            const error = new Error(mensajePantherHttp(response.status, data));
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return resultadoPanther(data);
    }

    async function guardarFacturaEnPanther(evento) {
        evento.preventDefault();
        if (guardando || enviandoClarisa) return;

        const preparado = prepararCuerpoFactura();
        if (!preparado) return;

        guardando = true;
        btnGuardar.disabled = true;
        if (btnGenerar) btnGenerar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        try {
            const resultado = await persistirFacturaEnPanther(preparado.cuerpo, { emitir: false });
            const id = editandoId || Number(resultado?.id);
            localStorage.setItem(CLAVE_CONSECUTIVO, preparado.datos.consecutivo);
            mostrarNotificacion(
                editandoId
                    ? 'Factura actualizada en Panther. Aún no se ha enviado a Clarisa.'
                    : `Factura #${id || ''} guardada en Panther con estado PENDIENTE_ENVIO.`,
                'success'
            );
            ocultarFormulario();
            await cargarDashboardFacturas();
            if (id) abrirPopUpFactura(id);
        } catch (err) {
            mostrarNotificacion(err.message || 'Error de red al guardar en Panther.', 'error');
        } finally {
            guardando = false;
            btnGuardar.disabled = false;
            if (btnGenerar) btnGenerar.disabled = false;
            btnGuardar.textContent = 'Guardar en Panther';
        }
    }

    function notificarResultadoClarisa(clarisa, prefijo, consecutivo) {
        const doc = `${prefijo || ''}${consecutivo || ''}`;
        if (!clarisa) {
            mostrarNotificacion('Panther guardó la factura, pero no hubo respuesta de Clarisa.', 'warning');
            return;
        }
        if (clarisa.ok && clarisa.estado_dian === 'APROBADA') {
            mostrarNotificacion(`Factura ${doc} aprobada en Clarisa Sandbox y actualizada en Panther.`, 'success');
        } else if (clarisa.ok && clarisa.estado_dian === 'VERIFICANDO') {
            mostrarNotificacion(`Clarisa recibió la factura ${doc}. Consulta el estado DIAN en unos segundos.`, 'warning');
        } else if (clarisa.ok) {
            mostrarNotificacion(mensajeClarisaBackend(clarisa), 'success');
        } else if (clarisa.paso === 'login') {
            mostrarNotificacion(mensajeClarisaBackend(clarisa) || 'Clave de la API Clarisa incorrecta.', 'error');
        } else {
            mostrarNotificacion(mensajeClarisaBackend(clarisa), 'error');
        }
    }

    async function generarFacturaCompleta() {
        if (guardando || enviandoClarisa) return;
        if (!puedeFacturar()) {
            mostrarNotificacion('Solo Administrador o Cajero/Recepcionista pueden generar facturas.', 'error');
            return;
        }

        const preparado = prepararCuerpoFactura();
        if (!preparado) return;

        const clave = await solicitarClaveClarisa();
        if (clave == null) return;
        if (!clave) {
            mostrarNotificacion('Debes ingresar la clave de la API Clarisa.', 'error');
            return;
        }

        enviandoClarisa = true;
        guardando = true;
        btnGuardar.disabled = true;
        if (btnGenerar) {
            btnGenerar.disabled = true;
            btnGenerar.textContent = 'Generando factura...';
        }

        try {
            const resultado = await persistirFacturaEnPanther(preparado.cuerpo, {
                emitir: true,
                clarisaClave: clave
            });
            const id = editandoId || Number(resultado?.id);
            localStorage.setItem(CLAVE_CONSECUTIVO, preparado.datos.consecutivo);
            const clarisa = resultado?.clarisa;
            if (resultado?.persistencia?.ok && !clarisa?.ok) {
                mostrarNotificacion(
                    `Persistencia OK. ${mensajeClarisaBackend(clarisa)}`,
                    'warning'
                );
            } else {
                notificarResultadoClarisa(clarisa, preparado.datos.prefijo, preparado.datos.consecutivo);
            }
            ocultarFormulario();
            await cargarDashboardFacturas();
            if (id) abrirPopUpFactura(id);
        } catch (err) {
            mostrarNotificacion(err.message || 'Error al generar la factura.', 'error');
        } finally {
            enviandoClarisa = false;
            guardando = false;
            btnGuardar.disabled = false;
            if (btnGenerar) {
                btnGenerar.disabled = false;
                btnGenerar.textContent = 'Generar factura';
            }
        }
    }

    async function eliminarFacturaPanther(id) {
        const factura = facturas.find((item) => item.id === Number(id));
        if (!factura) return;
        if (!confirm(`¿Eliminar la factura ${factura.prefijo}${factura.consecutivo}? Esta acción borra el registro en MariaDB.`)) return;
        const response = await fetch(`${BASE_URL_FACTURAS}/${id}`, {
            method: 'DELETE',
            headers: headersPanther(false)
        });
        if (!response.ok) {
            let data = null;
            try { data = await response.json(); } catch (_) { /* ignore */ }
            mostrarNotificacion(mensajePantherHttp(response.status, data), 'error');
            return;
        }
        if (facturaAbierta && facturaAbierta.id === Number(id)) cerrarPopUp();
        mostrarNotificacion('Factura eliminada de Panther.', 'success');
        await cargarDashboardFacturas();
    }

    function pintarPopUp(factura) {
        facturaAbierta = factura;
        campo('detalle-titulo').textContent = `Factura ${factura.prefijo}${factura.consecutivo}`;
        const orden = ordenes.find((item) => Number(item.id) === Number(factura.orden_id));
        campo('detalle-resumen').innerHTML = `
            <p><span>Estado</span><strong class="badge-estado badge-${escapar(factura.estado_dian)}">${escapar(etiquetaEstado(factura.estado_dian))}</strong></p>
            <p><span>Consecutivo</span><strong>${escapar(factura.prefijo)}${escapar(factura.consecutivo)}</strong></p>
            <p><span>Cliente</span><strong>${escapar(factura.cliente_nombre)} · ${escapar(factura.cliente_documento)}</strong></p>
            <p><span>Vehículo / orden</span><strong>${escapar(factura.vehiculo_placa)} ${escapar(factura.vehiculo_modelo)} · ${orden ? escapar(orden.numero_orden) : 'Sin orden'}</strong></p>
            <p><span>Subtotal</span><strong>${escapar(formatoPesos(factura.subtotal))}</strong></p>
            <p><span>IVA 19%</span><strong>${escapar(formatoPesos(factura.iva))}</strong></p>
            <p><span>Total</span><strong>${escapar(formatoPesos(factura.total))}</strong></p>
            <p><span>CUFE</span><strong class="detalle-cufe">${factura.cufe ? escapar(factura.cufe) : 'Aún no generado'}</strong></p>
        `;
        const items = factura.items || [];
        campo('detalle-items').innerHTML = items.length
            ? `<ul class="detalle-lista">${items.map((item) =>
                `<li><strong>${escapar(item.codigo)}</strong> ${escapar(item.nombreItem)} · ${escapar(item.cantidad)} × ${escapar(formatoPesos(item.precioBaseUnitario))}</li>`
            ).join('')}</ul>`
            : '<p>Sin ítems almacenados.</p>';

        const respuesta = factura.respuesta_clarisa;
        campo('detalle-respuesta-json').textContent = respuesta
            ? JSON.stringify(respuesta, null, 2)
            : 'Aún no hay respuesta de Clarisa.';

        const puedeEnviar = ESTADOS_REENVIABLES.includes(factura.estado_dian);
        const puedeConsultar = ESTADOS_CONSULTA.includes(factura.estado_dian);
        btnEnviar.hidden = !puedeEnviar;
        btnConsultar.hidden = !puedeConsultar;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function abrirPopUpFactura(id) {
        const factura = facturas.find((item) => item.id === Number(id));
        if (!factura) {
            mostrarNotificacion('No se encontró la factura en el listado de Panther.', 'error');
            return;
        }
        pintarPopUp(factura);
    }

    function cerrarPopUp() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        facturaAbierta = null;
    }

    function esperar(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function respetarEsperaClarisa(boton, etiqueta) {
        const transcurrido = Date.now() - ultimoEnvioClarisa;
        const falta = SEGUNDOS_ENTRE_ENVIOS * 1000 - transcurrido;
        if (!ultimoEnvioClarisa || falta <= 0) return;
        let restante = Math.ceil(falta / 1000);
        boton.disabled = true;
        while (restante > 0) {
            boton.textContent = `Espera ${restante} s...`;
            await esperar(1000);
            restante -= 1;
        }
        boton.textContent = etiqueta;
        boton.disabled = false;
    }

    async function enviarAlFacturadorClarisa(id) {
        const factura = facturas.find((item) => item.id === Number(id)) || facturaAbierta;
        if (!factura || enviandoClarisa || btnEnviar.disabled) return;
        if (!puedeFacturar()) {
            mostrarNotificacion('Solo Administrador o Cajero/Recepcionista pueden emitir facturas.', 'error');
            return;
        }
        if (!factura.payload_clarisa) {
            mostrarNotificacion('Esta factura no tiene payload de Clarisa. Edítala y vuelve a guardarla en Panther.', 'error');
            return;
        }

        const clave = await solicitarClaveClarisa();
        if (clave == null) return;
        if (!clave) {
            mostrarNotificacion('Debes ingresar la clave de la API Clarisa.', 'error');
            return;
        }

        enviandoClarisa = true;
        await respetarEsperaClarisa(btnEnviar, 'Generar factura');
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Generando factura...';

        try {
            const response = await fetch(`${BASE_URL_FACTURAS}/emitir/${factura.id}`, {
                method: 'POST',
                headers: headersPanther(true),
                body: JSON.stringify({ clarisa_clave: clave })
            });
            let data = null;
            try { data = await response.json(); } catch (_) { /* ignore */ }
            ultimoEnvioClarisa = Date.now();

            if (!response.ok) {
                mostrarNotificacion(mensajePantherHttp(response.status, data), 'error');
                return;
            }

            const resultado = resultadoPanther(data);
            await cargarDashboardFacturas();
            const fresca = facturas.find((item) => item.id === factura.id);
            if (fresca) pintarPopUp(fresca);
            notificarResultadoClarisa(resultado?.clarisa, factura.prefijo, factura.consecutivo);
        } catch (err) {
            const red = err instanceof TypeError;
            mostrarNotificacion(
                red
                    ? 'No fue posible conectar con Panther/Clarisa. Verifica la red y el backend.'
                    : (err.message || 'Error al emitir en Clarisa.'),
                'error'
            );
        } finally {
            enviandoClarisa = false;
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Generar factura';
            if (facturaAbierta && ESTADOS_REENVIABLES.includes(facturaAbierta.estado_dian)) {
                await respetarEsperaClarisa(btnEnviar, 'Generar factura');
            }
        }
    }

    async function consultarEstadoDian() {
        if (!facturaAbierta || btnConsultar.disabled) return;
        if (!puedeFacturar()) {
            mostrarNotificacion('Solo Administrador o Cajero/Recepcionista pueden consultar DIAN.', 'error');
            return;
        }

        const clave = await solicitarClaveClarisa();
        if (clave == null) return;
        if (!clave) {
            mostrarNotificacion('Debes ingresar la clave de la API Clarisa.', 'error');
            return;
        }

        const factura = facturaAbierta;
        const numeroDocumento = `${factura.prefijo}${factura.consecutivo}`;
        btnConsultar.disabled = true;
        btnConsultar.textContent = 'Consultando...';
        try {
            const response = await fetch(`${BASE_URL_FACTURAS}/consultar/${factura.id}`, {
                method: 'POST',
                headers: headersPanther(true),
                body: JSON.stringify({ clarisa_clave: clave })
            });
            let data = null;
            try { data = await response.json(); } catch (_) { /* ignore */ }

            if (!response.ok) {
                mostrarNotificacion(mensajePantherHttp(response.status, data), 'error');
                return;
            }

            const resultado = resultadoPanther(data);
            await cargarDashboardFacturas();
            const fresca = facturas.find((item) => item.id === factura.id);
            if (fresca) pintarPopUp(fresca);

            const clarisa = resultado?.clarisa;
            if (clarisa?.ok && clarisa.estado_dian === 'APROBADA') {
                mostrarNotificacion(`Factura ${numeroDocumento} aprobada por la DIAN.`, 'success');
            } else if (clarisa?.ok && clarisa.estado_dian === 'VERIFICANDO') {
                mostrarNotificacion(`La factura ${numeroDocumento} sigue en validación con la DIAN.`, 'warning');
            } else {
                mostrarNotificacion(mensajeClarisaBackend(clarisa), clarisa?.ok ? 'success' : 'error');
            }
        } catch (err) {
            const red = err instanceof TypeError;
            mostrarNotificacion(
                red
                    ? 'No fue posible conectar con Panther/Clarisa. Verifica la red y el backend.'
                    : (err.message || 'No se pudo consultar Clarisa.'),
                'error'
            );
        } finally {
            let restante = SEGUNDOS_ENTRE_CONSULTAS;
            const intervalo = setInterval(() => {
                restante -= 1;
                if (restante > 0) {
                    btnConsultar.textContent = `Espera ${restante} s...`;
                    return;
                }
                clearInterval(intervalo);
                btnConsultar.disabled = false;
                btnConsultar.textContent = 'Consultar estado DIAN';
            }, 1000);
        }
    }

    campo('doc-forma-pago').addEventListener('change', (evento) => {
        campo('doc-vencimiento').value = fechaMasDias(evento.target.value === '2' ? 30 : 0);
    });
    campo('cli-tipo-id').addEventListener('change', (evento) => {
        campo('cli-naturaleza').value = evento.target.value === 'NI' ? 'JURIDICA' : 'NATURAL';
    });
    const btnCerrar = campo('btn-cerrar-sesion');
    if (btnCerrar && !btnCerrar.dataset.sesionLista) {
        btnCerrar.dataset.sesionLista = '1';
        btnCerrar.addEventListener('click', () => {
            if (typeof SesionTaller !== 'undefined' && SesionTaller.cerrar) {
                SesionTaller.cerrar();
            } else if (typeof Sesion !== 'undefined' && Sesion.cerrar) {
                Sesion.cerrar();
            }
            window.location.replace(PAGINA_LOGIN);
        });
    }
    // Eventos del formulario
    campo('btn-nueva-factura').addEventListener('click', nuevaFactura);
    campo('btn-cerrar-formulario').addEventListener('click', ocultarFormulario);
    campo('btn-limpiar').addEventListener('click', () => {
        const id = editandoId;
        if (id) editarFactura(id);
        else nuevaFactura();
    });
    campo('btn-agregar-repuesto').addEventListener('click', () => {
        agregarRepuesto().querySelector('.rep-referencia').focus();
        actualizarResumen();
    });
    campo('select-orden-cargar').addEventListener('change', (evento) => {
        const orden = ordenes.find((item) => item.id === Number(evento.target.value));
        if (orden) aplicarOrden(orden);
    });
    campo('buscar-factura').addEventListener('input', renderizarTabla);
    campo('filtro-estado').addEventListener('change', renderizarTabla);
    campo('btn-cerrar-detalle').addEventListener('click', cerrarPopUp);
    if (btnGenerar) btnGenerar.addEventListener('click', generarFacturaCompleta);
    btnEnviar.addEventListener('click', () => {
        if (facturaAbierta) enviarAlFacturadorClarisa(facturaAbierta.id);
    });
    btnConsultar.addEventListener('click', consultarEstadoDian);
    form.addEventListener('input', actualizarResumen);
    form.addEventListener('change', actualizarResumen);
    form.addEventListener('submit', guardarFacturaEnPanther);

    formClave.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const clave = valor('clarisa-clave');
        if (!clave) {
            mostrarNotificacion('Ingresa la clave de la API Clarisa.', 'error');
            campo('clarisa-clave').focus();
            return;
        }
        cerrarModalClave(clave);
    });
    campo('btn-cancelar-clarisa-clave').addEventListener('click', () => cerrarModalClave(null));
    campo('btn-cerrar-clarisa-clave').addEventListener('click', () => cerrarModalClave(null));
    modalClave.addEventListener('click', (evento) => {
        if (evento.target === modalClave) cerrarModalClave(null);
    });

    repuestosBody.addEventListener('click', (evento) => {
        if (!evento.target.classList.contains('quitar-repuesto')) return;
        if (repuestosBody.querySelectorAll('.repuesto-fila').length === 1) {
            mostrarNotificacion('Debe existir al menos una fila de repuestos (puede quedar vacía si no se usaron).', 'error');
            return;
        }
        evento.target.closest('.repuesto-fila').remove();
        actualizarResumen();
    });

    tablaBody.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion]');
        if (!boton) return;
        const id = Number(boton.dataset.id);
        if (boton.dataset.accion === 'ver') abrirPopUpFactura(id);
        if (boton.dataset.accion === 'editar') editarFactura(id);
        if (boton.dataset.accion === 'eliminar') eliminarFacturaPanther(id);
    });

    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) cerrarPopUp();
    });

    (async function iniciar() {
        limpiarRepuestos();
        valoresPorDefecto();
        actualizarResumen();
        await Promise.all([cargarOrdenesDisponibles(), cargarDashboardFacturas()]);
        const params = new URLSearchParams(window.location.search);
        const ordenId = Number(params.get('ordenId'));
        if (ordenId) {
            const orden = ordenes.find((item) => item.id === ordenId);
            nuevaFactura();
            if (orden) {
                campo('select-orden-cargar').value = String(orden.id);
                aplicarOrden(orden);
                mostrarNotificacion(`Datos de ${orden.numero_orden} precargados. Completa el correo si falta y guarda en Panther.`, 'success');
            } else {
                mostrarNotificacion(`No se encontró la orden ${ordenId} en Panther.`, 'warning');
            }
        }
    })();
});
