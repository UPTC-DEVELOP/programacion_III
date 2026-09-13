const products = [
  {name:"Aceite de motor 20W50", category:"Lubricantes", image:"aceite-motor.jpg", desc:"Aceite para motor de motocicleta, ideal para mantenimiento periódico.", badge:"Lubricantes"},
  {name:"Kit de arrastre para moto", category:"Motor", image:"kit-arrastre.jpg", desc:"Cadena, piñón y corona para motocicleta.", badge:"Más buscado"},
  {name:"Pastillas de freno", category:"Frenos", image:"pastillas-freno.jpg", desc:"Juego de pastillas para freno delantero.", badge:"Frenos"},
  {name:"Filtro de aire y aceite", category:"Filtros", image:"filtro-aire-aceite.jpg", desc:"Filtros para motocicleta y automóvil.", badge:"Filtros"},
  {name:"Bujía NGK Iridium", category:"Motor", image:"bujia-ngk.jpg", desc:"Bujía de alto rendimiento para motor.", badge:"Motor"},
  {name:"Batería de moto 12V", category:"Electricidad", image:"bateria-moto.jpg", desc:"Batería sellada para motocicleta.", badge:"Electricidad"},
  {name:"Llantas doble propósito", category:"Accesorios", image:"llantas.jpg", desc:"Llantas para diferentes terrenos y condiciones.", badge:"Llantas"},
  {name:"Casco y guantes", category:"Accesorios", image:"casco-guantes.jpg", desc:"Equipo de protección para motociclistas.", badge:"Accesorios"},
  {name:"Refrigerante y líquido de frenos", category:"Lubricantes", image:"refrigerante-frenos.jpg", desc:"Refrigerante y líquido de frenos DOT 4.", badge:"Mantenimiento"},
  {name:"Amortiguadores traseros", category:"Suspensión", image:"amortiguadores.jpg", desc:"Par de amortiguadores para motocicleta.", badge:"Suspensión"},
  {name:"Disco de freno ventilado", category:"Frenos", image:"disco-freno.jpg", desc:"Disco de freno para motocicleta.", badge:"Frenos"},
  {name:"Kit de herramientas", category:"Accesorios", image:"kit-herramientas.jpg", desc:"Herramientas, grasa y productos de mantenimiento.", badge:"Taller"}
];

let activeCategory = "Todos";

function renderProducts(){
  const query = document.getElementById("searchInput").value.toLowerCase().trim();
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyMessage");

  const filtered = products.filter(p => {
    const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
    const matchesSearch = (p.name + " " + p.category + " " + p.desc).toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = filtered.map(p => `
    <article class="product">
      <div class="product-image">
        <img src="../Css/IMG/${p.image}" alt="${p.name}" loading="lazy">
        <span class="badge">${p.badge}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="product-bottom">
          <span class="price">Consultar precio</span>
          <button class="consult-btn" onclick="consult('${p.name}')">Consultar</button>
        </div>
      </div>
    </article>
  `).join("");

  empty.style.display = filtered.length ? "none" : "block";
}

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderProducts();
  });
});

function consult(product){
  const message = encodeURIComponent(`Hola, LJA MOTORS. Quiero consultar disponibilidad y precio de: ${product}.`);
  window.open(`https://wa.me/573000000000?text=${message}`, "_blank");
}

renderProducts();