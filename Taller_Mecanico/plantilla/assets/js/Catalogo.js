// ============================================
// CATÁLOGO - LJA TALLER MECÁNICO
// ============================================

const products = [
    {
        name: "Aceite de motor 20W50",
        category: "Lubricantes",
        image: "images/aceite-motor.jpg",
        description: "Aceite para motor de motocicleta, ideal para mantenimiento periódico.",
        badge: "Lubricantes"
    },
    {
        name: "Kit de arrastre para moto",
        category: "Motor",
        image: "images/kit-arrastre.jpg",
        description: "Cadena, piñón y corona para motocicleta.",
        badge: "Más buscado"
    },
    {
        name: "Pastillas de freno",
        category: "Frenos",
        image: "images/pastillas-freno.jpg",
        description: "Juego de pastillas para freno delantero.",
        badge: "Frenos"
    },
    {
        name: "Filtro de aire y aceite",
        category: "Filtros",
        image: "images/filtro-aire-aceite.jpg",
        description: "Filtros para motocicleta y automóvil.",
        badge: "Filtros"
    },
    {
        name: "Bujía NGK Iridium",
        category: "Motor",
        image: "images/bujia-ngk.jpg",
        description: "Bujía de alto rendimiento para motor.",
        badge: "Motor"
    },
    {
        name: "Batería de moto 12V",
        category: "Electricidad",
        image: "images/bateria-moto.jpg",
        description: "Batería de 12V para motocicleta.",
        badge: "Electricidad"
    }
];

let currentCategory = "Todos";


// ============================================
// MOSTRAR PRODUCTOS
// ============================================

function renderProducts() {

    const grid = document.getElementById("productGrid");
    const emptyMessage = document.getElementById("emptyMessage");
    const searchInput = document.getElementById("searchInput");

    if (!grid) return;

    const searchText = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filteredProducts = products.filter(product => {

        const matchesCategory =
            currentCategory === "Todos" ||
            product.category.toLowerCase() === currentCategory.toLowerCase();

        const matchesSearch =
            product.name.toLowerCase().includes(searchText) ||
            product.category.toLowerCase().includes(searchText) ||
            product.description.toLowerCase().includes(searchText);

        return matchesCategory && matchesSearch;
    });

    grid.innerHTML = "";

    filteredProducts.forEach(product => {

        const card = document.createElement("article");

        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <span class="product-badge">
                    ${product.badge}
                </span>

            </div>

            <div class="product-content">

                <span class="product-category">
                    ${product.category}
                </span>

                <h3>
                    ${product.name}
                </h3>

                <p>
                    ${product.description}
                </p>

                <button
                    class="consult-btn"
                    type="button"
                    onclick="consultProduct('${product.name.replace(/'/g, "\\'")}')">

                    Consultar

                </button>

            </div>
        `;

        grid.appendChild(card);
    });

    if (emptyMessage) {

        emptyMessage.style.display =
            filteredProducts.length === 0
                ? "block"
                : "none";
    }
}


// ============================================
// FILTRAR POR CATEGORÍA
// ============================================

function filterProducts(category, button) {

    currentCategory = category;

    document
        .querySelectorAll(".filter")
        .forEach(filter => {

            filter.classList.remove("active");

        });

    if (button) {

        button.classList.add("active");

    }

    renderProducts();
}


// ============================================
// CONSULTAR PRODUCTO
// ============================================

function consultProduct(productName) {

    const message =
        `Hola, quisiera consultar disponibilidad y precio del producto: ${productName}.`;

    /*
     * CAMBIA ESTE NÚMERO POR EL WHATSAPP
     * REAL DE LJA TALLER MECÁNICO.
     *
     * Formato:
     * 57 + número
     *
     * Ejemplo:
     * 573001234567
     */

    const phone = "573000000000";

    const whatsappURL =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, "_blank");
}


// ============================================
// INICIALIZAR CATÁLOGO
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    renderProducts();

    const filters =
        document.querySelectorAll(".filter");

    filters.forEach(button => {

        button.addEventListener("click", () => {

            filterProducts(
                button.dataset.category,
                button
            );

        });

    });

});

