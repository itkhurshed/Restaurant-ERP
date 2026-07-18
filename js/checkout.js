// checkout.html — order type, address, coupon, payment method, and
// "Place Order" which writes an order document to Firestore.

let appliedCoupon = null;

function renderCheckoutSummary() {
  const cart = getCart();
  const box = document.getElementById("checkoutItems");
  if (!cart.length) {
    box.innerHTML = '<p class="text-muted">Your cart is empty. <a href="menu.html">Browse the menu</a>.</p>';
    document.getElementById("placeOrderBtn").disabled = true;
    return;
  }
  box.innerHTML = cart.map(item => `
    <div class="d-flex justify-content-between border-bottom py-2">
      <div>
        <div>${item.qty}&times; ${item.name}</div>
        <small class="text-muted">${[item.size, item.spiceLevel, (item.toppings || []).map(t => t.name).join(", ")].filter(Boolean).join(" · ")}</small>
      </div>
      <div>${formatMoney(cartLineTotal(item))}</div>
    </div>
  `).join("");
  renderTotals();
}

function renderTotals() {
  const subtotal = cartSubtotal();
  const discount = appliedCoupon ? computeDiscount(subtotal, appliedCoupon) : 0;
  const tax = (subtotal - discount) * (TAX_RATE / 100);
  const orderType = document.getElementById("orderType").value;
  const deliveryCharge = orderType === "DELIVERY" ? 1.5 : 0;
  const total = subtotal - discount + tax + deliveryCharge;

  document.getElementById("checkoutTotals").innerHTML = `
    <div class="d-flex justify-content-between"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
    <div class="d-flex justify-content-between"><span>Discount</span><span>-${formatMoney(discount)}</span></div>
    <div class="d-flex justify-content-between"><span>Delivery charge</span><span>${formatMoney(deliveryCharge)}</span></div>
    <div class="d-flex justify-content-between"><span>Tax</span><span>${formatMoney(tax)}</span></div>
    <div class="d-flex justify-content-between fw-bold fs-5 border-top pt-2 mt-2"><span>Total</span><span>${formatMoney(total)}</span></div>
  `;
}

function computeDiscount(subtotal, coupon) {
  if (coupon.type === "PERCENT") return subtotal * (coupon.value / 100);
  if (coupon.type === "FIXED") return Math.min(subtotal, coupon.value);
  return 0;
}

function applyCoupon() {
  const code = document.getElementById("couponCode").value.trim();
  const msg = document.getElementById("couponMsg");
  if (!code) return;
  db.collection("coupons").where("code", "==", code).where("active", "==", true).limit(1).get().then(snap => {
    if (snap.empty) {
      msg.innerHTML = '<span class="text-danger">Invalid or expired coupon code.</span>';
      appliedCoupon = null;
    } else {
      appliedCoupon = snap.docs[0].data();
      msg.innerHTML = '<span class="text-success">Coupon applied!</span>';
    }
    renderTotals();
  }).catch(err => {
    msg.innerHTML = '<span class="text-danger">' + err.message + '</span>';
  });
}

function toggleDeliveryFields() {
  const isDelivery = document.getElementById("orderType").value === "DELIVERY";
  document.getElementById("deliveryFields").classList.toggle("d-none", !isDelivery);
  renderTotals();
}

function placeOrder() {
  const msg = document.getElementById("orderMsg");
  const cart = getCart();
  if (!cart.length) return;

  const orderType = document.getElementById("orderType").value;
  const customerName = document.getElementById("customerName").value || "Guest";
  const customerPhone = document.getElementById("customerPhone").value || "";
  const address = orderType === "DELIVERY" ? document.getElementById("deliveryAddress").value : "";
  const paymentMethod = document.getElementById("paymentMethod").value;

  const subtotal = cartSubtotal();
  const discount = appliedCoupon ? computeDiscount(subtotal, appliedCoupon) : 0;
  const tax = (subtotal - discount) * (TAX_RATE / 100);
  const deliveryCharge = orderType === "DELIVERY" ? 1.5 : 0;
  const total = subtotal - discount + tax + deliveryCharge;

  const user = auth.currentUser;
  const orderNumber = "ORD-" + Date.now().toString().slice(-8);

  const orderDoc = {
    orderNumber: orderNumber,
    customerId: user ? user.uid : null,
    customerName: customerName,
    customerPhone: customerPhone,
    orderType: orderType,
    address: address,
    items: cart,
    subtotal: round2(subtotal),
    discount: round2(discount),
    deliveryCharge: deliveryCharge,
    tax: round2(tax),
    total: round2(total),
    paymentMethod: paymentMethod,
    paymentStatus: "UNPAID", // a real payment gateway (KNET/Visa/etc.) would flip this after a successful charge
    status: "PENDING",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  document.getElementById("placeOrderBtn").disabled = true;
  db.collection("orders").add(orderDoc).then(ref => {
    clearCart();
    window.location.href = "track-order.html?order=" + ref.id;
  }).catch(err => {
    msg.innerHTML = '<div class="alert alert-danger">Could not place your order: ' + err.message + '</div>';
    document.getElementById("placeOrderBtn").disabled = false;
  });
}

function round2(v) { return Math.round(v * 100) / 100; }

document.addEventListener("DOMContentLoaded", () => {
  renderCheckoutSummary();
  document.getElementById("orderType").addEventListener("change", toggleDeliveryFields);
  document.getElementById("applyCouponBtn").addEventListener("click", applyCoupon);
  document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);

  auth.onAuthStateChanged(user => {
    if (user) {
      db.collection("customers").doc(user.uid).get().then(doc => {
        if (doc.exists) {
          document.getElementById("customerName").value = doc.data().name || "";
          document.getElementById("customerPhone").value = doc.data().phone || "";
        }
      });
    }
  });
});
