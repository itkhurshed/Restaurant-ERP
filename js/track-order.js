// track-order.html?order=<firestoreDocId> — or a manual order-number lookup form.

const STATUS_STEPS = ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"];

function loadOrderById(id) {
  const box = document.getElementById("orderStatusBox");
  box.innerHTML = '<p class="text-muted">Loading order…</p>';
  db.collection("orders").doc(id).get().then(doc => {
    if (!doc.exists) {
      box.innerHTML = '<div class="alert alert-warning">No order found with that ID.</div>';
      return;
    }
    renderOrder({ id: doc.id, ...doc.data() });
  }).catch(err => {
    box.innerHTML = '<div class="alert alert-danger">' + err.message + '</div>';
  });
}

function lookupByNumber(orderNumber) {
  const box = document.getElementById("orderStatusBox");
  box.innerHTML = '<p class="text-muted">Searching…</p>';
  db.collection("orders").where("orderNumber", "==", orderNumber).limit(1).get().then(snap => {
    if (snap.empty) {
      box.innerHTML = '<div class="alert alert-warning">No order found with that number.</div>';
      return;
    }
    const doc = snap.docs[0];
    renderOrder({ id: doc.id, ...doc.data() });
  }).catch(err => {
    box.innerHTML = '<div class="alert alert-danger">' + err.message + '</div>';
  });
}

function renderOrder(order) {
  const box = document.getElementById("orderStatusBox");
  const stepIndex = order.status === "CANCELLED" ? -1 : STATUS_STEPS.indexOf(order.status);

  const stepsHtml = order.status === "CANCELLED"
    ? '<div class="alert alert-danger">This order was cancelled.</div>'
    : `<div class="d-flex flex-wrap gap-2 mb-3">${STATUS_STEPS.map((s, i) => `
        <span class="badge ${i <= stepIndex ? 'bg-dark' : 'bg-secondary'}">${s.replace(/_/g, " ")}</span>
      `).join("")}</div>`;

  box.innerHTML = `
    <h4>Order ${order.orderNumber}</h4>
    ${stepsHtml}
    <p><strong>Type:</strong> ${order.orderType.replace("_", " ")} &middot; <strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
    <table class="table table-sm">
      ${order.items.map(i => `<tr><td>${i.qty}&times; ${i.name}</td><td class="text-end">${formatMoney(i.price * i.qty)}</td></tr>`).join("")}
      <tr class="fw-bold"><td>Total</td><td class="text-end">${formatMoney(order.total)}</td></tr>
    </table>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(window.location.search).get("order");
  if (id) {
    loadOrderById(id);
  } else {
    document.getElementById("orderStatusBox").innerHTML = '<p class="text-muted">Enter your order number above to check its status.</p>';
  }

  document.getElementById("lookupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const num = document.getElementById("orderNumberInput").value.trim();
    if (num) lookupByNumber(num);
  });
});
