// Emision de factura electronica nacional contra el API de pruebas de Clarisa.
// Estructura segun https://ayuda.clarisa.co/guia-tecnica-para-consumo-api-factura-electronica/
const URL_FACTURA = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional';
const URL_VALIDACION = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/validacion';
const TIPO_DOCUMENTO_FACTURA = '01';
const SEGUNDOS_ENTRE_CONSULTAS = 5;
const TARIFA_IVA = 19;
const FACTOR_IVA = 0.19;
const UNIDAD = '94';
const CODIGO_SERVICIO = 'SRV-TALLER';
const SEGUNDOS_ENTRE_ENVIOS = 3;
const CONSECUTIVO_INICIAL = 990000001;
const CLAVE_CONSECUTIVO = 'autotech-ultimo-consecutivo';
const FORMAS_PAGO = ['1', '2'];
const MEDIOS_PAGO = ['10', '47', '48', '49'];
const TIPOS_ID = ['CC', 'NI', 'CE', 'PA'];

if (!sessionStorage.getItem('authToken')) {
    window.location.replace('login.html');
}

const redondear = (valor) => Math.round(((Number(valor) || 0) + Number.EPSILON) * 100) / 100;
const sumar = (lista, campo) => redondear(lista.reduce((suma, item) => suma + campo(item), 0));

const formatoPesos = (valor) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2
}).format(Number(valor) || 0);

const dosDigitos = (n) => String(n).padStart(2, '0');

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

function siguienteConsecutivo() {
    const ultimo = Number(localStorage.getItem(CLAVE_CONSECUTIVO));
    return String(ultimo > 0 ? ultimo + 1 : CONSECUTIVO_INICIAL);
}

// ---------- Items e impuestos ----------
// Clarisa calcula base y valor del impuesto; solo espera tipo, clase y tarifa.
function impuestoIva() {
    return { tipo: 'IVA', claseImpuesto: 'PO', tarifaTributo: TARIFA_IVA };
}

// Clarisa rechaza un item con dos impuestos del mismo tipo.
function agregarImpuesto(item, impuesto) {
    if (item.impuestos.some((existente) => existente.tipo === impuesto.tipo)) {
        throw new Error(`El ítem ${item.codigo} ya tiene un impuesto de tipo ${impuesto.tipo}.`);
    }
    item.impuestos.push(impuesto);
    return item;
}

// valorDescuento es por unidad, segun la guia de Clarisa.
function crearItem({ codigo, nombreItem, observacion, cantidad, precioBaseUnitario, valorDescuento = 0 }) {
    const base = redondear((precioBaseUnitario - valorDescuento) * cantidad);
    const item = {
        codigo,
        nombreItem,
        precioBaseUnitario: redondear(precioBaseUnitario),
        cantidad,
        unidad: UNIDAD,
        valorDescuento: redondear(valorDescuento),
        observacion: observacion.slice(0, 1000),
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

document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const form = document.getElementById('form-factura');
    const repuestosBody = document.getElementById('repuestos-body');
    const btnEmitir = document.getElementById('btn-emitir');
    const notificacion = document.getElementById('notificacion-factura');
    const tarjetaRespuesta = document.getElementById('respuesta-api');
    const estadoRespuesta = document.getElementById('respuesta-estado');
    const jsonRespuesta = document.getElementById('respuesta-json');
    const campo = (id) => document.getElementById(id);
    const valor = (id) => campo(id).value.trim();

    campo('usuario-activo').textContent = sessionStorage.getItem('userLogged') || 'Usuario';

    function valoresPorDefecto() {
        campo('doc-consecutivo').value = siguienteConsecutivo();
        campo('doc-vencimiento').value = fechaMasDias(0);
        campo('veh-ingreso').value = fechaHoraLocalActual();
    }
    valoresPorDefecto();

    campo('doc-forma-pago').addEventListener('change', (evento) => {
        campo('doc-vencimiento').value = fechaMasDias(evento.target.value === '2' ? 30 : 0);
    });

    campo('cli-tipo-id').addEventListener('change', (evento) => {
        campo('cli-naturaleza').value = evento.target.value === 'NI' ? 'JURIDICA' : 'NATURAL';
    });

    campo('btn-cerrar-sesion').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.replace('login.html');
    });

    let temporizadorNotificacion;
    function mostrarNotificacion(mensaje, tipo) {
        clearTimeout(temporizadorNotificacion);
        notificacion.className = 'crud-notificacion ' + tipo;
        notificacion.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
        notificacion.textContent = mensaje;
        notificacion.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (tipo === 'success') {
            temporizadorNotificacion = setTimeout(() => {
                notificacion.className = 'crud-notificacion';
                notificacion.textContent = '';
            }, 8000);
        }
    }

    // ---------- Repuestos ----------
    function agregarRepuesto() {
        const fila = document.createElement('tr');
        fila.className = 'repuesto-fila';
        fila.innerHTML = `
            <td data-label="Referencia"><input type="text" class="rep-referencia" maxlength="15" placeholder="FR-220" aria-label="Referencia"></td>
            <td data-label="Descripción"><input type="text" class="rep-descripcion" placeholder="Pastillas de freno" aria-label="Descripción"></td>
            <td data-label="Marca"><input type="text" class="rep-marca" placeholder="Bosch" aria-label="Marca"></td>
            <td data-label="Cantidad"><input type="number" class="rep-cantidad" min="1" step="1" value="1" aria-label="Cantidad"></td>
            <td data-label="Precio unitario"><input type="number" class="rep-precio" min="1" step="1" placeholder="85000" aria-label="Precio unitario"></td>
            <td data-label="Desc. unitario"><input type="number" class="rep-descuento" min="0" step="1" value="0" aria-label="Descuento por unidad"></td>
            <td data-label="Base ítem" class="rep-subtotal">${formatoPesos(0)}</td>
            <td class="rep-acciones"><button type="button" class="btn-accion btn-eliminar quitar-repuesto">Quitar</button></td>
        `;
        repuestosBody.appendChild(fila);
        return fila;
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

    // ---------- Formulario ----------
    function leerFormulario() {
        return {
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
        if (!/^\d{3,13}$/.test(datos.nit)) {
            return 'El NIT del emisor debe tener entre 3 y 13 dígitos, sin dígito de verificación.';
        }
        if (!/^\d{1,14}$/.test(datos.resolucion)) {
            return 'El número de resolución debe ser numérico (máximo 14 dígitos).';
        }
        if (!/^[A-Z0-9]{0,4}$/.test(datos.prefijo)) {
            return 'El prefijo admite máximo 4 caracteres alfanuméricos (ej. SETP).';
        }
        if (!/^\d{1,9}$/.test(datos.consecutivo)) {
            return 'El consecutivo es obligatorio y debe ser numérico (máximo 9 dígitos).';
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.vencimiento) || datos.vencimiento < fechaMasDias(0)) {
            return 'La fecha de vencimiento es obligatoria y no puede ser anterior a hoy.';
        }
        if (!FORMAS_PAGO.includes(datos.formaPago) || !MEDIOS_PAGO.includes(datos.medioPago)) {
            return 'Selecciona una forma y un medio de pago válidos.';
        }
        if (!TIPOS_ID.includes(datos.tipoId)) {
            return 'Selecciona un tipo de identificación válido.';
        }
        if (!datos.documento || !datos.nombre || !datos.email || !datos.telefono || !datos.direccion || !datos.ciudad) {
            return 'Completa identificación, nombre, correo, teléfono, dirección y ciudad del cliente.';
        }
        if (!/^\d{3,13}$/.test(datos.documento)) {
            return 'El número de identificación del cliente debe tener entre 3 y 13 dígitos (NIT sin dígito de verificación).';
        }
        if (datos.nombre.length < 5) {
            return 'El nombre o razón social del cliente debe tener al menos 5 caracteres.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
            return 'El correo electrónico del cliente no tiene un formato válido.';
        }
        if (!/^\d{7,15}$/.test(datos.telefono)) {
            return 'El teléfono del cliente debe contener solo números (7 a 15 dígitos).';
        }
        if (datos.direccion.length > 100) {
            return 'La dirección del cliente admite máximo 100 caracteres.';
        }
        if (!datos.placa || !datos.modelo || !datos.color || !datos.ingreso || !datos.mecanico) {
            return 'Completa placa, modelo, color, fecha de ingreso y mecánico responsable.';
        }
        const repuestoIncompleto = datos.repuestos.some((rep) =>
            !rep.referencia || !rep.descripcion || !rep.marca || !(rep.precio > 0) || !Number.isInteger(rep.cantidad) || rep.cantidad < 1
        );
        if (repuestoIncompleto) {
            return 'Cada repuesto necesita referencia, descripción, marca, precio mayor que cero y cantidad entera mayor que cero.';
        }
        const nombreCorto = datos.repuestos.find((rep) => `${rep.descripcion} ${rep.marca}`.length < 4);
        if (nombreCorto) {
            return `La descripción del repuesto ${nombreCorto.referencia} es demasiado corta (mínimo 4 caracteres con la marca).`;
        }
        const descuentoInvalido = datos.repuestos.find((rep) => rep.descuento < 0 || rep.descuento > rep.precio);
        if (descuentoInvalido) {
            return `El descuento unitario del repuesto ${descuentoInvalido.referencia} no puede ser negativo ni superar su precio (${formatoPesos(descuentoInvalido.precio)}).`;
        }
        if (!(datos.horas > 0)) {
            return 'Las horas empleadas deben ser mayores que cero.';
        }
        if (!(datos.valorHora > 0)) {
            return 'El valor por hora debe ser mayor que cero.';
        }
        if (datos.utilidadTexto === '' || datos.utilidad < 0) {
            return 'La utilidad estimada no puede estar vacía ni ser negativa.';
        }
        return null;
    }

    function construirPayload(datos, items, totales) {
        const payload = {
            nit: datos.nit,
            numeroResolucion: datos.resolucion,
            consecutivoDcto: datos.consecutivo,
            fechaVencimiento: datos.vencimiento,
            formaPago: datos.formaPago,
            mediosPago: [datos.medioPago],
            total: totales.total,
            observacion: (`Orden de servicio taller - Placa: ${datos.placa} | Modelo: ${datos.modelo} | Color: ${datos.color}` +
                ` | Fecha de ingreso: ${datos.ingreso.replace('T', ' ')} | Mecánico asignado: ${datos.mecanico}`).slice(0, 1000),
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

    // ---------- Calculos en tiempo real ----------
    function actualizarResumen() {
        leerRepuestos().forEach((rep) => {
            rep.fila.querySelector('.rep-subtotal').textContent = formatoPesos((rep.precio - rep.descuento) * rep.cantidad);
        });

        const totales = totalizar(construirItems(leerFormulario()));
        campo('res-repuestos').textContent = formatoPesos(totales.subtotalRepuestos);
        campo('res-mano').textContent = formatoPesos(totales.subtotalServicio);
        campo('res-descuentos').textContent = '- ' + formatoPesos(totales.totalDescuentos);
        campo('res-base').textContent = formatoPesos(totales.baseGravable);
        campo('res-iva').textContent = formatoPesos(totales.iva);
        campo('res-total').textContent = formatoPesos(totales.total);
    }

    campo('btn-agregar-repuesto').addEventListener('click', () => {
        agregarRepuesto().querySelector('.rep-referencia').focus();
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

    form.addEventListener('input', actualizarResumen);
    form.addEventListener('change', actualizarResumen);

    form.addEventListener('reset', () => {
        setTimeout(() => {
            repuestosBody.innerHTML = '';
            agregarRepuesto();
            valoresPorDefecto();
            tarjetaRespuesta.hidden = true;
            ocultarConsulta();
            actualizarResumen();
        });
    });

    // ---------- Envio a Clarisa ----------
    // estado: 'exito' | 'pendiente' | 'fallo'
    function mostrarRespuesta(status, contenido, estado) {
        tarjetaRespuesta.hidden = false;
        ['exito', 'pendiente', 'fallo'].forEach((clase) => tarjetaRespuesta.classList.toggle(clase, clase === estado));
        estadoRespuesta.textContent = status ? `HTTP ${status}` : 'Sin conexión';
        jsonRespuesta.textContent = typeof contenido === 'string' ? contenido : JSON.stringify(contenido, null, 2);
    }

    async function leerRespuesta(response) {
        const texto = await response.text();
        try {
            return texto ? JSON.parse(texto) : {};
        } catch {
            return texto;
        }
    }

    // La factura quedo creada en Clarisa y espera la respuesta de la DIAN.
    const estaVerificando = (data) => data?.data?.estadoClarisa === 'VERIFICANDO';

    // Clarisa envia los errores en data.errores (arreglo u objeto) o en data.data.errores.
    function mensajeDeError(data, status) {
        const contenedor = data?.data?.errores ?? data?.errores;
        const lista = Array.isArray(contenedor) ? contenedor : contenedor?.errores;
        const mensajes = (Array.isArray(lista) ? lista : [])
            .map((error) => (typeof error === 'string' ? error : error?.errorMessage || error?.mensaje || error?.message))
            .filter(Boolean);
        if (mensajes.length) return mensajes.join(' · ');
        if (data?.textResponse) return data.textResponse;
        if (status === 401 || status === 403) return 'La sesión expiró o no tiene autorización. Cierra sesión e ingresa de nuevo.';
        if (status === 400 || status === 422) return `Clarisa encontró errores de validación (HTTP ${status}). Revisa la respuesta.`;
        return `Clarisa rechazó la factura (HTTP ${status}).`;
    }

    function mensajeDeExito(data) {
        const qr = data?.data?.informacionFacQR;
        const estado = data?.data?.estadoDIAN ? ` Estado DIAN: ${data.data.estadoDIAN}.` : '';
        return qr?.numFac
            ? `Factura ${qr.numFac} emitida por ${formatoPesos(qr.valTolFac)}.${estado}`
            : (data?.textResponse || 'Factura emitida correctamente.').trim();
    }

    let enEspera = false;

    function bloquearEnvio(texto) {
        btnEmitir.disabled = true;
        btnEmitir.setAttribute('aria-busy', 'true');
        btnEmitir.textContent = texto;
    }

    function iniciarEspera(segundos) {
        enEspera = true;
        let restante = segundos;
        bloquearEnvio(`Espera ${restante} s...`);
        const intervalo = setInterval(() => {
            restante -= 1;
            if (restante > 0) {
                btnEmitir.textContent = `Espera ${restante} s...`;
                return;
            }
            clearInterval(intervalo);
            enEspera = false;
            btnEmitir.disabled = false;
            btnEmitir.removeAttribute('aria-busy');
            btnEmitir.textContent = 'Emitir factura';
        }, 1000);
    }

    // ---------- Consulta de estado ante la DIAN ----------
    const panelConsulta = campo('consulta-estado');
    const btnConsultar = campo('btn-consultar-estado');
    let documentoEnValidacion = null;

    function prepararConsulta(nit, numeroDocumento) {
        documentoEnValidacion = { nit, numeroDocumento };
        campo('consulta-documento').textContent = numeroDocumento;
        panelConsulta.hidden = false;
    }

    function ocultarConsulta() {
        documentoEnValidacion = null;
        panelConsulta.hidden = true;
    }

    function esperaConsulta(segundos) {
        let restante = segundos;
        btnConsultar.disabled = true;
        btnConsultar.textContent = `Espera ${restante} s...`;
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

    btnConsultar.addEventListener('click', async () => {
        if (!documentoEnValidacion || btnConsultar.disabled) return;
        const { nit, numeroDocumento } = documentoEnValidacion;
        const parametros = new URLSearchParams({ nit, tipoDocumento: TIPO_DOCUMENTO_FACTURA, numeroDocumento });
        btnConsultar.disabled = true;
        btnConsultar.textContent = 'Consultando...';

        try {
            const response = await fetch(`${URL_VALIDACION}?${parametros}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });
            const data = await leerRespuesta(response);
            const info = data?.data;
            const aprobada = data?.success === true && info?.estadoDIAN === 'APROBADA';
            const sigueVerificando = estaVerificando(data) || info?.estadoDIAN === 'PENDIENTE';
            mostrarRespuesta(response.status, data, aprobada ? 'exito' : sigueVerificando ? 'pendiente' : 'fallo');

            if (aprobada) {
                ocultarConsulta();
                mostrarNotificacion(`Factura ${numeroDocumento} aprobada por la DIAN (${info.estadoClarisa}).`, 'success');
            } else if (sigueVerificando) {
                mostrarNotificacion(`La factura ${numeroDocumento} sigue en validación con la DIAN. Intenta de nuevo en unos segundos.`, 'warning');
            } else {
                mostrarNotificacion(mensajeDeError(typeof data === 'object' ? data : null, response.status), 'error');
            }
        } catch {
            mostrarNotificacion('No fue posible consultar el estado en Clarisa. Verifica tu conexión e inténtalo de nuevo.', 'error');
        } finally {
            if (documentoEnValidacion) esperaConsulta(SEGUNDOS_ENTRE_CONSULTAS);
        }
    });

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (enEspera || btnEmitir.disabled) return;

        const datos = leerFormulario();
        const error = validar(datos);
        if (error) {
            mostrarNotificacion(error, 'error');
            return;
        }

        let payload;
        try {
            const items = construirItems(datos);
            payload = construirPayload(datos, items, totalizar(items));
        } catch (err) {
            mostrarNotificacion(err.message, 'error');
            return;
        }

        console.log('Payload enviado:', payload);
        ocultarConsulta();
        bloquearEnvio('Emitiendo...');

        try {
            const response = await fetch(URL_FACTURA, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(payload)
            });

            const data = await leerRespuesta(response);

            // Clarisa responde HTTP 206 con success: false cuando la validacion falla.
            const exito = response.status === 200 && data?.success === true;
            const pendiente = !exito && estaVerificando(data);
            mostrarRespuesta(response.status, data, exito ? 'exito' : pendiente ? 'pendiente' : 'fallo');

            if (!exito && !pendiente) {
                throw new Error(mensajeDeError(typeof data === 'object' ? data : null, response.status));
            }

            const numeroDocumento = `${datos.prefijo}${datos.consecutivo}`;
            localStorage.setItem(CLAVE_CONSECUTIVO, datos.consecutivo);
            campo('doc-consecutivo').value = siguienteConsecutivo();

            if (pendiente) {
                prepararConsulta(datos.nit, numeroDocumento);
                mostrarNotificacion(
                    `La factura ${numeroDocumento} fue recibida por Clarisa y está en validación con la DIAN (estado ${data.data.estadoDIAN || 'PENDIENTE'}). Consulta su estado en unos segundos.`,
                    'warning'
                );
            } else {
                mostrarNotificacion(mensajeDeExito(data), 'success');
            }
        } catch (err) {
            if (err instanceof TypeError) {
                mostrarRespuesta(0, { error: err.message, payloadEnviado: payload }, 'fallo');
                mostrarNotificacion('No fue posible conectar con el servidor de Clarisa. Verifica tu conexión e inténtalo de nuevo.', 'error');
            } else {
                mostrarNotificacion(err.message, 'error');
            }
        } finally {
            iniciarEspera(SEGUNDOS_ENTRE_ENVIOS);
        }
    });

    agregarRepuesto();
    actualizarResumen();
});
