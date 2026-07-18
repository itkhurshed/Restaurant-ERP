// menu.html — loads categories + menu items from Firestore, supports
// search and category filtering, links each card to food-details.html.

let allMenuItems = [];
let allCategories = [];
let activeCategory = "ALL";

function loadMenu() {
  const grid = document.getElementById("menuGrid");
  grid.innerHTML = '<p class="text-muted">Loading menu…</p>';

  Promise.all([
    db.collection("categories").orderBy("order").get(),
    db.collection("menuItems").where("available", "==", true).get()
  ]).then(([catSnap, itemSnap]) => {
    allCategories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    allMenuItems = itemSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCategoryPills();
    renderGrid();
  }).catch(err => {
    grid.innerHTML = '<div class="alert alert-danger">Could not load the menu: ' + err.message +
      '. Make sure js/firebase-config.js has your real Firebase project config, and that ' +
      'you have run admin-seed.html at least once to add sample data.</div>';
  });
}

function renderCategoryPills() {
  const box = document.getElementById("categoryPills");
  const pills = [{ id: "ALL", name: "All" }, ...allCategories];
  box.innerHTML = pills.map(c =>
    `<button class="btn btn-sm ${activeCategory === c.id ? 'btn-dark' : 'btn-outline-dark'} me-2 mb-2" data-cat="${c.id}">${c.name}</button>`
  ).join("");
  box.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderCategoryPills();
      renderGrid();
    });
  });
}

function renderGrid() {
  const grid = document.getElementById("menuGrid");
  const search = (document.getElementById("menuSearch")?.value || "").toLowerCase();

  const items = allMenuItems.filter(i => {
    const matchesCategory = activeCategory === "ALL" || i.categoryId === activeCategory;
    const matchesSearch = !search || (i.name || "").toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  if (!items.length) {
    grid.innerHTML = '<p class="text-muted">No dishes match that search.</p>';
    return;
  }

  grid.innerHTML = items.map((i, idx) => `
    <div class="col-6 col-md-4 col-lg-3">
      <a href="food-details.html?id=${i.id}" class="text-decoration-none text-dark">
        <div class="card h-100 menu-card" style="animation-delay:${Math.min(idx, 11) * 0.05}s;">
          <img src="${i.imageUrl || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(i.name)}" class="card-img-top" alt="${i.name}">
          <div class="card-body">
            <h6 class="card-title mb-1">${i.name}</h6>
            <p class="card-text text-muted small mb-1">${(i.description || "").slice(0, 60)}</p>
            <p class="card-text fw-bold text-success">${formatMoney(i.price)}</p>
          </div>
        </div>
      </a>
    </div>
  `).join("");

  revealMenuCards();
}

// Scroll-reveal: fades/slides each menu card in as it enters the viewport,
// using IntersectionObserver so cards below the fold animate on scroll
// instead of all firing at once on page load.
function revealMenuCards() {
  const cards = document.querySelectorAll(".menu-card:not(.in-view)");
  if (!("IntersectionObserver" in window)) {
    cards.forEach(c => c.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(c => observer.observe(c));
}

document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  const search = document.getElementById("menuSearch");
  if (search) search.addEventListener("input", renderGrid);
});
