// customer-dashboard.html — loyalty points, order history, reservation
// history for the signed-in customer. Requires login.

function loadDashboard(user) {
  db.collection("customers").doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    document.getElementById("welcomeName").textContent = data.name || user.email;
    document.getElementById("loyaltyPoints").textContent = data.loyaltyPoints || 0;
  });

  db.collection("orders").where("customerId", "==", user.uid)
    .orderBy("createdAt", "desc").limit(20).get().then(snap => {
      const box = document.getElementById("orderHistory");
      if (snap.empty) {
        box.innerHTML = '<p class="text-muted">No orders yet. <a href="menu.html">Order something delicious.</a></p>';
        return;
      }
      box.innerHTML = snap.docs.map(d => {
        const o = d.data();
        return `<tr>
          <td>${o.orderNumber}</td>
          <td>${o.orderType.replace("_", " ")}</td>
          <td>${o.items.length} item(s)</td>
          <td>${formatMoney(o.total)}</td>
          <td><span class="badge bg-dark">${o.status}</span></td>
          <td><a href="track-order.html?order=${d.id}">Track</a></td>
        </tr>`;
      }).join("");
    }).catch(err => {
      document.getElementById("orderHistory").innerHTML =
        '<tr><td colspan="6" class="text-danger">' + err.message + '</td></tr>';
    });

  db.collection("reservations").where("customerId", "==", user.uid)
    .orderBy("createdAt", "desc").limit(10).get().then(snap => {
      const box = document.getElementById("reservationHistory");
      if (snap.empty) {
        box.innerHTML = '<p class="text-muted">No reservations yet. <a href="reservation.html">Book a table.</a></p>';
        return;
      }
      box.innerHTML = '<ul class="list-group">' + snap.docs.map(d => {
        const r = d.data();
        return `<li class="list-group-item d-flex justify-content-between">
          <span>${r.date} at ${r.time} &middot; ${r.guests} guests</span>
          <span class="badge bg-secondary">${r.status}</span>
        </li>`;
      }).join("") + '</ul>';
    });
}

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html?redirect=customer-dashboard.html";
      return;
    }
    loadDashboard(user);
  });
});
