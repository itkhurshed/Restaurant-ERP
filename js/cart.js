// Cart lives in localStorage until checkout, when it's written to Firestore
// as an order document. Kept deliberately framework-free.

const CART_KEY = "proserve_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  // Merge identical configurations (same item, size, toppings, spice, notes)
  const key = JSON.stringify({ id: item.menuItemId, size: item.size, toppings: item.toppings, spiceLevel: item.spiceLevel, notes: item.notes });
  const existing = cart.find(c => JSON.stringify({ id: c.menuItemId, size: c.size, toppings: c.toppings, spiceLevel: c.spiceLevel, notes: c.notes }) === key);
  if (existing) {
    existing.qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function updateCartQty(index, qty) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = Math.max(1, qty);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function cartLineTotal(item) {
  let unit = item.price;
  if (item.toppings && item.toppings.length) {
    unit += item.toppings.reduce((s, t) => s + (t.price || 0), 0);
  }
  return unit * item.qty;
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => sum + cartLineTotal(item), 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const count = getCart().reduce((s, i) => s + i.qty, 0);
  badge.textContent = count;
  badge.classList.toggle("d-none", count === 0);
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
