// food-details.html?id=<menuItemId> — shows one dish with size/toppings/
// spice-level/notes options, then adds the configured line to the cart.

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

let currentItem = null;

function loadFoodDetails() {
  const id = getQueryParam("id");
  const box = document.getElementById("foodDetails");
  if (!id) {
    box.innerHTML = '<div class="alert alert-warning">No dish selected. <a href="menu.html">Back to menu</a>.</div>';
    return;
  }

  db.collection("menuItems").doc(id).get().then(doc => {
    if (!doc.exists) {
      box.innerHTML = '<div class="alert alert-warning">This dish could not be found. <a href="menu.html">Back to menu</a>.</div>';
      return;
    }
    currentItem = { id: doc.id, ...doc.data() };
    renderDetails();
  }).catch(err => {
    box.innerHTML = '<div class="alert alert-danger">Could not load this dish: ' + err.message + '</div>';
  });
}

function renderDetails() {
  const i = currentItem;
  const box = document.getElementById("foodDetails");

  const sizesHtml = (i.sizes || []).length ? `
    <label class="form-label fw-bold mt-3">Size</label>
    <div>
      ${i.sizes.map((s, idx) => `
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="size" id="size${idx}" value="${s.name}" data-delta="${s.priceDelta || 0}" ${idx === 0 ? "checked" : ""}>
          <label class="form-check-label" for="size${idx}">${s.name}${s.priceDelta ? ' (+' + formatMoney(s.priceDelta) + ')' : ''}</label>
        </div>
      `).join("")}
    </div>` : "";

  const toppingsHtml = (i.toppings || []).length ? `
    <label class="form-label fw-bold mt-3">Extra Toppings</label>
    <div>
      ${i.toppings.map((t, idx) => `
        <div class="form-check form-check-inline">
          <input class="form-check-input topping-check" type="checkbox" id="topping${idx}" value="${t.name}" data-price="${t.price || 0}">
          <label class="form-check-label" for="topping${idx}">${t.name}${t.price ? ' (+' + formatMoney(t.price) + ')' : ''}</label>
        </div>
      `).join("")}
    </div>` : "";

  box.innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        <img src="${i.imageUrl || 'https://via.placeholder.com/500x350?text=' + encodeURIComponent(i.name)}" class="img-fluid rounded" alt="${i.name}">
      </div>
      <div class="col-md-6">
        <h2>${i.name}</h2>
        <p class="text-muted">${i.description || ""}</p>
        <p class="fs-4 fw-bold text-success">${formatMoney(i.price)}</p>
        ${i.calories ? `<p class="small text-muted">${i.calories} kcal</p>` : ""}
        ${i.allergyInfo ? `<p class="small text-danger">Allergy info: ${i.allergyInfo}</p>` : ""}

        ${sizesHtml}
        ${toppingsHtml}

        <label class="form-label fw-bold mt-3">Spice Level</label>
        <select id="spiceLevel" class="form-select w-auto">
          <option value="Mild">Mild</option>
          <option value="Medium">Medium</option>
          <option value="Hot">Hot</option>
        </select>

        <label class="form-label fw-bold mt-3">Special Instructions</label>
        <textarea id="notes" class="form-control" rows="2" placeholder="e.g. no onions"></textarea>

        <label class="form-label fw-bold mt-3">Quantity</label>
        <input type="number" id="qty" class="form-control w-auto" value="1" min="1">

        <button id="addToCartBtn" class="btn btn-dark btn-lg mt-4">Add to Cart</button>
        <div id="addedMsg" class="text-success mt-2 d-none">Added to cart! <a href="cart.html">View cart</a></div>
      </div>
    </div>
  `;

  document.getElementById("addToCartBtn").addEventListener("click", handleAddToCart);
}

function handleAddToCart() {
  const sizeInput = document.querySelector('input[name="size"]:checked');
  const size = sizeInput ? sizeInput.value : null;
  const sizeDelta = sizeInput ? parseFloat(sizeInput.dataset.delta || 0) : 0;

  const toppings = Array.from(document.querySelectorAll(".topping-check:checked")).map(cb => ({
    name: cb.value,
    price: parseFloat(cb.dataset.price || 0)
  }));

  const spiceLevel = document.getElementById("spiceLevel").value;
  const notes = document.getElementById("notes").value;
  const qty = Math.max(1, parseInt(document.getElementById("qty").value || 1));

  addToCart({
    menuItemId: currentItem.id,
    name: currentItem.name,
    price: currentItem.price + sizeDelta,
    size: size,
    toppings: toppings,
    spiceLevel: spiceLevel,
    notes: notes,
    qty: qty
  });

  document.getElementById("addedMsg").classList.remove("d-none");
}

document.addEventListener("DOMContentLoaded", loadFoodDetails);
