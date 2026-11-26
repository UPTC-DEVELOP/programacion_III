const TOKEN_PANTHER = '750e8b43e5ed564462c90ef0d382db26';
const BASE_URL = 'http://localhost/api_panther/index.php?PATH_INFO=proveedores';

let editando = false;
let idEditando = null;

const tablaBody = document.getElementById('tabla-proveedores-body');
const contador = document.getElementById('contador-proveedores');
const buscador = document.getElementById('buscar-proveedor');
const formProveedor = document.getElementById('form-proveedor');
const modalTitulo = document.getElementById('modal-titulo-proveedor');


async function obtenerProveedores() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER
            }
        });

        if (!response.ok) throw new Error('Error en la petición al servidor');

        const data = await response.json();

        if (data.state && data.state !== 'OK') {
            console.error('Error de Panther:', data.data);
            return [];
        }

        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error('Error al conectar con Panther:', error);
        mostrarNotificacion('No se pudo obtener la lista de proveedores.', 'error');
        return [];
    }
}


async function renderizarTabla(filtro = '') {
    tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando proveedores...</td></tr>';

    const proveedores = await obtenerProveedores();
    tablaBody.innerHTML = '';

    const filtrados = proveedores.filter(p => {
        const q = filtro.toLowerCase();
        return (p.nit || '').toLowerCase().includes(q) ||
               (p.razon_social || '').toLowerCase().includes(q) ||
               (p.contacto || '').toLowerCase().includes(q) ||
               (p.correo || '').toLowerCase().includes(q);
    });

    if (filtrados.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="7" class="sin-resultados" style="text-align:center;">No se encontraron proveedores</td></tr>';
    } else {
        filtrados.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nit}</td>
                <td>${p.razon_social}</td>
                <td>${p.contacto}</td>
                <td>${p.telefono}</td>
                <td>${p.correo}</td>
                <td>${p.direccion}</td>
                <td>
                    <div class="crud-acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="prepararEdicion(${p.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarProveedor(${p.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }
    contador.textContent = filtrados.length + ' registro(s)';
}


formProveedor.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nit = document.getElementById('nit').value.trim();
    const razon_social = document.getElementById('razon_social').value.trim();
    const contacto = document.getElementById('contacto').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    // Validaciones de campos obligatorios
    if (!nit || nit.length < 5) return mostrarNotificacion('El NIT es obligatorio (mínimo 5 caracteres).', 'error');
    if (!razon_social || razon_social.length < 3) return mostrarNotificacion('La razón social es obligatoria.', 'error');
    if (!contacto || contacto.length < 3) return mostrarNotificacion('El nombre de contacto es obligatorio.', 'error');
    if (!telefono || !/^[0-9+\-\s]{7,15}$/.test(telefono)) return mostrarNotificacion('Ingresa un teléfono válido (7 a 15 dígitos).', 'error');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarNotificacion('Ingresa un correo electrónico válido.', 'error');
    if (!direccion || direccion.length < 5) return mostrarNotificacion('La dirección es obligatoria.', 'error');

    const payload = { nit, razon_social, contacto, telefono, correo, direccion };
    const metodo = editando ? 'PUT' : 'POST';
    const url = editando ? `${BASE_URL}/${idEditando}` : BASE_URL;

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'authorization': TOKEN_PANTHER
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            mostrarNotificacion(`Proveedor ${editando ? 'actualizado' : 'registrado'} correctamente.`, 'success');
            cerrarModal('modal-proveedor');
            renderizarTabla(buscador.value);
        } else {
            throw new Error('No se pudo guardar el proveedor en Panther');
        }
    } catch (error) {
        mostrarNotificacion('Error al guardar: ' + error.message, 'error');
    }
});

async function prepararEdicion(id) {
    const proveedores = await obtenerProveedores();
    const p = proveedores.find(item => item.id == id);
    if (!p) return;

    editando = true;
    idEditando = id;
    modalTitulo.textContent = 'Editar Proveedor';

    document.getElementById('nit').value = p.nit;
    document.getElementById('nit').disabled = true;
    document.getElementById('razon_social').value = p.razon_social;
    document.getElementById('contacto').value = p.contacto;
    document.getElementById('telefono').value = p.telefono;
    document.getElementById('correo').value = p.correo;
    document.getElementById('direccion').value = p.direccion;

    abrirModal('modal-proveedor');
}

async function eliminarProveedor(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;

    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'authorization': TOKEN_PANTHER }
        });

        if (response.ok) {
            mostrarNotificacion('Proveedor eliminado correctamente.', 'success');
            renderizarTabla(buscador.value);
        } else {
            throw new Error('No se pudo eliminar (verifica que no tenga repuestos asociados)');
        }
    } catch (error) {
        mostrarNotificacion('Error al eliminar: ' + error.message, 'error');
    }
}

document.getElementById('btn-nuevo-proveedor').addEventListener('click', function () {
    editando = false;
    idEditando = null;
    modalTitulo.textContent = 'Nuevo Proveedor';
    formProveedor.reset();
    document.getElementById('nit').disabled = false;
    abrirModal('modal-proveedor');
});

buscador.addEventListener('input', function () {
    renderizarTabla(this.value);
});

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('crud-modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.crud-modal.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.getElementById('notificacion-crud');
    if (!notificacion) return;

    notificacion.className = 'crud-notificacion ' + tipo;
    notificacion.textContent = mensaje;
    notificacion.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
        notificacion.className = 'crud-notificacion';
        notificacion.textContent = '';
    }, 4000);
}

renderizarTabla();