// index.html — nav scroll shadow, scroll-reveal animation, animated stat
// counters, and a "Popular Right Now" preview pulled from Firestore
// (falling back to sample cards if the project isn't configured/seeded yet).

document.addEventListener("DOMContentLoaded", () => {
  setupNavShadow();
  setupScrollReveal();
  setupCounters();
  loadPopularDishes();
});

function setupNavShadow() {
  const nav = document.getElementById("mainNav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
}

function setupCounters() {
  const counters = document.querySelectorAll(".stat-number");
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.count || "0", 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));
}

const SAMPLE_DISHES = [
  { name: "Chicken Burger", description: "Grilled chicken, lettuce, tomato, cheese", price: 3.25,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=60" },
  { name: "Margherita Pizza", description: "Tomato, mozzarella, fresh basil", price: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1548365328-8b849e6c7b31?w=500&q=60" },
  { name: "Grilled Chicken Plate", description: "Served with rice and salad", price: 4.0,
    imageUrl: "https://images.unsplash.com/photo-1598515213692-5f252f9e2d4c?w=500&q=60" },
  { name: "Chocolate Lava Cake", description: "Warm cake, molten center, vanilla scoop", price: 2.25,
    imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=60" }
];

function loadPopularDishes() {
  const grid = document.getElementById("popularDishes");
  if (!grid) return;

  if (typeof db === "undefined") {
    renderDishCards(grid, SAMPLE_DISHES);
    return;
  }

  db.collection("menuItems").where("available", "==", true).limit(4).get()
    .then(snap => {
      const items = snap.docs.map(d => d.data());
      renderDishCards(grid, items.length ? items : SAMPLE_DISHES);
    })
    .catch(() => {
      // Firebase isn't configured yet (placeholder config) or Firestore has
      // no data — show sample cards so the home page still looks complete.
      renderDishCards(grid, SAMPLE_DISHES);
    });
}

function renderDishCards(grid, items) {
  grid.innerHTML = items.map((i, idx) => `
    <div class="col-6 col-md-3 reveal" style="transition-delay:${idx * 0.08}s">
      <div class="pv-dish-card">
        <img src="${i.imageUrl || 'https://via.placeholder.com/400x260?text=' + encodeURIComponent(i.name)}" alt="${i.name}">
        <div class="body">
          <h6 class="mb-1">${i.name}</h6>
          <p class="text-muted small mb-1">${(i.description || "").slice(0, 50)}</p>
          <span class="price">${typeof formatMoney === "function" ? formatMoney(i.price) : i.price}</span>
        </div>
      </div>
    </div>
  `).join("");

  // Newly-injected .reveal elements need their own observer pass.
  setupScrollReveal();
}
