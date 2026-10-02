
// CRUD - Funciones compartidas


// ---------- MOSTRAR NOTIFICACIÓN ----------
function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.getElementById('notificacion-crud');
    if (!notificacion) return;
    
    notificacion.className = 'crud-notificacion ' + tipo;
    notificacion.textContent = mensaje;
    
    // Desplazar hacia la notificación
    notificacion.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
        notificacion.className = 'crud-notificacion';
        notificacion.textContent = '';
    }, 4000);
}

// ---------- ABRIR MODAL ----------
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
    }
}

// ---------- CERRAR MODAL ----------
function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

// ---------- CERRAR MODAL AL HACER CLIC FUERA ----------
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('crud-modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ---------- CERRAR MODAL CON ESC ----------
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modalesAbiertos = document.querySelectorAll('.crud-modal.active');
        modalesAbiertos.forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});