/* =========================================================
   LJA TALLER - CRUD PRODUCTOS
   ========================================================= */


/* 
   CONFIGURACIÓN
    */

const STORAGE_KEY = "lja_productos";


/* =========================================================
   PRODUCTOS INICIALES
   ========================================================= */

const productosIniciales = [

    {
        id: 1,
        nombre: "Aceite de motor 20W50",
        categoria: "Lubricantes",
        imagen: "aceite-motor.jpg",
        descripcion: "Aceite para motor de motocicleta, ideal para mantenimiento periódico.",
        badge: "Lubricantes"
    },

    {
        id: 2,
        nombre: "Kit de arrastre para moto",
        categoria: "Motor",
        imagen: "kit-arrastre.jpg",
        descripcion: "Cadena, piñón y corona para motocicleta.",
        badge: "Más buscado"
    },

    {
        id: 3,
        nombre: "Pastillas de freno",
        categoria: "Frenos",
        imagen: "pastillas-freno.jpg",
        descripcion: "Juego de pastillas para freno delantero.",
        badge: "Frenos"
    },

    {
        id: 4,
        nombre: "Filtro de aire y aceite",
        categoria: "Filtros",
        imagen: "filtro-aire-aceite.jpg",
        descripcion: "Filtros para motocicleta y automóvil.",
        badge: "Filtros"
    },

    {
        id: 5,
        nombre: "Bujía NGK Iridium",
        categoria: "Motor",
        imagen: "bujia-ngk.jpg",
        descripcion: "Bujía de alto rendimiento para motor.",
        badge: "Motor"
    },

    {
        id: 6,
        nombre: "Batería de moto 12V",
        categoria: "Electricidad",
        imagen: "bateria-moto.jpg",
        descripcion: "Batería sellada para motocicleta.",
        badge: "Electricidad"
    },

    {
        id: 7,
        nombre: "Llantas doble propósito",
        categoria: "Accesorios",
        imagen: "llantas.jpg",
        descripcion: "Llantas para diferentes terrenos y condiciones.",
        badge: "Llantas"
    },

    {
        id: 8,
        nombre: "Casco y guantes",
        categoria: "Accesorios",
        imagen: "casco-guantes.jpg",
        descripcion: "Equipo de protección para motociclistas.",
        badge: "Accesorios"
    },

    {
        id: 9,
        nombre: "Refrigerante y líquido de frenos",
        categoria: "Lubricantes",
        imagen: "refrigerante-frenos.jpg",
        descripcion: "Refrigerante y líquido de frenos DOT 4.",
        badge: "Mantenimiento"
    },

    {
        id: 10,
        nombre: "Amortiguadores traseros",
        categoria: "Suspensión",
        imagen: "amortiguadores.jpg",
        descripcion: "Par de amortiguadores para motocicleta.",
        badge: "Suspensión"
    },

    {
        id: 11,
        nombre: "Disco de freno ventilado",
        categoria: "Frenos",
        imagen: "disco-freno.jpg",
        descripcion: "Disco de freno para motocicleta.",
        badge: "Frenos"
    },

    {
        id: 12,
        nombre: "Kit de herramientas",
        categoria: "Accesorios",
        imagen: "kit-herramientas.jpg",
        descripcion: "Herramientas, grasa y productos de mantenimiento.",
        badge: "Taller"
    }

];


/* =========================================================
   VARIABLES
   ========================================================= */

let productos = [];

let editandoId = null;


/* =========================================================
   ELEMENTOS DEL DOM
   ========================================================= */

const formulario = document.getElementById("producto-form");

const productoId = document.getElementById("producto-id");

const nombre = document.getElementById("nombre");

const categoria = document.getElementById("categoria");

const imagen = document.getElementById("imagen");

const descripcion = document.getElementById("descripcion");

const badge = document.getElementById("badge");

const tablaProductos = document.getElementById("productos-body");

const contador = document.getElementById("contador-productos");

const buscar = document.getElementById("buscar-producto");

const filtroCategoria = document.getElementById("filtro-categoria");

const estadoVacio = document.getElementById("estado-vacio");

const btnSubmit = document.getElementById("btn-submit");

const btnCancelar = document.getElementById("btn-cancelar");

const formTitle = document.getElementById("form-title");


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    cargarProductos();

    renderizarProductos();

    activarIconos();

});


/* =========================================================
   CARGAR PRODUCTOS
   ========================================================= */

function cargarProductos() {

    const productosGuardados =
        localStorage.getItem(STORAGE_KEY);


    /*
       Si ya existen productos guardados,
       los utilizamos.
    */

    if (productosGuardados) {

        try {
0
            productos = JSON.parse(productosGuardados);

        } catch (error) {

            console.error(
                "Error al cargar productos:",
                error
            );

            productos = [...productosIniciales];

            guardarProductos();
        }

    } else {

        /*
           Primera vez que se abre el CRUD.
           Cargamos los productos iniciales.
        */

        productos = [...productosIniciales];

        guardarProductos();
    }

}


/* =========================================================
   GUARDAR EN LOCAL STORAGE
   ========================================================= */

function guardarProductos() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(productos)
    );

}


/* =========================================================
   MOSTRAR PRODUCTOS
   ========================================================= */

function renderizarProductos() {

    const textoBusqueda =
        buscar.value
            .toLowerCase()
            .trim();


    const categoriaSeleccionada =
        filtroCategoria.value;


    const productosFiltrados =
        productos.filter(producto => {

            const coincideBusqueda =

                producto.nombre
                    .toLowerCase()
                    .includes(textoBusqueda)

                ||

                producto.descripcion
                    .toLowerCase()
                    .includes(textoBusqueda);


            const coincideCategoria =

                categoriaSeleccionada === "Todas"

                ||

                producto.categoria ===
                categoriaSeleccionada;


            return (
                coincideBusqueda &&
                coincideCategoria
            );

        });


    tablaProductos.innerHTML = "";


    /* Contador */

    contador.textContent =
        productos.length;


    /* Si no hay productos */

    if (productosFiltrados.length === 0) {

        estadoVacio.style.display = "block";

        return;

    }


    estadoVacio.style.display = "none";


    /* Crear filas */

    productosFiltrados.forEach(producto => {

        const fila =
            document.createElement("tr");


        fila.innerHTML = `

            <td>

                <div class="producto-info">

                    <img
                        class="producto-imagen"
                        src="assets/imagenes/${producto.imagen}"
                        alt="${producto.nombre}"
                        onerror="this.src='assets/iconos/LOGO.png'"
                    >

                    <div>

                        <div class="producto-nombre">
                            ${producto.nombre}
                        </div>

                        <span class="producto-id">
                            ID: ${producto.id}
                        </span>

                    </div>

                </div>

            </td>


            <td>

                <span class="producto-categoria">
                    ${producto.categoria}
                </span>

            </td>


            <td>
                ${producto.descripcion}
            </td>


            <td>

                <span class="producto-badge">
                    ${producto.badge || "Sin etiqueta"}
                </span>

            </td>


            <td>

                <div class="acciones">

    <button
        type="button"
        class="btn-editar"
        onclick="editarProducto(${producto.id})"
    >
        <i data-lucide="pencil"></i>
        Editar
    </button>

    <button
        type="button"
        class="btn-eliminar"
        onclick="eliminarProducto(${producto.id})"
    >
        <i data-lucide="trash-2"></i>
        Eliminar
    </button>

</div> 

            </td>

        `;


        tablaProductos.appendChild(fila);

    });


    activarIconos();

}


/* =========================================================
   CREAR / ACTUALIZAR
   ========================================================= */

formulario.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const nombreProducto =
            nombre.value.trim();


        const categoriaProducto =
            categoria.value;


        const imagenProducto =
            imagen.value.trim();


        const descripcionProducto =
            descripcion.value.trim();


        const badgeProducto =
            badge.value.trim();


        /* Validación */

        if (
            !nombreProducto ||
            !categoriaProducto ||
            !imagenProducto ||
            !descripcionProducto
        ) {

            alert(
                "Por favor completa todos los campos obligatorios."
            );

            return;

        }


        /* =================================================
           ACTUALIZAR
        ================================================= */

        if (editandoId !== null) {

            const indice =
                productos.findIndex(
                    producto =>
                        producto.id === editandoId
                );


            if (indice !== -1) {

                productos[indice] = {

                    ...productos[indice],

                    nombre:
                        nombreProducto,

                    categoria:
                        categoriaProducto,

                    imagen:
                        imagenProducto,

                    descripcion:
                        descripcionProducto,

                    badge:
                        badgeProducto

                };

            }


            alert(
                "Producto actualizado correctamente."
            );

        }


        /* =================================================
           CREAR
        ================================================= */

        else {

            const nuevoProducto = {

                id: generarId(),

                nombre:
                    nombreProducto,

                categoria:
                    categoriaProducto,

                imagen:
                    imagenProducto,

                descripcion:
                    descripcionProducto,

                badge:
                    badgeProducto

            };


            productos.push(nuevoProducto);


            alert(
                "Producto registrado correctamente."
            );

        }


        guardarProductos();

        renderizarProductos();

        limpiarFormulario();

    }
);


/* =========================================================
   GENERAR ID
   ========================================================= */

function generarId() {

    if (productos.length === 0) {

        return 1;

    }


    const ids =
        productos.map(
            producto => producto.id
        );


    return Math.max(...ids) + 1;

}


/* =========================================================
   EDITAR PRODUCTO
   ========================================================= */

function editarProducto(id) {

    const producto =
        productos.find(
            producto => producto.id === id
        );


    if (!producto) {

        return;

    }


    editandoId = id;


    productoId.value =
        producto.id;


    nombre.value =
        producto.nombre;


    categoria.value =
        producto.categoria;


    imagen.value =
        producto.imagen;


    descripcion.value =
        producto.descripcion;


    badge.value =
        producto.badge || "";


    /* Cambiar título */

    formTitle.textContent =
        "Editar producto";


    /* Cambiar botón */

    btnSubmit.innerHTML = `

        <i data-lucide="save"></i>

        Actualizar producto

    `;


    /* Mostrar cancelar */

    btnCancelar.style.display =
        "inline-flex";


    activarIconos();


    /* Llevar al formulario */

    document
        .querySelector(".producto-form-card")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


/* =========================================================
   ELIMINAR PRODUCTO
   ========================================================= */

function eliminarProducto(id) {

    const producto =
        productos.find(
            producto => producto.id === id
        );


    if (!producto) {

        return;

    }


    const confirmar =
        confirm(
            `¿Deseas eliminar el producto "${producto.nombre}"?`
        );


    if (!confirmar) {

        return;

    }


    productos =
        productos.filter(
            producto => producto.id !== id
        );


    guardarProductos();

    renderizarProductos();


    /*
       Si estábamos editando este producto,
       limpiamos el formulario.
    */

    if (editandoId === id) {

        limpiarFormulario();

    }


    alert(
        "Producto eliminado correctamente."
    );

}


/* =========================================================
   CANCELAR EDICIÓN
   ========================================================= */

btnCancelar.addEventListener(
    "click",
    () => {

        limpiarFormulario();

    }
);


/* =========================================================
   LIMPIAR FORMULARIO
   ========================================================= */

function limpiarFormulario() {

    formulario.reset();


    productoId.value = "";


    editandoId = null;


    formTitle.textContent =
        "Registrar producto";


    btnSubmit.innerHTML = `

        <i data-lucide="plus"></i>

        Registrar producto

    `;


    btnCancelar.style.display =
        "none";


    activarIconos();

}


/* =========================================================
   BUSCADOR
   ========================================================= */

buscar.addEventListener(
    "input",
    () => {

        renderizarProductos();

    }
);


/* =========================================================
   FILTRO
   ========================================================= */

filtroCategoria.addEventListener(
    "change",
    () => {

        renderizarProductos();

    }
);


/* =========================================================
   LUCIDE
   ========================================================= */

function activarIconos() {

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }

}   