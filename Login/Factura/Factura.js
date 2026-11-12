const URL_FACTURA = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional';
const PAGINA_LOGIN = '../Login/Login.html';

const token = sessionStorage.getItem('clarisa_token');
if (!token) {
    window.location.replace(PAGINA_LOGIN);
}

const form = document.getElementById('formFactura');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('btnEnviar');
const textoTotal = document.getElementById('total');

function valor(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}
function leerImpuesto() {
    const v = valor('tarifaTributo');
    if (v.includes(':')) {
        const [tipo, tarifa] = v.split(':');
        return { tipo, tarifa: Number(tarifa) };
    }
    return { tipo: 'IVA', tarifa: Number(v) };
}
function mostrarMensaje(tipo, texto) {
    mensaje.className = tipo;
    mensaje.textContent = texto;
}

function cerrarSesion() {
    sessionStorage.removeItem('clarisa_token');
    sessionStorage.removeItem('clarisa_usuario');
    window.location.replace(PAGINA_LOGIN);
}

document.getElementById('nombreUsuario').textContent = 
sessionStorage.getItem('clarisa_usuario') || '';

document.getElementById('btnSalir').addEventListener('click', cerrarSesion);

const hoy = new Date();
const fechaHoy = hoy.getFullYear() + '-' + 
String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
String(hoy.getDate()).padStart(2, '0');

const inputFecha = document.getElementById('fechaVencimiento');
inputFecha.min = fechaHoy;
inputFecha.value = fechaHoy;

function calcularTotal() {
    const cantidad = Number(valor('cantidad'));
    const precio = Number(valor('precioBaseUnitario'));
    const tarifa = leerImpuesto().tarifa;

    const subtotal = cantidad * precio;
    const total = subtotal + subtotal * tarifa / 100;
    return Math.round(total * 100) / 100;
}
function mostrarTotal() {
    textoTotal.textContent = '$' + calcularTotal().toLocaleString('es-CO');
}
form.addEventListener('input', mostrarTotal);
mostrarTotal();

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarMensaje('', '');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const imp = leerImpuesto();
    const cliente = {
        nombreRazonSocial: valor('nombreRazonSocial'),
        tipoIdentificacion: valor('tipoIdentificacion'),
        numIdentificacion: valor('numIdentificacion'),
        naturaleza: valor('naturaleza'),
        respFiscales: valor('respFiscales'),
        respTributarias: valor('respTributarias'),
    };
    ['email', 'direccion', 'ciudad', 'telefono'].forEach((id) => {
        if (valor(id)) cliente[id] = valor(id);
    });
    const subtotal = Number(valor('cantidad')) * Number(valor('precioBaseUnitario'));

    const factura = {
        NIT: valor('nit'),
        numeroResolucion: valor('numeroResolucion'),
        consecutivoDcto: Number(valor('consecutivoDcto')),
        fechaVencimiento: valor('fechaVencimiento'),
        formaPago: valor('formaPago'),
        mediosPago: [valor('medioPago')],
        extensiones: {
            dianExtension: {
                beneficiosComprador: { codigo: cliente.numIdentificacion, nombreApellido: cliente.nombreRazonSocial, puntos: '0' },
                puntoVenta: {
                    placaCaja: 'CAJA1', ubicacionCaja: 'WEB',
                    cajero: sessionStorage.getItem('clarisa_usuario') || 'Cajero',
                    tipoCaja: 'VIRTUAL', codigoVenta: String(Date.now()).slice(-9),
                    subTotal: String(subtotal),
                },
            },
        },
        cliente: cliente,
        total: calcularTotal(),
        items: [
            {
                codigo: valor('codigo'),
                nombreItemVenta: valor('nombreItem'),
                precioBaseUnitario: Number(valor('precioBaseUnitario')),
                cantidad: Number(valor('cantidad')),
                unidad: valor('unidad'),
                valorDescuento: 0,
                observacion: '',
                impuestos: [
                    { tipo: imp.tipo, claseImpuesto: 'PO', tarifaTributo: imp.tarifa }
                ],
            }
        ]
    };
    if (valor('prefijoDcto')) factura.prefijoDcto = valor('prefijoDcto');




    const numeroFactura = valor('prefijoDcto') + valor('consecutivoDcto');
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    try{
        const res = await fetch(URL_FACTURA, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(factura)
        });
    if (res.status === 401){
        cerrarSesion();
        return;
    }

    const json = await res.json();
    console.log(json);

    
        if (json.success) {
       mostrarMensaje('exito', 'Factura ' + numeroFactura + ' creada correctamente.');
            document.getElementById('consecutivoDcto').value = '';
        } else if (json.data?.estadoClarisa === 'VERIFICANDO') {
            mostrarMensaje('aviso', 'Factura ' + numeroFactura + ' enviada. La DIAN la está validando.');
            document.getElementById('consecutivoDcto').value = '';
        } else {
            const errores = json.data?.errores || json.errores?.errores || [];
            const texto = errores.map((err) => err.errorMessage).join(' | ');
            mostrarMensaje('error', texto || json.textResponse || 'No se pudo crear la factura');
        }
    } catch (error) {
        mostrarMensaje('error', 'Error de conexión con el servidor');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Crear factura';
    }
}); 
    
    