const URL_FACTURA = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional';
const PAGINA_LOGIN = '../Login/Login.html';

const token = sessionStorage.getItem('clarisa_token');
if (!token) {
    window.location.replace(PAGINA_LOGIN);
}

const form = document.getElementById('formFactura');
const mensaje = document.getElementById('mensaje');
const boto = document.getElementById('btnEnviar');
const textoTotal = document.getElementById('total');

function valor(id){
    return document.getElementById(id).value.trim();
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
    const tarifa = Number(valor('tarifaTributo'));

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

    const factura = {
        nit: valor('nit'),
        numeroResolucion: valor('numeroResolucion'),
        consecutivoDcto: valor('consecutivoDcto'),
        prefijoDcto: valor('prefijoDcto'),
        fechaVencimiento: valor('fechaVencimiento'),
        formaPago: valor('formaPago'),
        mediosPago: valor('mediosPago'),
        cliente: {
            nombreRazonSocial: valor('nombreRazonSocial'),
            tipoIdentificacion: valor('tipoIdentificacion'),
            numeroIdentificacion: valor('numeroIdentificacion'),
            naturaleza: valor('naturaleza'),
        },
        items: [
            {
                codigo: valor('codigo'),
                nombreItem: valor('nombreItem'),
                precioBaseUnitario: Number(valor('precioBaseUnitario')),
                cantidad: Number(valor('cantidad')),
                unidad: valor('unidad'),
                impuesto: [
                    {
                        tipo: 'IVA',
                        claseImpuesto: 'PO',
                        tarifaTributo: Number(valor('tarifaTributo')),
                    }
                ]
            }
        ]
    };
    const numeroFactura = factura.prefijoDcto + factura.consecutivoDcto;
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

    if (json.success9) {
       mostrarMensaje('exito', 'Factura ' + numeroFactura + ' creada correctamente.');
            document.getElementById('consecutivoDcto').value = '';
        } else if (json.data?.estadoClarisa === 'VERIFICANDO') {
            mostrarMensaje('aviso', 'Factura ' + numeroFactura + ' enviada. La DIAN la está validando.');
            document.getElementById('consecutivoDcto').value = '';
        } else {
            const errores = json.data?.errores || [];
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
    
    